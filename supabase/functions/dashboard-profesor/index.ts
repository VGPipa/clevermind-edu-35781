import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';
import {
  getClassStage,
  isEvaluationStage,
  isPreparationStage,
  isClosureStage,
} from '../_shared/classStateStages.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    // Handle GET requests (no body) or POST requests (with body)
    let body: any = {};
    if (req.method === 'POST') {
      try {
        body = await req.json();
      } catch {
        // Body is optional
      }
    }
    
    const { supabase, profesor } = await authenticateProfesor(req, true);

    // Get optional fecha_referencia from body
    const fechaReferenciaParam = body.fecha_referencia;

    // Use current date for alert calculations (always)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use fecha_referencia for filtering if provided, otherwise use today
    const fechaReferencia = fechaReferenciaParam 
      ? new Date(fechaReferenciaParam)
      : new Date(today);
    fechaReferencia.setHours(0, 0, 0, 0);

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Get profesor's institution
    const { data: profesorData } = await supabase
      .from('profesores')
      .select('id_institucion')
      .eq('id', profesor.id)
      .single();

    // Get active academic year
    let anioActivo = null;
    if (profesorData?.id_institucion) {
      const { data: anio } = await supabase
        .from('anios_escolares')
        .select('*')
        .eq('id_institucion', profesorData.id_institucion)
        .eq('activo', true)
        .maybeSingle();
      anioActivo = anio;
    }

    // Get alert configuration
    let configAlertas = {
      rango_dias_clases_pendientes: 60,
      dias_urgente: 2,
      dias_proxima: 5,
      dias_programada: 14,
      dias_lejana: 999,
    };

    if (profesorData?.id_institucion) {
      const { data: config } = await supabase
        .from('configuracion_alertas')
        .select('*')
        .eq('id_institucion', profesorData.id_institucion)
        .maybeSingle();
      
      if (config) {
        configAlertas = {
          rango_dias_clases_pendientes: config.rango_dias_clases_pendientes,
          dias_urgente: config.dias_urgente,
          dias_proxima: config.dias_proxima,
          dias_programada: config.dias_programada,
          dias_lejana: config.dias_lejana,
        };
      }
    }

    // Classes this week
    const { count: classesThisWeek } = await supabase
      .from('clases')
      .select('id', { count: 'exact', head: true })
      .eq('id_profesor', profesor.id)
      .gte('fecha_programada', weekStart.toISOString())
      .lte('fecha_programada', today.toISOString());

    // Assigned subjects (via asignaciones_profesor)
    const { count: assignedSubjects } = await supabase
      .from('asignaciones_profesor')
      .select('id_materia', { count: 'exact', head: true })
      .eq('id_profesor', profesor.id);

    // Total students (count unique students in assigned grupos)
    const { data: grupos } = await supabase
      .from('asignaciones_profesor')
      .select('id_grupo')
      .eq('id_profesor', profesor.id);

    let totalStudents = 0;
    if (grupos && grupos.length > 0) {
      const grupoIds = grupos.map(g => g.id_grupo);
      const { data: gruposData } = await supabase
        .from('grupos')
        .select('cantidad_alumnos')
        .in('id', grupoIds);
      
      totalStudents = gruposData?.reduce((sum, g) => sum + (g.cantidad_alumnos || 0), 0) || 0;
    }

    // General average (from completed classes)
    const { data: results } = await supabase
      .from('resultados_clase')
      .select('promedio_puntaje, clases!inner(id_profesor)')
      .eq('clases.id_profesor', profesor.id);

    const generalAverage = results && results.length > 0
      ? results.reduce((sum, r) => sum + Number(r.promedio_puntaje || 0), 0) / results.length
      : 0;

    // Calculate date range for pending classes based on configuration
    const fechaFinRango = new Date(fechaReferencia);
    fechaFinRango.setDate(fechaReferencia.getDate() + configAlertas.rango_dias_clases_pendientes);

    // Get upcoming classes with optimized JOIN - FIXED N+1 problem
    const { data: upcomingClasses } = await supabase
      .from('clases')
      .select(`
        *,
        temas(
          nombre,
          materias(nombre)
        ),
        grupos(
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        ),
        guias_clase_versiones!clases_id_guia_version_actual_fkey(
          id,
          estado
        )
      `)
      .eq('id_profesor', profesor.id)
      .gte('fecha_programada', fechaReferencia.toISOString())
      .lte('fecha_programada', fechaFinRango.toISOString())
      .order('fecha_programada', { ascending: true });

    // Check for evaluations for each class
    const classesWithStatus = await Promise.all(
      (upcomingClasses || []).map(async (clase: any) => {
        const { data: quizzes } = await supabase
          .from('quizzes')
          .select('tipo, estado')
          .eq('id_clase', clase.id);

        const quizPre = quizzes?.find(q => q.tipo === 'previo');
        const quizPost = quizzes?.find(q => q.tipo === 'post');
        
        // Use pre-fetched data from JOIN
        const tema = clase.temas;
        const materia = tema?.materias;
        const grupo = clase.grupos;
        const guiaVersion = clase.guias_clase_versiones;
        
        // Calculate days remaining (based on today, not fecha_referencia)
        const fechaClase = new Date(clase.fecha_programada);
        fechaClase.setHours(0, 0, 0, 0);
        const diasRestantes = Math.ceil((fechaClase.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        // Classify by alert level (based on today)
        let nivelAlerta: 'urgente' | 'proxima' | 'programada' | 'lejana';
        if (diasRestantes <= configAlertas.dias_urgente) {
          nivelAlerta = 'urgente';
        } else if (diasRestantes <= configAlertas.dias_proxima) {
          nivelAlerta = 'proxima';
        } else if (diasRestantes <= configAlertas.dias_programada) {
          nivelAlerta = 'programada';
        } else {
          nivelAlerta = 'lejana';
        }
        
        const stage = getClassStage(clase.estado);

        return {
          ...clase,
          tema: tema ? { nombre: tema.nombre } : null,
          materia: materia ? { nombre: materia.nombre } : null,
          grupo: grupo ? { nombre: grupo.nombre, grado: grupo.grado, seccion: grupo.seccion } : null,
          quiz_pre: quizPre,
          quiz_post: quizPost,
          guia_estado: guiaVersion?.estado || null,
          tiene_guia: !!guiaVersion,
          tiene_eval_pre: !!quizPre,
          tiene_eval_post: !!quizPost,
          eval_pre_estado: quizPre?.estado || null,
          eval_post_estado: quizPost?.estado || null,
          dias_restantes: diasRestantes,
          nivel_alerta: nivelAlerta,
          stage,
        };
      })
    );

    // Separate into two sections based on stage
    const clasesPendientes = classesWithStatus.filter(
      (c) => isPreparationStage(c.estado) || isEvaluationStage(c.estado)
    );
    const clasesListas = classesWithStatus.filter(
      (c) => isClosureStage(c.estado)
    );
    
    // Latest recommendations
    const { data: recommendations } = await supabase
      .from('recomendaciones')
      .select(`
        id,
        contenido,
        created_at,
        clases!inner(id_profesor, temas!inner(nombre))
      `)
      .eq('clases.id_profesor', profesor.id)
      .eq('aplicada', false)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get materias asignadas with detailed information
    const { data: asignaciones } = await supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        id_materia,
        id_grupo,
        materias(
          id,
          nombre
        ),
        grupos(
          id,
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        )
      `)
      .eq('id_profesor', profesor.id);

    // Get temas count for each materia
    const { data: allMaterias } = await supabase
      .from('materias')
      .select(`
        id,
        nombre,
        temas(id)
      `);

    // Process materias to get stats
    const materiasMap = new Map();
    
    if (asignaciones) {
      for (const asig of asignaciones as any[]) {
        const materia = allMaterias?.find(m => m.id === asig.id_materia);
        if (!materia) continue;
        
        if (!materiasMap.has(materia.id)) {
          materiasMap.set(materia.id, {
            id: materia.id,
            nombre: materia.nombre,
            grupos: [],
            total_temas: materia.temas?.length || 0,
            total_estudiantes: 0,
          });
        }
        
        const materiaData = materiasMap.get(materia.id);
        materiaData.grupos.push({
          nombre: asig.grupos.nombre,
          grado: asig.grupos.grado,
          seccion: asig.grupos.seccion,
        });
        materiaData.total_estudiantes += asig.grupos.cantidad_alumnos || 0;
      }
    }

    // Calculate coverage for each materia
    const materiasAsignadas = await Promise.all(
      Array.from(materiasMap.values()).map(async (materia: any) => {
        // Get temas IDs for this materia
        const { data: temas } = await supabase
          .from('temas')
          .select('id')
          .eq('id_materia', materia.id);
        
        const temaIds = temas?.map(t => t.id) || [];
        
        if (temaIds.length === 0) {
          return {
            ...materia,
            secciones: materia.grupos.map((g: any) => `${g.grado}${g.seccion}`).join(', '),
            cobertura: 0,
          };
        }

        // Get total clases for this materia and profesor
        const { data: clasesMateria } = await supabase
          .from('clases')
          .select('id, estado')
          .eq('id_profesor', profesor.id)
          .in('id_tema', temaIds);

        const totalClasesEsperadas = materia.total_temas;
        const clasesCompletadas = clasesMateria?.filter(
          c => c.estado === 'completada' || c.estado === 'ejecutada'
        ).length || 0;
        
        const cobertura = totalClasesEsperadas > 0 
          ? Math.round((clasesCompletadas / totalClasesEsperadas) * 100)
          : 0;

        return {
          ...materia,
          secciones: materia.grupos.map((g: any) => `${g.grado}${g.seccion}`).join(', '),
          cobertura,
        };
      })
    );

    return createSuccessResponse({
      stats: {
        classes_this_week: classesThisWeek || 0,
        assigned_subjects: assignedSubjects || 0,
        total_students: totalStudents,
        general_average: Number(generalAverage.toFixed(1))
      },
      clases_pendientes: clasesPendientes,
      clases_listas: clasesListas,
      recommendations: recommendations || [],
      materias_asignadas: materiasAsignadas || [],
      anio_escolar: anioActivo,
      configuracion_alertas: configAlertas,
      fecha_referencia: fechaReferencia.toISOString(),
      fecha_actual: today.toISOString(),
    });

  } catch (error) {
    console.error('Error in dashboard-profesor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});

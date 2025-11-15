import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

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

    // Get upcoming classes within configured range
    const { data: upcomingClasses } = await supabase
      .from('clases')
      .select(`
        id,
        fecha_programada,
        estado,
        duracion_minutos,
        metodologia,
        numero_sesion,
        temas!inner(id, nombre, id_materia),
        grupos!inner(id, nombre, cantidad_alumnos, grado, seccion)
      `)
      .eq('id_profesor', profesor.id)
      .gte('fecha_programada', fechaReferencia.toISOString())
      .lte('fecha_programada', fechaFinRango.toISOString())
      .order('fecha_programada', { ascending: true });

    // Get materia names for each class
    const classesWithMaterias = await Promise.all(
      (upcomingClasses || []).map(async (clase: any) => {
        const { data: materia } = await supabase
          .from('materias')
          .select('nombre')
          .eq('id', clase.temas[0].id_materia)
          .single();

        return {
          ...clase,
          materia_nombre: materia?.nombre || 'Sin materia',
          tema_info: clase.temas[0],
          grupo_info: clase.grupos[0],
        };
      })
    );

    // Check for guides and evaluations for each class
    const classesWithStatus = await Promise.all(
      classesWithMaterias.map(async (clase: any) => {
        // Check for guide version (using new versioning system)
        const { data: guiaVersion } = await supabase
          .from('guias_clase_versiones')
          .select('id, estado')
          .eq('id_clase', clase.id)
          .maybeSingle();
        
        // Also check old guias_clase for backward compatibility
        const { data: guiaOld } = await supabase
          .from('guias_clase')
          .select('id')
          .eq('id_clase', clase.id)
          .maybeSingle();
        
        const tieneGuia = !!guiaVersion || !!guiaOld;
        
        const { data: evalPre } = await supabase
          .from('quizzes')
          .select('id, estado')
          .eq('id_clase', clase.id)
          .eq('tipo_evaluacion', 'pre')
          .maybeSingle();
        
        const { data: evalPost } = await supabase
          .from('quizzes')
          .select('id, estado')
          .eq('id_clase', clase.id)
          .eq('tipo_evaluacion', 'post')
          .maybeSingle();
        
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
        
        return {
          id: clase.id,
          fecha_programada: clase.fecha_programada,
          materia: clase.materia_nombre,
          tema: clase.tema_info.nombre,
          grupo: `${clase.grupo_info.grado} ${clase.grupo_info.seccion}`,
          estudiantes: clase.grupo_info.cantidad_alumnos || 0,
          estado: clase.estado,
          numero_sesion: clase.numero_sesion,
          tiene_guia: tieneGuia,
          tiene_eval_pre: !!evalPre,
          tiene_eval_post: !!evalPost,
          eval_pre_estado: evalPre?.estado || null,
          eval_post_estado: evalPost?.estado || null,
          dias_restantes: diasRestantes,
          nivel_alerta: nivelAlerta,
        };
      })
    );

    // Separate into two sections
    const clasesPendientes = classesWithStatus.filter(c => !c.tiene_guia || c.estado === 'borrador');
    const clasesListas = classesWithStatus.filter(c => c.tiene_guia && c.estado !== 'borrador');
    
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

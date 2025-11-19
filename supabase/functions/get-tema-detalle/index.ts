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
    const { supabase, profesor } = await authenticateProfesor(req, false);

    // Get tema ID from query params or body
    let temaId: string | null = null;
    
    try {
      const url = new URL(req.url);
      temaId = url.searchParams.get('tema_id') || url.searchParams.get('id');
      
      // If not in query params, try body
      if (!temaId && req.method === 'POST') {
        const body = await req.json();
        temaId = body.tema_id || body.id || null;
      }
    } catch (e) {
      // If GET request, try body anyway
      if (req.method === 'POST') {
        try {
          const body = await req.json();
          temaId = body.tema_id || body.id || null;
        } catch (e2) {
          // Ignore
        }
      }
    }

    if (!temaId) {
      return createErrorResponse('tema_id es requerido', 400);
    }

    // Get tema with relations
    const { data: tema, error: temaError } = await supabase
      .from('temas')
      .select(`
        id,
        nombre,
        descripcion,
        objetivos,
        duracion_estimada,
        bimestre,
        orden,
        id_materia,
        materias (
          id,
          nombre,
          descripcion,
          horas_semanales,
          plan_anual (
            grado,
            anio_escolar
          )
        )
      `)
      .eq('id', temaId)
      .single();

    if (temaError || !tema) {
      return createErrorResponse('Tema no encontrado', 404);
    }

    // Get guía maestra del profesor para este tema
    const { data: guiaTema, error: guiaError } = await supabase
      .from('guias_tema')
      .select('*')
      .eq('id_tema', temaId)
      .eq('id_profesor', profesor.id)
      .single();

    if (guiaError && guiaError.code !== 'PGRST116') {
      console.error('Error obteniendo guía maestra:', guiaError);
    }

    // Get asignaciones para obtener grupos
    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        id_grupo,
        grupos (
          id,
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        )
      `)
      .eq('id_profesor', profesor.id)
      .eq('id_materia', tema.id_materia);

    if (asignacionesError) {
      console.error('Error obteniendo asignaciones:', asignacionesError);
    }

    // Get all clases (sesiones) for this tema
    const { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select(`
        id,
        numero_sesion,
        fecha_programada,
        fecha_ejecutada,
        estado,
        duracion_minutos,
        id_grupo,
        id_guia_tema,
        grupos (
          id,
          nombre,
          grado,
          seccion
        )
      `)
      .eq('id_tema', temaId)
      .eq('id_profesor', profesor.id)
      .order('numero_sesion', { ascending: true });

    if (clasesError) {
      console.error('Error obteniendo clases:', clasesError);
    }

    // Group sesiones by salón (grupo)
    const sesionesPorSalon = new Map<string, any[]>();
    (clases || []).forEach((clase: any) => {
      const grupoId = clase.id_grupo;
      if (!sesionesPorSalon.has(grupoId)) {
        sesionesPorSalon.set(grupoId, []);
      }
      sesionesPorSalon.get(grupoId)!.push(clase);
    });

    // Build salones with sesiones
    const salones = Array.from(sesionesPorSalon.entries()).map(([grupoId, sesiones]) => {
      const asignacion = asignaciones?.find(a => a.id_grupo === grupoId);
      const grupo = asignacion?.grupos || sesiones[0]?.grupos;
      
      const completadas = sesiones.filter(s => s.estado === 'completada' || s.estado === 'ejecutada').length;
      const programadas = sesiones.filter(s => s.fecha_programada && s.estado !== 'completada' && s.estado !== 'ejecutada').length;
      const pendientes = (guiaTema?.total_sesiones || 0) - sesiones.length;

      return {
        grupo: {
          id: grupo?.id || grupoId,
          nombre: grupo?.nombre || 'Sin nombre',
          grado: grupo?.grado || '',
          seccion: grupo?.seccion || '',
          cantidad_alumnos: grupo?.cantidad_alumnos || 0,
        },
        sesiones,
        progreso: {
          completadas,
          programadas,
          pendientes,
          total: sesiones.length,
          porcentaje: guiaTema?.total_sesiones 
            ? Math.round((completadas / guiaTema.total_sesiones) * 100)
            : 0,
        },
      };
    });

    // Calculate overall progress
    const totalSesiones = clases?.length || 0;
    const sesionesCompletadas = clases?.filter(c => c.estado === 'completada' || c.estado === 'ejecutada').length || 0;
    const sesionesProgramadas = clases?.filter(c => c.fecha_programada && c.estado !== 'completada' && c.estado !== 'ejecutada').length || 0;
    const totalSesionesGuia = guiaTema?.total_sesiones || 0;
    const sesionesPendientes = totalSesionesGuia - totalSesiones;

    return createSuccessResponse({
      tema: {
        id: tema.id,
        nombre: tema.nombre,
        descripcion: tema.descripcion,
        objetivos: tema.objetivos,
        duracion_estimada: tema.duracion_estimada,
        bimestre: tema.bimestre,
        orden: tema.orden,
        materia: (() => {
          const materiaData: any = Array.isArray(tema.materias) ? tema.materias[0] : tema.materias;
          const planAnualData: any = Array.isArray(materiaData?.plan_anual) ? materiaData?.plan_anual[0] : materiaData?.plan_anual;
          return {
            id: materiaData?.id,
            nombre: materiaData?.nombre,
            horas_semanales: materiaData?.horas_semanales,
            grado: planAnualData?.grado,
          };
        })(),
      },
      guia_maestra: guiaTema ? {
        id: guiaTema.id,
        objetivos_generales: guiaTema.objetivos_generales,
        contenido: guiaTema.contenido,
        estructura_sesiones: guiaTema.estructura_sesiones,
        metodologias: guiaTema.metodologias,
        contexto_grupo: guiaTema.contexto_grupo,
        total_sesiones: guiaTema.total_sesiones,
        created_at: guiaTema.created_at,
        updated_at: guiaTema.updated_at,
      } : null,
      salones,
      progreso_general: {
        total_sesiones: totalSesionesGuia,
        sesiones_creadas: totalSesiones,
        sesiones_completadas: sesionesCompletadas,
        sesiones_programadas: sesionesProgramadas,
        sesiones_pendientes: sesionesPendientes,
        porcentaje: totalSesionesGuia > 0 
          ? Math.round((sesionesCompletadas / totalSesionesGuia) * 100)
          : 0,
      },
      tiene_guia_maestra: !!guiaTema,
      grupos_disponibles: asignaciones?.map(a => {
        const grupo = Array.isArray(a.grupos) ? a.grupos[0] : a.grupos;
        return {
          id: grupo?.id,
          nombre: grupo?.nombre,
          grado: grupo?.grado,
          seccion: grupo?.seccion,
        };
      }) || [],
    });

  } catch (error) {
    console.error('Error en get-tema-detalle:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});


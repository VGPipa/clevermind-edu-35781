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

    console.log('[DEBUG] Profesor autenticado:', {
      id: profesor.id,
      user_id: profesor.user_id
    });

    // Get clases (sesiones) with id_guia_tema (from temas con guía maestra)
    // Filter by estados pendientes (incluye sesiones recién programadas)
    const estadosPendientes = [
      'borrador',
      'programada',
      'generando_clase',
      'editando_guia',
      'guia_aprobada',
      'guia_final',
    ];

    console.log('[DEBUG] Consultando clases con filtros:', {
      id_profesor: profesor.id,
      estados: estadosPendientes
    });

    const { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select(`
        id,
        numero_sesion,
        fecha_programada,
        estado,
        duracion_minutos,
        id_tema,
        id_grupo,
        id_guia_tema,
        id_guia_version_actual,
        temas (
          id,
          nombre,
          id_materia,
          materias (
            id,
            nombre
          )
        ),
        grupos (
          id,
          nombre,
          grado,
          seccion
        ),
        guias_tema (
          id,
          total_sesiones
        )
      `)
      .eq('id_profesor', profesor.id)
      .not('id_guia_tema', 'is', null) // Solo clases con guía maestra (sesiones programadas desde temas)
      .in('estado', estadosPendientes)
      .order('fecha_programada', { ascending: true, nullsFirst: false })
      .order('numero_sesion', { ascending: true });

    console.log('[DEBUG] Resultados de consulta:', {
      total_clases: clases?.length || 0,
      error: clasesError,
      clases_ids: clases?.map(c => c.id) || [],
      primera_clase: clases?.[0] || null
    });

    if (clasesError) {
      console.error('Error obteniendo sesiones pendientes:', clasesError);
      throw clasesError;
    }

    // Format response - hacer mapeo robusto para manejar casos donde JOINs devuelven null
    const sesiones = (clases || [])
      .map((clase: any) => ({
        id: clase.id,
        numero_sesion: clase.numero_sesion,
        fecha_programada: clase.fecha_programada,
        estado: clase.estado,
        duracion_minutos: clase.duracion_minutos,
        tiene_guia: Boolean(clase.id_guia_version_actual),
        tema: clase.temas ? {
          id: clase.temas.id,
          nombre: clase.temas.nombre,
          materia: clase.temas.materias ? {
            id: clase.temas.materias.id,
            nombre: clase.temas.materias.nombre,
          } : null,
        } : null,
        grupo: clase.grupos ? {
          id: clase.grupos.id,
          nombre: clase.grupos.nombre,
          grado: clase.grupos.grado,
          seccion: clase.grupos.seccion,
        } : null,
        guia_tema: clase.guias_tema ? {
          id: clase.guias_tema.id,
          total_sesiones: clase.guias_tema.total_sesiones,
        } : null,
      }))
      .filter((s: any) => s.tema && s.grupo); // Filtrar sesiones sin tema o grupo válidos

    console.log('[DEBUG] Después del mapeo y filtro:', {
      total_sesiones: sesiones.length,
      sesiones_ids: sesiones.map(s => s.id),
      sesiones_completas: sesiones
    });

    // Find siguiente sesión disponible (first by fecha, then by numero_sesion)
    const siguienteSesion = sesiones.length > 0 
      ? sesiones.sort((a, b) => {
          // Sort by fecha_programada if both have it
          if (a.fecha_programada && b.fecha_programada) {
            return new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime();
          }
          // If only one has fecha, prioritize it
          if (a.fecha_programada) return -1;
          if (b.fecha_programada) return 1;
          // Otherwise sort by numero_sesion
          return (a.numero_sesion || 0) - (b.numero_sesion || 0);
        })[0]
      : null;

    return createSuccessResponse({
      sesiones,
      siguiente_sesion: siguienteSesion,
      total: sesiones.length,
    });

  } catch (error) {
    console.error('Error en get-sesiones-pendientes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});


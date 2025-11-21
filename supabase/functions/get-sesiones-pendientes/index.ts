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

    // Get clases (sesiones) with id_guia_tema (from temas with guía maestra)
    // Filter by estados pendientes (incluye sesiones recién programadas)
    const estadosPendientes = [
      'borrador',
      'generando_clase',
      'editando_guia',
      'guia_aprobada',
      'guia_final',
    ];

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
      .not('id_guia_tema', 'is', null)
      .in('estado', estadosPendientes)
      .order('fecha_programada', { ascending: true, nullsFirst: false })
      .order('numero_sesion', { ascending: true });

    if (clasesError) {
      console.error('Error obteniendo sesiones pendientes:', clasesError);
      throw clasesError;
    }

    // Format response
    const sesiones = (clases || []).map((clase: any) => ({
      id: clase.id,
      numero_sesion: clase.numero_sesion,
      fecha_programada: clase.fecha_programada,
      estado: clase.estado,
      duracion_minutos: clase.duracion_minutos,
      tema: {
        id: clase.temas?.id,
        nombre: clase.temas?.nombre,
        materia: {
          id: clase.temas?.materias?.id,
          nombre: clase.temas?.materias?.nombre,
        },
      },
      grupo: {
        id: clase.grupos?.id,
        nombre: clase.grupos?.nombre,
        grado: clase.grupos?.grado,
        seccion: clase.grupos?.seccion,
      },
      guia_tema: {
        id: clase.guias_tema?.id,
        total_sesiones: clase.guias_tema?.total_sesiones,
      },
    }));

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


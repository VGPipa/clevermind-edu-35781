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
    const { supabase, profesor } = await authenticateProfesor(req, true);

    const {
      id_tema,
      id_grupo,
      fecha_programada,
      duracion_minutos,
      grupo_edad,
      metodologia,
      contexto,
      areas_transversales,
      numero_sesion // Optional, will be calculated if not provided
    } = await req.json();

    console.log('Creating class for profesor:', profesor.id);

    // Get tema data to calculate recommended sessions
    const { data: tema, error: temaError } = await supabase
      .from('temas')
      .select('id, nombre, duracion_estimada')
      .eq('id', id_tema)
      .single();

    if (temaError || !tema) {
      return createErrorResponse('Tema no encontrado', 404);
    }

    // Calculate recommended number of sessions based on duracion_estimada (in weeks)
    // If duracion_estimada is 4 weeks, recommend 4 sessions
    const sesionesRecomendadas = tema.duracion_estimada || 1;

    // Obtener guía maestra para asegurar relación obligatoria
    const { data: guiaTema, error: guiaError } = await supabase
      .from('guias_tema')
      .select('id, total_sesiones')
      .eq('id_tema', id_tema)
      .eq('id_profesor', profesor.id)
      .maybeSingle();

    if (guiaError) {
      console.error('Error obteniendo guía maestra:', guiaError);
      return createErrorResponse('No se pudo obtener la guía maestra del tema', 500);
    }

    if (!guiaTema) {
      return createErrorResponse(
        'Debes crear la guía maestra del tema antes de generar una clase extraordinaria.',
        400
      );
    }

    // Get existing sessions for this tema+grupo+profesor to determine next numero_sesion
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('clases')
      .select('numero_sesion')
      .eq('id_profesor', profesor.id)
      .eq('id_tema', id_tema)
      .eq('id_grupo', id_grupo)
      .not('numero_sesion', 'is', null)
      .order('numero_sesion', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching existing sessions:', sessionsError);
    }

    // Calculate next session number
    let siguienteSesion: number;
    if (numero_sesion !== undefined && numero_sesion !== null) {
      siguienteSesion = numero_sesion;
    } else if (existingSessions && existingSessions.length > 0) {
      const maxSesion = Math.max(...existingSessions.map(s => s.numero_sesion || 0));
      siguienteSesion = maxSesion + 1;
    } else {
      siguienteSesion = 1;
    }

    // Check for previous class with same tema and grupo
    const { data: previousClass } = await supabase
      .from('clases')
      .select('id, observaciones')
      .eq('id_profesor', profesor.id)
      .eq('id_tema', id_tema)
      .eq('id_grupo', id_grupo)
      .eq('estado', 'completada')
      .order('fecha_ejecutada', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Create class with numero_sesion
    const { data: newClass, error: classError } = await supabase
      .from('clases')
      .insert({
        id_profesor: profesor.id,
        id_tema,
        id_grupo,
        fecha_programada,
        duracion_minutos,
        grupo_edad,
        metodologia,
        contexto,
        areas_transversales,
        numero_sesion: siguienteSesion,
        estado: 'generando_clase',
        id_guia_tema: guiaTema.id,
        total_sesiones_tema: guiaTema.total_sesiones
      })
      .select()
      .single();

    if (classError) {
      console.error('Error creating class:', classError);
      return createErrorResponse(classError.message, 500);
    }

    // If previous class exists, generate recommendation
    let recommendation = null;
    if (previousClass) {
      const { data: rec } = await supabase
        .from('recomendaciones')
        .insert({
          id_clase: newClass.id,
          id_clase_anterior: previousClass.id,
          contenido: previousClass.observaciones || 'Revisar resultados de la clase anterior',
          aplicada: false,
          tipo: 'clase_anterior'
        })
        .select()
        .single();
      
      recommendation = rec;
    }

    // Get all sessions for this tema to return in response
    const { data: allSessions } = await supabase
      .from('clases')
      .select('id, numero_sesion, fecha_programada, estado')
      .eq('id_profesor', profesor.id)
      .eq('id_tema', id_tema)
      .eq('id_grupo', id_grupo)
      .order('numero_sesion', { ascending: true });

    return createSuccessResponse({
      class: newClass,
      previousClass,
      recommendation,
      sesiones_recomendadas: sesionesRecomendadas,
      sesiones_creadas: allSessions || [],
      sesion_actual: siguienteSesion,
      total_sesiones: allSessions?.length || 0
    });
  } catch (error) {
    console.error('Error in crear-clase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});
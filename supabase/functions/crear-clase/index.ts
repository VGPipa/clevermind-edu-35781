import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
  createSupabaseClient,
} from '../_shared/auth.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, true);

    const {
      id_tema,
      id_materia,
      tema_libre,
      id_grupo,
      fecha_programada,
      duracion_minutos,
      grupo_edad,
      metodologia,
      contexto,
      observaciones,
      areas_transversales,
      numero_sesion // Optional, will be calculated if not provided
    } = await req.json();

    console.log('Creating class for profesor:', profesor.id);

    let idTemaFinal = id_tema;
    let tema: any = null;

    // Si tema_libre está presente, crear un tema temporal
    if (tema_libre && tema_libre.trim() && id_materia) {
      console.log('Creating temporary theme:', tema_libre);
      
      // Crear un cliente con service role sin headers de auth para bypassear RLS
      const supabaseServiceRole = createSupabaseClient(null, true);
      
      console.log('Insert data:', {
        id_materia,
        nombre: tema_libre.trim(),
        es_tema_temporal: true,
        descripcion: '',
        duracion_estimada: 1
      });
      
      const { data: temaTemporal, error: temaError } = await supabaseServiceRole
        .from('temas')
        .insert({
          id_materia,
          nombre: tema_libre.trim(),
          es_tema_temporal: true,
          descripcion: '',
          duracion_estimada: 1
        })
        .select()
        .single();
      
      if (temaError) {
        console.error('Error creating temporary theme:', JSON.stringify(temaError, null, 2));
        console.error('Error details:', {
          message: temaError.message,
          details: temaError.details,
          hint: temaError.hint,
          code: temaError.code
        });
        return createErrorResponse(
          `No se pudo crear el tema temporal: ${temaError.message || 'Error desconocido'}`,
          500
        );
      }
      
      idTemaFinal = temaTemporal.id;
      tema = temaTemporal;
    } else if (id_tema) {
      // Get tema data to calculate recommended sessions
      const { data: temaData, error: temaError } = await supabase
        .from('temas')
        .select('id, nombre, duracion_estimada')
        .eq('id', id_tema)
        .single();

      if (temaError || !temaData) {
        return createErrorResponse('Tema no encontrado', 404);
      }
      
      tema = temaData;
    } else {
      return createErrorResponse('Se debe proporcionar id_tema o tema_libre con id_materia', 400);
    }

    // Calculate recommended number of sessions based on duracion_estimada (in weeks)
    // If duracion_estimada is 4 weeks, recommend 4 sessions
    const sesionesRecomendadas = tema.duracion_estimada || 1;

    // Obtener guía maestra (solo si no es tema temporal)
    let guiaTema = null;
    if (!tema.es_tema_temporal) {
      const { data: guiaData, error: guiaError } = await supabase
        .from('guias_tema')
        .select('id, total_sesiones')
        .eq('id_tema', idTemaFinal)
        .eq('id_profesor', profesor.id)
        .maybeSingle();

      if (guiaError) {
        console.error('Error obteniendo guía maestra:', guiaError);
        return createErrorResponse('No se pudo obtener la guía maestra del tema', 500);
      }

      guiaTema = guiaData;
      // Solo requerir guía si no es tema temporal
      if (!guiaTema) {
        return createErrorResponse(
          'Debes crear la guía maestra del tema antes de generar una clase extraordinaria.',
          400
        );
      }
    }

    // Get existing sessions for this tema+grupo+profesor to determine next numero_sesion
    const { data: existingSessions, error: sessionsError } = await supabase
      .from('clases')
      .select('numero_sesion')
      .eq('id_profesor', profesor.id)
      .eq('id_tema', idTemaFinal)
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
      .eq('id_tema', idTemaFinal)
      .eq('id_grupo', id_grupo)
      .eq('estado', 'completada')
      .order('fecha_ejecutada', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Create class with numero_sesion
    const insertPayload: Record<string, any> = {
      id_profesor: profesor.id,
      id_tema: idTemaFinal,
      id_grupo,
      fecha_programada,
      duracion_minutos,
      grupo_edad,
      metodologia,
      contexto,
      observaciones,
      areas_transversales,
      numero_sesion: siguienteSesion,
      estado: 'generando_clase',
      id_guia_tema: guiaTema?.id || null, // Nullable para temas temporales
      total_sesiones_tema: guiaTema?.total_sesiones || null,
    };

    const { data: newClass, error: classError } = await supabase
      .from('clases')
      .insert(insertPayload)
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
      .eq('id_tema', idTemaFinal)
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
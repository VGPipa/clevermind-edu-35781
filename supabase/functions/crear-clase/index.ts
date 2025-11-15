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
      areas_transversales
    } = await req.json();

    console.log('Creating class for profesor:', profesor.id);

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
      .single();

    // Create class
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
        estado: 'borrador'
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
          aplicada: false
        })
        .select()
        .single();
      
      recommendation = rec;
    }

    return createSuccessResponse({
      class: newClass,
      previousClass,
      recommendation
    });
  } catch (error) {
    console.error('Error in crear-clase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});
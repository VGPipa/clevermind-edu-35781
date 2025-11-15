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

    const { id_quiz } = await req.json();

    if (!id_quiz) {
      return createErrorResponse('id_quiz es requerido', 400);
    }

    console.log('Sending quiz:', id_quiz);

    // Get quiz and verify it belongs to profesor's class
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select(`
        id,
        id_clase,
        tipo_evaluacion,
        estado,
        clases!inner(id_profesor)
      `)
      .eq('id', id_quiz)
      .single();

    if (quizError || !quiz) {
      return createErrorResponse('Quiz no encontrado', 404);
    }

    // Verify profesor owns this class
    if ((quiz.clases as any)?.id_profesor !== profesor.id) {
      return createErrorResponse('No autorizado para enviar este quiz', 403);
    }

    // Verify quiz is in a valid state to be sent
    if (quiz.estado === 'publicado') {
      return createErrorResponse('El quiz ya ha sido enviado', 400);
    }

    if (quiz.estado !== 'borrador' && quiz.estado !== 'aprobado') {
      return createErrorResponse(`El quiz no puede ser enviado desde el estado: ${quiz.estado}`, 400);
    }

    const tipo = quiz.tipo_evaluacion;
    if (!tipo || !['pre', 'post'].includes(tipo)) {
      return createErrorResponse('Tipo de evaluación inválido', 400);
    }

    // Update quiz to published
    const fechaEnvio = new Date().toISOString();
    const { error: updateQuizError } = await supabase
      .from('quizzes')
      .update({
        estado: 'publicado',
        fecha_envio: fechaEnvio,
      })
      .eq('id', id_quiz);

    if (updateQuizError) {
      console.error('Error updating quiz:', updateQuizError);
      return createErrorResponse(updateQuizError.message, 500);
    }

    // Update clase state based on quiz type
    let nuevoEstadoClase: string;
    if (tipo === 'pre') {
      nuevoEstadoClase = 'quiz_pre_enviado';
    } else {
      // tipo === 'post'
      nuevoEstadoClase = 'quiz_post_enviado';
    }

    const { error: updateClaseError } = await supabase
      .from('clases')
      .update({
        estado: nuevoEstadoClase as any
      })
      .eq('id', quiz.id_clase);

    if (updateClaseError) {
      console.error('Error updating clase:', updateClaseError);
      // Don't fail the whole operation, just log it
      console.warn('Could not update clase state, but quiz was sent');
    }

    // TODO: Send notifications to alumnos
    // This would involve:
    // 1. Get all alumnos in the grupo
    // 2. Create notification records or send push notifications
    // 3. For now, we just prepare the structure

    return createSuccessResponse({
      success: true,
      message: `Quiz ${tipo === 'pre' ? 'PRE' : 'POST'} enviado exitosamente`,
      quiz_id: id_quiz,
      fecha_envio: fechaEnvio,
      clase_estado: nuevoEstadoClase,
      tipo: tipo,
    });
  } catch (error) {
    console.error('Error in enviar-quiz:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


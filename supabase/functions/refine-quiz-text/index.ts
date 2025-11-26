import { callAI } from '../_shared/ai.ts';
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
    const { quiz_id, currentText, instruction, userIntent } = await req.json();

    if (!quiz_id || !currentText || !userIntent) {
      return createErrorResponse('Faltan parámetros para refinar el texto', 400);
    }

    if (!['regenerate', 'custom'].includes(userIntent)) {
      return createErrorResponse('userIntent inválido', 400);
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, id_clase, instrucciones, tipo_evaluacion')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz) {
      return createErrorResponse('Quiz no encontrado', 404);
    }

    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select(`
        id,
        id_profesor,
        grupo_edad,
        metodologia,
        temas!inner(nombre, descripcion, objetivos)
      `)
      .eq('id', quiz.id_clase)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada', 404);
    }

    if (clase.id_profesor !== profesor.id) {
      return createErrorResponse('No autorizado para modificar este quiz', 403);
    }

    const temaNombre = (clase.temas as any)?.nombre || 'la sesión';
    const temaDescripcion = (clase.temas as any)?.descripcion || '';
    const objetivos = (clase.temas as any)?.objetivos || '';

    const systemPrompt = `Eres un redactor pedagógico que escribe textos introductorios breves para quizzes diagnósticos.
Debes mantener un tono motivador, concreto y amigable.`;

    const actionPrompt =
      userIntent === 'regenerate'
        ? 'Genera un texto completamente nuevo de máximo 120 palabras que prepare al estudiante para el quiz.'
        : `Modifica el texto actual siguiendo esta instrucción del profesor: "${instruction || 'Mejora el texto manteniendo su intención original'}".`;

    const userPrompt = `Contexto del tema:
- Tema: ${temaNombre}
- Descripción: ${temaDescripcion}
- Objetivos: ${objetivos}
- Grupo de edad: ${clase.grupo_edad || 'General'}
- Metodologías: ${clase.metodologia || 'No especificadas'}

Texto actual:
"""
${currentText}
"""

${actionPrompt}

Requisitos:
- Debe sentirse como una breve lectura teórica previa al quiz
- Usa ejemplos concretos y una invitación a reflexionar
- Evita repetir frases del texto original palabra por palabra
- Extensión máxima: 120 palabras.`;

    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      temperature: 0.65,
      maxTokens: 600,
    });

    const newText = aiResponse.content?.trim();

    if (!newText) {
      return createErrorResponse('La IA no devolvió contenido válido', 500);
    }

    const { error: updateQuizError } = await supabase
      .from('quizzes')
      .update({ instrucciones: newText })
      .eq('id', quiz_id);

    if (updateQuizError) {
      console.error('Error updating quiz text:', updateQuizError);
      return createErrorResponse(updateQuizError.message, 500);
    }

    const { error: updateQuestionsError } = await supabase
      .from('preguntas')
      .update({ texto_contexto: newText })
      .eq('id_quiz', quiz_id);

    if (updateQuestionsError) {
      console.error('Error updating question contexts:', updateQuestionsError);
    }

    return createSuccessResponse({ texto: newText });
  } catch (error) {
    console.error('Error in refine-quiz-text:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(message, 500);
  }
});


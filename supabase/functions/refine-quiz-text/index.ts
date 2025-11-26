declare const Deno: any;

import { callAI } from '../_shared/ai.ts';
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

function buildGuideContext(guide: any) {
  if (!guide) {
    return 'No hay detalles adicionales de la guía.';
  }

  const objetivosList = typeof guide.objetivos === 'string'
    ? guide.objetivos.split('\n').map((item: string) => item.trim()).filter(Boolean)
    : [];

  const objetivosTexto = objetivosList.length
    ? objetivosList.map((obj: string, idx: number) => `${idx + 1}. ${obj}`).join('\n')
    : 'No se especificaron objetivos detallados.';

  const estructuraArray = Array.isArray(guide.estructura) ? guide.estructura : [];
  const estructuraTexto = estructuraArray.length
    ? estructuraArray.slice(0, 4).map((fase: any, idx: number) => {
        const titulo = fase.titulo || fase.actividad || `Fase ${idx + 1}`;
        const detalle = fase.descripcion || fase.detalle || fase.contexto || '';
        return `${idx + 1}. ${titulo}: ${detalle}`;
      }).join('\n')
    : 'No hay estructura detallada.';

  const preguntasSocraticasTexto = Array.isArray(guide.preguntas_socraticas) && guide.preguntas_socraticas.length
    ? guide.preguntas_socraticas.slice(0, 3).map((q: string, idx: number) => `${idx + 1}. ${q}`).join('\n')
    : '';

  return `Objetivos esenciales:\n${objetivosTexto}\n\nEstructura clave:\n${estructuraTexto}${
    preguntasSocraticasTexto ? `\n\nPreguntas guía:\n${preguntasSocraticasTexto}` : ''
  }`;
}

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
        id_guia_version_actual,
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

    let guideContext = 'No hay información adicional de la guía.';
    if (clase.id_guia_version_actual) {
      const { data: guideVersion } = await supabase
        .from('guias_clase_versiones')
        .select('objetivos, estructura, preguntas_socraticas')
        .eq('id', clase.id_guia_version_actual)
        .maybeSingle();
      guideContext = buildGuideContext(guideVersion);
    }

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

Resumen de la guía y corazón teórico:
${guideContext}

${actionPrompt}

Requisitos:
- Debe sentirse como una breve lectura teórica previa al quiz
- Usa ejemplos concretos y una invitación a reflexionar
- Evita repetir frases del texto original palabra por palabra
- Resalta una idea central (concepto, analogía o pregunta guía) de la clase para mantener continuidad.
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
      const { error: revertError } = await supabase
        .from('quizzes')
        .update({ instrucciones: currentText })
        .eq('id', quiz_id);

      if (revertError) {
        console.error('Error reverting quiz text after preguntas failure:', revertError);
      }

      return createErrorResponse(
        'No se pudo actualizar el contexto de todas las preguntas. Los cambios no fueron guardados.',
        500
      );
    }

    return createSuccessResponse({ texto: newText });
  } catch (error) {
    console.error('Error in refine-quiz-text:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(message, 500);
  }
});


import { callAI, parseAIJSON } from '../_shared/ai.ts';
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

function buildGuideContext(guide: any) {
  if (!guide) {
    return 'No hay detalles de la guía disponibles.';
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

  return `Objetivos esenciales:\n${objetivosTexto}\n\nEstructura de referencia:\n${estructuraTexto}${
    preguntasSocraticasTexto ? `\n\nPreguntas guía:\n${preguntasSocraticasTexto}` : ''
  }`;
}

interface AIPregunta {
  texto_pregunta: string;
  tipo?: string;
  opciones: string[];
  indice_correcto: number;
  retroalimentacion?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, true);
    const { quiz_id, question_id, action, difficulty } = await req.json();

    if (!quiz_id || !question_id || !action) {
      return createErrorResponse('Faltan parámetros para modificar la pregunta', 400);
    }

    if (!['swap', 'adjust_difficulty'].includes(action)) {
      return createErrorResponse('Acción no soportada', 400);
    }

    if (action === 'adjust_difficulty' && !['easier', 'harder'].includes(difficulty)) {
      return createErrorResponse('Debes indicar difficulty: "easier" o "harder"', 400);
    }

    const { data: pregunta, error: preguntaError } = await supabase
      .from('preguntas')
      .select('id, id_quiz, texto_pregunta, tipo, opciones, respuesta_correcta, justificacion, texto_contexto, orden')
      .eq('id', question_id)
      .single();

    if (preguntaError || !pregunta) {
      return createErrorResponse('Pregunta no encontrada', 404);
    }

    if (pregunta.id_quiz !== quiz_id) {
      return createErrorResponse('La pregunta no pertenece al quiz indicado', 400);
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
      return createErrorResponse('No autorizado para modificar esta pregunta', 403);
    }

    const tema = (clase.temas as any)?.nombre || 'la sesión';
    const descripcionTema = (clase.temas as any)?.descripcion || '';
    const objetivos = (clase.temas as any)?.objetivos || '';
    const lecturaBase = quiz.instrucciones || pregunta.texto_contexto || '';

    let guideContext = 'Sin información adicional de la guía.';
    if (clase.id_guia_version_actual) {
      const { data: guideVersion } = await supabase
        .from('guias_clase_versiones')
        .select('objetivos, estructura, preguntas_socraticas')
        .eq('id', clase.id_guia_version_actual)
        .maybeSingle();
      guideContext = buildGuideContext(guideVersion);
    }

    const systemPrompt = `Eres un generador de preguntas de opción múltiple para diagnósticos educativos.
Responde únicamente en formato JSON.`;

    const actionInstructions =
      action === 'swap'
        ? 'Genera una nueva pregunta completamente distinta sobre el mismo tema.'
        : `Reescribe la pregunta para que sea ${
            difficulty === 'easier' ? 'más sencilla y accesible' : 'más desafiante'
          }, manteniendo el mismo aprendizaje objetivo.`;

    const userPrompt = `Contexto del tema:
- Tema: ${tema}
- Descripción: ${descripcionTema}
- Objetivos: ${objetivos}
- Grupo de edad: ${clase.grupo_edad || 'General'}
- Metodologías: ${clase.metodologia || 'No especificadas'}

Lectura base:
"""
${lecturaBase}
"""

Resumen de la guía que contiene el corazón teórico de la clase:
${guideContext}

Pregunta actual:
"""
${pregunta.texto_pregunta}
"""
Opciones actuales: ${(pregunta.opciones as any) || '[]'}

${actionInstructions}
- Mantén la conexión con los objetivos y la estructura descritos arriba; el enunciado debe reflejar explícitamente ese corazón teórico.

Devuelve JSON con la forma:
{
  "texto_pregunta": "...",
  "tipo": "conocimiento|analisis|aplicacion|razonamiento",
  "opciones": ["A", "B", "C", "D"],
  "indice_correcto": 1,
  "retroalimentacion": "..."
}`;

    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 1200,
    });

    const parsed = parseAIJSON<AIPregunta>(aiResponse.content);

    if (!parsed || !parsed.texto_pregunta) {
      return createErrorResponse('La IA no devolvió una pregunta válida', 500);
    }

    const opciones = Array.isArray(parsed.opciones) ? parsed.opciones : [];
    const opcionesMap = opciones.map((texto, index) => ({
      id: `option-${index + 1}`,
      label: texto,
    }));
    const correcta =
      opcionesMap[parsed.indice_correcto] || opcionesMap[0] || { id: 'option-1', label: '' };

    const { data: updatedQuestion, error: updateError } = await supabase
      .from('preguntas')
      .update({
        texto_pregunta: parsed.texto_pregunta,
        tipo: (parsed.tipo || pregunta.tipo) as any,
        opciones: opcionesMap,
        respuesta_correcta: correcta.id,
        justificacion: parsed.retroalimentacion || pregunta.justificacion,
        texto_contexto: lecturaBase,
      })
      .eq('id', question_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating question:', updateError);
      return createErrorResponse(updateError.message, 500);
    }

    return createSuccessResponse({
      pregunta: updatedQuestion,
    });
  } catch (error) {
    console.error('Error in modify-single-question:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(message, 500);
  }
});


import { callAI, parseAIJSON } from '../_shared/ai.ts';
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

function buildGuideContext(guide: any) {
  if (!guide) {
    return 'No hay detalles suficientes de la guía.';
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
    : 'La estructura de la clase no fue detallada.';

  const preguntasSocraticasTexto = Array.isArray(guide.preguntas_socraticas) && guide.preguntas_socraticas.length
    ? guide.preguntas_socraticas.slice(0, 3).map((q: string, idx: number) => `${idx + 1}. ${q}`).join('\n')
    : '';

  return `Objetivos principales:\n${objetivosTexto}\n\nEstructura clave:\n${estructuraTexto}${
    preguntasSocraticasTexto ? `\n\nPreguntas guía:\n${preguntasSocraticasTexto}` : ''
  }`;
}

interface AIPregunta {
  texto_pregunta: string;
  tipo?: string;
  opciones?: string[];
  indice_correcto?: number;
  retroalimentacion?: string;
  tipo_respuesta?: 'multiple_choice' | 'texto_abierto';
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, true);
    const { quiz_id, clase_id } = await req.json();

    if (!quiz_id) {
      return createErrorResponse('Debes proporcionar quiz_id', 400);
    }

    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, id_clase, instrucciones, tipo_evaluacion')
      .eq('id', quiz_id)
      .single();

    if (quizError || !quiz) {
      return createErrorResponse('Quiz no encontrado', 404);
    }

    if (clase_id && clase_id !== quiz.id_clase) {
      return createErrorResponse('El quiz no corresponde a la clase indicada', 400);
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
      return createErrorResponse('No autorizado para regenerar preguntas de este quiz', 403);
    }

    const tema = (clase.temas as any)?.nombre || 'la sesión';
    const descripcionTema = (clase.temas as any)?.descripcion || '';
    const objetivos = (clase.temas as any)?.objetivos || '';
    const isPre = quiz.tipo_evaluacion === 'pre';
    const lecturaBase = isPre
      ? quiz.instrucciones || 'Lectura introductoria no especificada.'
      : null;

    let guideContext = 'No hay detalles suficientes de la guía.';
    if (clase.id_guia_version_actual) {
      const { data: guideVersion } = await supabase
        .from('guias_clase_versiones')
        .select('objetivos, estructura, preguntas_socraticas')
        .eq('id', clase.id_guia_version_actual)
        .maybeSingle();
      guideContext = buildGuideContext(guideVersion);
    }

    const systemPrompt = `Eres un diseñador de evaluaciones diagnósticas y sumativas para pensamiento crítico.
Generas preguntas de alta calidad y estableces claramente el tipo de respuesta (opción múltiple o texto abierto).`;

    const questionCount = isPre ? 3 : 10;

    const userPrompt = `${isPre ? 'Genera exactamente 3 preguntas diagnósticas PRE' : 'Genera exactamente 10 preguntas POST sumativas'} para el siguiente contexto:

Tema: ${tema}
Descripción: ${descripcionTema}
Objetivos: ${objetivos}
Grupo de edad: ${clase.grupo_edad || 'General'}
Metodologías: ${clase.metodologia || 'No especificadas'}
${
  isPre
    ? `Lectura base para el estudiante:
"""
${lecturaBase}
"""
`
    : ''
}
Resumen de la guía y corazón teórico:
${guideContext}

Requisitos:
- Si la pregunta es de opción múltiple, define 4 opciones claras y una única respuesta correcta.
- Si la pregunta es de texto abierto, define "tipo_respuesta": "texto_abierto" y omite las opciones.
- Alterna niveles cognitivos y vincula cada situación con los objetivos descritos.

Devuelve JSON con la forma:
{
  "preguntas": [
    {
      "texto_pregunta": "¿...?",
      "tipo": "conocimiento|analisis|aplicacion|razonamiento",
      "tipo_respuesta": "multiple_choice" | "texto_abierto",
      "opciones": ["A", "B", "C", "D"],
      "indice_correcto": 1,
      "retroalimentacion": "Explicación breve"
    }
  ]
}`;

    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.65,
      maxTokens: 1600,
    });

    const parsed = parseAIJSON<{ preguntas: AIPregunta[] }>(aiResponse.content);

    if (!parsed.preguntas || parsed.preguntas.length === 0) {
      return createErrorResponse('La IA no devolvió preguntas válidas', 500);
    }

    const preguntas = parsed.preguntas.slice(0, questionCount);

    const { error: deleteError } = await supabase
      .from('preguntas')
      .delete()
      .eq('id_quiz', quiz_id);

    if (deleteError) {
      console.error('Error deleting previous questions:', deleteError);
      return createErrorResponse(deleteError.message, 500);
    }

    const mapOpciones = (opciones?: string[]): Array<{ id: string; label: string }> => {
      const sanitized = Array.isArray(opciones) ? opciones : [];
      return sanitized.map((texto, index) => ({
        id: `option-${index + 1}`,
        label: texto,
      }));
    };

    const preguntasToInsert = preguntas.map((pregunta, index) => {
      const isMultipleChoice = pregunta.tipo_respuesta !== 'texto_abierto';
      const opciones = isMultipleChoice ? mapOpciones(pregunta.opciones) : [];
      const correctOption =
        isMultipleChoice
          ? opciones[pregunta.indice_correcto ?? 0] || opciones[0] || { id: 'option-1', label: '' }
          : null;

      return {
        id_quiz: quiz_id,
        texto_pregunta: pregunta.texto_pregunta,
        tipo: 'opcion_multiple',
        orden: index + 1,
        opciones,
        respuesta_correcta: correctOption ? correctOption.id : null,
        justificacion: pregunta.retroalimentacion || null,
        texto_contexto: lecturaBase,
      };
    });

    const { data: insertedQuestions, error: insertError } = await supabase
      .from('preguntas')
      .insert(preguntasToInsert)
      .select('*')
      .order('orden');

    if (insertError) {
      console.error('Error inserting regenerated questions:', insertError);
      return createErrorResponse(insertError.message, 500);
    }

    return createSuccessResponse({
      quiz_id,
      preguntas: insertedQuestions,
    });
  } catch (error) {
    console.error('Error in regenerate-quiz-questions:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(message, 500);
  }
});


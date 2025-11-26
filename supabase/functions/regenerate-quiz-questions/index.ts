import { callAI, parseAIJSON } from '../_shared/ai.ts';
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

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
    const lecturaBase = quiz.instrucciones || 'Lectura introductoria no especificada.';

    const systemPrompt = `Eres un diseñador de evaluaciones diagnósticas para pensamiento crítico.
Generas preguntas de opción múltiple con 4 alternativas y una respuesta correcta.`;

    const userPrompt = `Genera exactamente 3 preguntas diagnósticas PRE para el siguiente contexto:

Tema: ${tema}
Descripción: ${descripcionTema}
Objetivos: ${objetivos}
Grupo de edad: ${clase.grupo_edad || 'General'}
Metodologías: ${clase.metodologia || 'No especificadas'}
Lectura base para el estudiante:
"""
${lecturaBase}
"""

Requisitos:
- Enfócate en comprobar conocimientos previos teóricos.
- Cada pregunta debe tener 4 opciones claras y una única respuesta correcta.
- Alterna los verbos e introduce ejemplos concretos relacionados con la lectura.

Devuelve un JSON con esta forma:
{
  "preguntas": [
    {
      "texto_pregunta": "¿...?",
      "tipo": "conocimiento|analisis|aplicacion|razonamiento",
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

    const preguntas = parsed.preguntas.slice(0, 3);

    const { error: deleteError } = await supabase
      .from('preguntas')
      .delete()
      .eq('id_quiz', quiz_id);

    if (deleteError) {
      console.error('Error deleting previous questions:', deleteError);
      return createErrorResponse(deleteError.message, 500);
    }

    const mapOpciones = (opciones: string[]): Array<{ id: string; label: string }> => {
      const sanitized = Array.isArray(opciones) ? opciones : [];
      return sanitized.map((texto, index) => ({
        id: `option-${index + 1}`,
        label: texto,
      }));
    };

    const preguntasToInsert = preguntas.map((pregunta, index) => {
      const opciones = mapOpciones(pregunta.opciones);
      const correctOption =
        opciones[pregunta.indice_correcto] || opciones[0] || { id: 'option-1', label: '' };

      return {
        id_quiz: quiz_id,
        texto_pregunta: pregunta.texto_pregunta,
        tipo: (pregunta.tipo || 'conocimiento') as any,
        orden: index + 1,
        opciones,
        respuesta_correcta: correctOption.id,
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


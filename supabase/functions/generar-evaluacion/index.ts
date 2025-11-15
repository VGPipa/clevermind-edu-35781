import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { callAI, parseAIJSON } from '../_shared/ai.ts';
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

    const { id_clase, tipo } = await req.json();

    if (!['pre', 'post'].includes(tipo)) {
      return createErrorResponse('Tipo inválido. Debe ser "pre" o "post"', 400);
    }

    console.log(`Generating ${tipo} evaluation for class:`, id_clase);

    // Verify profesor owns this class
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select(`
        id,
        id_profesor,
        grupo_edad,
        metodologia,
        estado,
        id_guia_version_actual,
        temas!inner(nombre, descripcion, objetivos)
      `)
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    // Get current guide version
    if (!clase.id_guia_version_actual) {
      return createErrorResponse('No hay guía generada para esta clase', 404);
    }

    const { data: guideVersion, error: guideError } = await supabase
      .from('guias_clase_versiones')
      .select('objetivos, estructura, estado, es_version_final')
      .eq('id', clase.id_guia_version_actual)
      .single();

    if (guideError || !guideVersion) {
      return createErrorResponse('Versión de guía no encontrada', 404);
    }

    // Validate prerequisites
    if (tipo === 'pre') {
      // Quiz pre requires approved guide
      if (guideVersion.estado !== 'aprobada') {
        return createErrorResponse('La guía debe estar aprobada antes de generar el quiz previo', 400);
      }
    } else {
      // Quiz post requires final version
      if (!guideVersion.es_version_final) {
        return createErrorResponse('Se requiere la versión final de la guía para generar el quiz post', 400);
      }
    }

    const temaNombre = (clase.temas as any)?.nombre || 'General';

    // Configure quiz parameters based on type
    const maxPreguntas = tipo === 'pre' ? 3 : 10;
    const minPreguntas = tipo === 'pre' ? 3 : 5;
    const tiempoLimite = tipo === 'pre' ? 5 : 15;
    const enfoque = tipo === 'pre' ? 'teórico' : 'aplicación y análisis';

    // Build AI prompt
    const systemPrompt = `Eres un experto en evaluación educativa y pensamiento crítico.
Genera preguntas de evaluación que midan habilidades de pensamiento crítico.
Para quiz PRE: enfócate en conocimientos teóricos básicos (máximo 3 preguntas, 5 minutos).
Para quiz POST: incluye análisis, aplicación y razonamiento (5-10 preguntas, 15 minutos).`;

    const complexity = tipo === 'pre' ? 'básico' : 'avanzado';
    const userPrompt = `Genera ${minPreguntas === maxPreguntas ? maxPreguntas : `${minPreguntas}-${maxPreguntas}`} preguntas de evaluación ${tipo === 'pre' ? 'diagnóstica PRE' : 'sumativa POST'} para:

Tema: ${temaNombre}
Descripción del tema: ${(clase.temas as any)?.descripcion || 'No especificada'}
Nivel de complejidad: ${complexity}
Grupo de edad: ${clase.grupo_edad || 'General'}
Enfoque: ${enfoque}
Objetivos de aprendizaje:
${guideVersion.objetivos}

Las preguntas deben:
- Evaluar pensamiento crítico (análisis, razonamiento, aplicación)
- Ser apropiadas para el nivel ${complexity}
${tipo === 'pre' 
  ? '- Enfocarse en conocimientos teóricos básicos del tema\n- Ser breves y directas (máximo 3 preguntas)' 
  : '- Ser más desafiantes que una evaluación pre\n- Incluir análisis profundo y aplicación práctica'}
- Incluir retroalimentación automática específica para cada respuesta
${tipo === 'pre' ? '- Tiempo estimado: 5 minutos total' : '- Tiempo estimado: 15 minutos total'}

Responde en formato JSON:
{
  "preguntas": [
    {
      "texto_pregunta": "...",
      "tipo": "analisis|razonamiento|aplicacion|conocimiento",
      "puntos": ${tipo === 'pre' ? '1-2' : '2-4'},
      "retroalimentacion": "mensaje específico y constructivo"
    },
    ...
  ]
}`;

    // Call AI using helper
    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 2000,
    });

    const questionsData = parseAIJSON<{
      preguntas: Array<{
        texto_pregunta: string;
        tipo: string;
        puntos: number;
        retroalimentacion: string;
      }>;
    }>(aiResponse.content);

    // Validate number of questions
    const numPreguntas = questionsData.preguntas.length;
    if (tipo === 'pre' && numPreguntas > 3) {
      // Limit to 3 for pre
      questionsData.preguntas = questionsData.preguntas.slice(0, 3);
    } else if (tipo === 'post' && (numPreguntas < 5 || numPreguntas > 10)) {
      // Adjust to valid range for post
      if (numPreguntas < 5) {
        return createErrorResponse('El quiz post debe tener al menos 5 preguntas', 400);
      }
      questionsData.preguntas = questionsData.preguntas.slice(0, 10);
    }

    // Create quiz with specific parameters
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        id_clase,
        titulo: `Evaluación ${tipo === 'pre' ? 'Diagnóstica PRE' : 'Sumativa POST'}`,
        tipo: 'diagnostica',
        tipo_evaluacion: tipo,
        estado: 'borrador',
        tiempo_limite_minutos: tiempoLimite,
        max_preguntas: maxPreguntas,
        instrucciones: `Evaluación ${tipo === 'pre' ? 'inicial (PRE)' : 'final (POST)'} de pensamiento crítico. ${tipo === 'pre' ? 'Tiempo: 5 minutos. Máximo 3 preguntas.' : 'Tiempo: 15 minutos. 5-10 preguntas.'}`
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz:', quizError);
      return createErrorResponse(quizError.message, 500);
    }

    // Create questions
    const preguntasToInsert = questionsData.preguntas.map((q, index: number) => ({
      id_quiz: quiz.id,
      texto_pregunta: q.texto_pregunta,
      tipo: q.tipo as any,
      orden: index + 1,
      justificacion: q.retroalimentacion,
      respuesta_correcta: '', // Will be set by professor or AI
      opciones: []
    }));

    const { error: preguntasError } = await supabase
      .from('preguntas')
      .insert(preguntasToInsert);

    if (preguntasError) {
      console.error('Error creating questions:', preguntasError);
      return createErrorResponse(preguntasError.message, 500);
    }

    return createSuccessResponse({ 
      quiz_id: quiz.id,
      preguntas: questionsData.preguntas,
      tiempo_limite: tiempoLimite,
      max_preguntas: maxPreguntas,
      tipo: tipo
    });
  } catch (error) {
    console.error('Error in generar-evaluacion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});
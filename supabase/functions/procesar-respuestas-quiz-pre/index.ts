import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';
import { callAI, parseAIJSON } from '../_shared/ai.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, true);

    const { id_clase, id_quiz_pre } = await req.json();

    if (!id_clase || !id_quiz_pre) {
      return createErrorResponse('id_clase e id_quiz_pre son requeridos', 400);
    }

    console.log('Processing quiz pre responses for class:', id_clase);

    // Verify profesor owns this class
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('id, id_profesor, estado, id_guia_version_actual')
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    // Verify quiz exists and is pre type
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, id_clase, tipo_evaluacion, estado')
      .eq('id', id_quiz_pre)
      .eq('id_clase', id_clase)
      .eq('tipo_evaluacion', 'pre')
      .single();

    if (quizError || !quiz) {
      return createErrorResponse('Quiz previo no encontrado', 404);
    }

    // Get all responses for this quiz
    const { data: respuestas, error: respuestasError } = await supabase
      .from('respuestas_alumno')
      .select(`
        id,
        id_alumno,
        fecha_envio,
        estado,
        respuestas_detalle (
          id_pregunta,
          respuesta_alumno,
          es_correcta,
          tiempo_segundos,
          preguntas!inner(texto_pregunta, tipo)
        )
      `)
      .eq('id_quiz', id_quiz_pre)
      .eq('estado', 'completado');

    if (respuestasError) {
      console.error('Error fetching responses:', respuestasError);
      return createErrorResponse(respuestasError.message, 500);
    }

    if (!respuestas || respuestas.length === 0) {
      return createErrorResponse('No hay respuestas completadas para procesar', 400);
    }

    // Get guide version for context
    const { data: guideVersion } = await supabase
      .from('guias_clase_versiones')
      .select('objetivos, estructura')
      .eq('id', clase.id_guia_version_actual)
      .single();

    // Get quiz questions for context
    const { data: preguntas } = await supabase
      .from('preguntas')
      .select('id, texto_pregunta, tipo, respuesta_correcta')
      .eq('id_quiz', id_quiz_pre)
      .order('orden', { ascending: true });

    // Calculate statistics
    const totalRespuestas = respuestas.length;
    const respuestasCorrectas = respuestas.filter(r => {
      const detalles = Array.isArray(r.respuestas_detalle) ? r.respuestas_detalle : [];
      const todasCorrectas = detalles.every((d: any) => d.es_correcta === true);
      return todasCorrectas;
    }).length;

    const porcentajeAcierto = totalRespuestas > 0 
      ? Math.round((respuestasCorrectas / totalRespuestas) * 100) 
      : 0;

    // Analyze response patterns
    const respuestasPorPregunta: Record<string, any> = {};
    preguntas?.forEach((preg: any) => {
      const detalles = respuestas.flatMap((r: any) => {
        const dets = Array.isArray(r.respuestas_detalle) ? r.respuestas_detalle : [];
        return dets.filter((d: any) => d.id_pregunta === preg.id);
      });
      
      const correctas = detalles.filter((d: any) => d.es_correcta).length;
      const incorrectas = detalles.length - correctas;
      
      respuestasPorPregunta[preg.id] = {
        pregunta: preg.texto_pregunta,
        correctas,
        incorrectas,
        total: detalles.length,
        porcentaje: detalles.length > 0 ? Math.round((correctas / detalles.length) * 100) : 0,
      };
    });

    // Build AI prompt for generating recommendations
    const systemPrompt = `Eres un experto en análisis educativo y mejora continua de la enseñanza.
Analiza las respuestas de los estudiantes a un quiz previo y genera recomendaciones específicas y accionables para mejorar la guía de clase.
Las recomendaciones deben ser concretas, prácticas y enfocadas en ajustar el contenido, metodología o estructura de la clase.`;

    const userPrompt = `Analiza las siguientes respuestas del quiz previo y genera recomendaciones para mejorar la guía de clase:

ESTADÍSTICAS GENERALES:
- Total de estudiantes que respondieron: ${totalRespuestas}
- Estudiantes con todas las respuestas correctas: ${respuestasCorrectas}
- Porcentaje de acierto general: ${porcentajeAcierto}%

ANÁLISIS POR PREGUNTA:
${Object.entries(respuestasPorPregunta).map(([id, data]: [string, any]) => `
Pregunta: ${data.pregunta}
- Correctas: ${data.correctas}/${data.total} (${data.porcentaje}%)
- Incorrectas: ${data.incorrectas}/${data.total} (${100 - data.porcentaje}%)
`).join('')}

OBJETIVOS DE LA GUÍA ACTUAL:
${guideVersion?.objetivos || 'No disponibles'}

ESTRUCTURA DE LA CLASE:
${JSON.stringify(guideVersion?.estructura || [], null, 2)}

Genera recomendaciones específicas en formato JSON:
{
  "recomendaciones": [
    {
      "titulo": "Título breve de la recomendación",
      "descripcion": "Descripción detallada de qué cambiar y por qué",
      "prioridad": "alta|media|baja",
      "area": "contenido|metodologia|estructura|objetivos"
    },
    ...
  ],
  "resumen": "Resumen general de los hallazgos y recomendaciones principales"
}`;

    // Call AI to generate recommendations
    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 2000,
    });

    const recommendationsData = parseAIJSON<{
      recomendaciones: Array<{
        titulo: string;
        descripcion: string;
        prioridad: string;
        area: string;
      }>;
      resumen: string;
    }>(aiResponse.content);

    // Save recommendations to database
    const recomendacionesToInsert = recommendationsData.recomendaciones.map(rec => ({
      id_clase,
      id_quiz_pre,
      tipo: 'quiz_pre',
      contenido: `${rec.titulo}\n\n${rec.descripcion}\n\nPrioridad: ${rec.prioridad}\nÁrea: ${rec.area}`,
      aplicada: false,
    }));

    const { data: savedRecommendations, error: saveError } = await supabase
      .from('recomendaciones')
      .insert(recomendacionesToInsert)
      .select();

    if (saveError) {
      console.error('Error saving recommendations:', saveError);
      return createErrorResponse(saveError.message, 500);
    }

    // Update clase state
    const { error: updateError } = await supabase
      .from('clases')
      .update({
        estado: 'analizando_quiz_pre'
      })
      .eq('id', id_clase);

    if (updateError) {
      console.error('Error updating clase state:', updateError);
      // Don't fail, just log
    }

    return createSuccessResponse({
      success: true,
      message: 'Respuestas procesadas y recomendaciones generadas',
      estadisticas: {
        total_respuestas: totalRespuestas,
        respuestas_correctas: respuestasCorrectas,
        porcentaje_acierto: porcentajeAcierto,
        analisis_por_pregunta: respuestasPorPregunta,
      },
      recomendaciones: savedRecommendations,
      resumen: recommendationsData.resumen,
      total_recomendaciones: savedRecommendations?.length || 0,
    });
  } catch (error) {
    console.error('Error in procesar-respuestas-quiz-pre:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


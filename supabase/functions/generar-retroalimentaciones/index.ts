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

    const { id_clase, id_quiz_post } = await req.json();

    if (!id_clase || !id_quiz_post) {
      return createErrorResponse('id_clase e id_quiz_post son requeridos', 400);
    }

    console.log('Generating feedback for class:', id_clase, 'quiz:', id_quiz_post);

    // Verify profesor owns this class
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select(`
        id,
        id_profesor,
        id_grupo,
        estado,
        grupos!inner(nombre, grado, seccion)
      `)
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    // Verify quiz exists and is post type
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, id_clase, tipo_evaluacion, estado')
      .eq('id', id_quiz_post)
      .eq('id_clase', id_clase)
      .eq('tipo_evaluacion', 'post')
      .single();

    if (quizError || !quiz) {
      return createErrorResponse('Quiz post no encontrado', 404);
    }

    // Get all completed responses
    const { data: respuestas, error: respuestasError } = await supabase
      .from('respuestas_alumno')
      .select(`
        id,
        id_alumno,
        fecha_envio,
        estado,
        alumnos!inner(nombre, apellido),
        respuestas_detalle (
          id_pregunta,
          respuesta_alumno,
          es_correcta,
          tiempo_segundos,
          preguntas!inner(texto_pregunta, tipo)
        )
      `)
      .eq('id_quiz', id_quiz_post)
      .eq('estado', 'completado');

    if (respuestasError) {
      console.error('Error fetching responses:', respuestasError);
      return createErrorResponse(respuestasError.message, 500);
    }

    if (!respuestas || respuestas.length === 0) {
      return createErrorResponse('No hay respuestas completadas para procesar', 400);
    }

    // Get quiz questions
    const { data: preguntas } = await supabase
      .from('preguntas')
      .select('id, texto_pregunta, tipo, respuesta_correcta, justificacion')
      .eq('id_quiz', id_quiz_post)
      .order('orden', { ascending: true });

    // Calculate statistics per student
    const estadisticasAlumnos = respuestas.map((r: any) => {
      const detalles = Array.isArray(r.respuestas_detalle) ? r.respuestas_detalle : [];
      const correctas = detalles.filter((d: any) => d.es_correcta === true).length;
      const total = detalles.length;
      const porcentaje = total > 0 ? Math.round((correctas / total) * 100) : 0;
      
      return {
        id_alumno: r.id_alumno,
        nombre: `${(r.alumnos as any)?.nombre || ''} ${(r.alumnos as any)?.apellido || ''}`.trim(),
        correctas,
        total,
        porcentaje,
        respuestas: detalles,
      };
    });

    // Calculate group statistics
    const totalAlumnos = estadisticasAlumnos.length;
    const promedioGrupo = totalAlumnos > 0
      ? Math.round(estadisticasAlumnos.reduce((sum, e) => sum + e.porcentaje, 0) / totalAlumnos)
      : 0;

    const retroalimentacionesGeneradas: any[] = [];

    // 1. Generate individual feedback for each student
    for (const estadistica of estadisticasAlumnos) {
      const systemPrompt = `Eres un tutor educativo experto. 
Genera retroalimentación personalizada, constructiva y motivadora para un estudiante basada en su desempeño en un quiz.
La retroalimentación debe ser clara, específica y orientada a la mejora.`;

      const userPrompt = `Genera retroalimentación individual para el estudiante:

Nombre: ${estadistica.nombre}
Puntaje: ${estadistica.correctas}/${estadistica.total} (${estadistica.porcentaje}%)

Preguntas y respuestas:
${estadistica.respuestas.map((det: any, idx: number) => {
  const pregunta = preguntas?.find((p: any) => p.id === det.id_pregunta);
  return `Pregunta ${idx + 1}: ${pregunta?.texto_pregunta || 'N/A'}
Respuesta del estudiante: ${det.respuesta_alumno || 'Sin respuesta'}
${det.es_correcta ? '✓ Correcta' : '✗ Incorrecta'}
${pregunta?.justificacion ? `Explicación: ${pregunta.justificacion}` : ''}`;
}).join('\n\n')}

Genera retroalimentación en formato JSON:
{
  "fortalezas": ["fortaleza 1", "fortaleza 2"],
  "areas_mejora": ["área 1", "área 2"],
  "mensaje_motivador": "mensaje personalizado",
  "sugerencias": ["sugerencia 1", "sugerencia 2"]
}`;

      const aiResponse = await callAI({
        systemPrompt,
        userPrompt,
        responseFormat: 'json_object',
        temperature: 0.8,
        maxTokens: 1000,
      });

      const feedbackData = parseAIJSON(aiResponse.content);

      const { data: retroAlumno } = await supabase
        .from('retroalimentaciones')
        .insert({
          id_clase,
          id_quiz: id_quiz_post,
          tipo: 'alumno',
          id_alumno: estadistica.id_alumno,
          contenido: feedbackData,
          generada_ia: true,
        })
        .select()
        .single();

      if (retroAlumno) {
        retroalimentacionesGeneradas.push({ tipo: 'alumno', id: retroAlumno.id, alumno: estadistica.nombre });
      }
    }

    // 2. Generate individual feedback for professor (per student)
    for (const estadistica of estadisticasAlumnos) {
      const systemPrompt = `Eres un asistente pedagógico experto.
Genera retroalimentación para el profesor sobre el desempeño individual de un estudiante.
Incluye insights sobre fortalezas, debilidades y recomendaciones pedagógicas específicas.`;

      const userPrompt = `Genera retroalimentación para el profesor sobre el estudiante:

Nombre: ${estadistica.nombre}
Puntaje: ${estadistica.correctas}/${estadistica.total} (${estadistica.porcentaje}%)

Análisis de respuestas:
${estadistica.respuestas.map((det: any, idx: number) => {
  const pregunta = preguntas?.find((p: any) => p.id === det.id_pregunta);
  return `Pregunta ${idx + 1} (${pregunta?.tipo || 'N/A'}): ${det.es_correcta ? 'Correcta' : 'Incorrecta'}
Tiempo: ${det.tiempo_segundos || 0}s`;
}).join('\n')}

Genera retroalimentación en formato JSON:
{
  "analisis_desempeno": "análisis del desempeño del estudiante",
  "fortalezas_detectadas": ["fortaleza 1", "fortaleza 2"],
  "debilidades_detectadas": ["debilidad 1", "debilidad 2"],
  "recomendaciones_pedagogicas": ["recomendación 1", "recomendación 2"],
  "nivel_comprension": "básico|intermedio|avanzado"
}`;

      const aiResponse = await callAI({
        systemPrompt,
        userPrompt,
        responseFormat: 'json_object',
        temperature: 0.7,
        maxTokens: 1000,
      });

      const feedbackData = parseAIJSON(aiResponse.content);

      const { data: retroProf } = await supabase
        .from('retroalimentaciones')
        .insert({
          id_clase,
          id_quiz: id_quiz_post,
          tipo: 'profesor_individual',
          id_alumno: estadistica.id_alumno,
          contenido: feedbackData,
          generada_ia: true,
        })
        .select()
        .single();

      if (retroProf) {
        retroalimentacionesGeneradas.push({ tipo: 'profesor_individual', id: retroProf.id, alumno: estadistica.nombre });
      }
    }

    // 3. Generate group feedback for professor
    const systemPromptGrupal = `Eres un experto en análisis educativo y evaluación grupal.
Genera un análisis completo del desempeño del grupo completo, identificando patrones, fortalezas grupales y áreas de mejora.`;

    const userPromptGrupal = `Analiza el desempeño del grupo completo:

Grupo: ${(clase.grupos as any)?.nombre || 'N/A'}
Total de estudiantes: ${totalAlumnos}
Promedio del grupo: ${promedioGrupo}%

Desempeño individual:
${estadisticasAlumnos.map(e => `- ${e.nombre}: ${e.porcentaje}% (${e.correctas}/${e.total})`).join('\n')}

Preguntas del quiz:
${preguntas?.map((p: any, idx: number) => {
  const correctasPorPregunta = estadisticasAlumnos.reduce((sum, e) => {
    const det = e.respuestas.find((r: any) => r.id_pregunta === p.id);
    return sum + (det?.es_correcta ? 1 : 0);
  }, 0);
  const porcentajePregunta = totalAlumnos > 0 ? Math.round((correctasPorPregunta / totalAlumnos) * 100) : 0;
  return `Pregunta ${idx + 1}: ${p.texto_pregunta} - ${porcentajePregunta}% de aciertos`;
}).join('\n') || 'N/A'}

Genera análisis grupal en formato JSON:
{
  "resumen_general": "resumen del desempeño del grupo",
  "fortalezas_grupales": ["fortaleza 1", "fortaleza 2"],
  "debilidades_grupales": ["debilidad 1", "debilidad 2"],
  "patrones_detectados": ["patrón 1", "patrón 2"],
  "recomendaciones_mejora": ["recomendación 1", "recomendación 2"],
  "pros_clase": ["aspecto positivo 1", "aspecto positivo 2"],
  "contras_clase": ["aspecto a mejorar 1", "aspecto a mejorar 2"],
  "aprendizajes_logrados": ["aprendizaje 1", "aprendizaje 2"],
  "aprendizajes_pendientes": ["aprendizaje pendiente 1", "aprendizaje pendiente 2"]
}`;

    const aiResponseGrupal = await callAI({
      systemPrompt: systemPromptGrupal,
      userPrompt: userPromptGrupal,
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 1500,
    });

    const feedbackGrupal = parseAIJSON(aiResponseGrupal.content);

    const { data: retroGrupal } = await supabase
      .from('retroalimentaciones')
      .insert({
        id_clase,
        id_quiz: id_quiz_post,
        tipo: 'profesor_grupal',
        id_alumno: null,
        contenido: feedbackGrupal,
        generada_ia: true,
      })
      .select()
      .single();

    if (retroGrupal) {
      retroalimentacionesGeneradas.push({ tipo: 'profesor_grupal', id: retroGrupal.id });
    }

    // 4. Generate feedback for parents (per student)
    for (const estadistica of estadisticasAlumnos) {
      const systemPrompt = `Eres un comunicador educativo experto.
Genera retroalimentación para padres de familia sobre el desempeño de su hijo/a en un quiz.
El tono debe ser positivo, constructivo y fácil de entender para padres no especializados en educación.`;

      const userPrompt = `Genera retroalimentación para los padres de:

Estudiante: ${estadistica.nombre}
Puntaje: ${estadistica.correctas}/${estadistica.total} (${estadistica.porcentaje}%)

Genera retroalimentación en formato JSON:
{
  "resumen_desempeno": "resumen claro del desempeño",
  "logros": ["logro 1", "logro 2"],
  "areas_apoyo": ["área donde puede apoyar 1", "área donde puede apoyar 2"],
  "mensaje_constructivo": "mensaje positivo y alentador",
  "sugerencias_hogar": ["sugerencia para casa 1", "sugerencia para casa 2"]
}`;

      const aiResponse = await callAI({
        systemPrompt,
        userPrompt,
        responseFormat: 'json_object',
        temperature: 0.8,
        maxTokens: 800,
      });

      const feedbackData = parseAIJSON(aiResponse.content);

      const { data: retroPadre } = await supabase
        .from('retroalimentaciones')
        .insert({
          id_clase,
          id_quiz: id_quiz_post,
          tipo: 'padre',
          id_alumno: estadistica.id_alumno,
          contenido: feedbackData,
          generada_ia: true,
        })
        .select()
        .single();

      if (retroPadre) {
        retroalimentacionesGeneradas.push({ tipo: 'padre', id: retroPadre.id, alumno: estadistica.nombre });
      }
    }

    // Update clase state
    const { error: updateError } = await supabase
      .from('clases')
      .update({
        estado: 'analizando_resultados'
      })
      .eq('id', id_clase);

    if (updateError) {
      console.error('Error updating clase state:', updateError);
    }

    return createSuccessResponse({
      success: true,
      message: 'Retroalimentaciones generadas exitosamente',
      total_generadas: retroalimentacionesGeneradas.length,
      retroalimentaciones: retroalimentacionesGeneradas,
      estadisticas_grupo: {
        total_alumnos: totalAlumnos,
        promedio: promedioGrupo,
      },
    });
  } catch (error) {
    console.error('Error in generar-retroalimentaciones:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


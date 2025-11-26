import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { callAI, parseAIJSON } from '../_shared/ai.ts';
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

function buildGuideContext(guide: any) {
  if (!guide) {
    return 'No se proporcionó información adicional de la guía.';
  }

  const objetivosList = typeof guide.objetivos === 'string'
    ? guide.objetivos.split('\n').map((item: string) => item.trim()).filter(Boolean)
    : [];

  const objetivosTexto = objetivosList.length
    ? objetivosList.map((obj: string, idx: number) => `${idx + 1}. ${obj}`).join('\n')
    : 'No se especificaron objetivos detallados.';

  const estructuraArray = Array.isArray(guide.estructura) ? guide.estructura : [];
  const estructuraTexto = estructuraArray.length
    ? estructuraArray.map((fase: any, idx: number) => {
        const titulo = fase.titulo || fase.actividad || `Fase ${idx + 1}`;
        const meta = fase.objetivo || fase.meta || '';
        const detalle = fase.descripcion || fase.detalle || fase.contexto || '';
        const tiempo = fase.tiempo ? `${fase.tiempo} min` : '';
        const partes = [titulo, meta, detalle, tiempo].filter(Boolean).join(' — ');
        return `${idx + 1}. ${partes}`;
      }).join('\n')
    : 'La estructura de la clase no fue detallada.';

  const preguntasSocraticasTexto = Array.isArray(guide.preguntas_socraticas) && guide.preguntas_socraticas.length
    ? guide.preguntas_socraticas.slice(0, 5).map((q: string, idx: number) => `${idx + 1}. ${q}`).join('\n')
    : '';

  return `Objetivos principales:\n${objetivosTexto}\n\nEstructura propuesta:\n${estructuraTexto}${
    preguntasSocraticasTexto ? `\n\nPreguntas guía:\n${preguntasSocraticasTexto}` : ''
  }`;
}

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
        temas!inner(nombre, descripcion, objetivos, es_tema_temporal)
      `)
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    const esTemaTemporalOExtraordinario = (clase.temas as any)?.es_tema_temporal || false;
    console.log('Clase tema info:', { 
      tema_nombre: (clase.temas as any)?.nombre,
      es_tema_temporal: (clase.temas as any)?.es_tema_temporal,
      esTemaTemporalOExtraordinario 
    });

    // Get current guide version
    if (!clase.id_guia_version_actual) {
      return createErrorResponse('No hay guía generada para esta clase', 404);
    }

    const { data: guideVersion, error: guideError } = await supabase
      .from('guias_clase_versiones')
      .select('objetivos, estructura, preguntas_socraticas, estado, es_version_final')
      .eq('id', clase.id_guia_version_actual)
      .single();

    if (guideError || !guideVersion) {
      return createErrorResponse('Versión de guía no encontrada', 404);
    }

    // Validate prerequisites
    if (tipo === 'pre') {
      console.log('Pre-quiz validation:', {
        esTemaTemporalOExtraordinario,
        guideEstado: guideVersion.estado,
        shouldSkipApproval: esTemaTemporalOExtraordinario,
        needsApproval: !esTemaTemporalOExtraordinario && guideVersion.estado !== 'aprobada'
      });
      
      // Quiz pre requires approved guide (except for temporary/extraordinary themes)
      if (!esTemaTemporalOExtraordinario && guideVersion.estado !== 'aprobada') {
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
    const systemPrompt = `Eres un experto en evaluación educativa, pedagogía y diseño instruccional.
Tu tarea es generar contenido teórico central y preguntas que midan comprensión profunda y pensamiento crítico.
Para quiz PRE: crea la TEORÍA FUNDAMENTAL del tema (150-250 palabras) con definiciones clave, conceptos esenciales y principios que el estudiante debe memorizar, seguido de 3 preguntas teóricas básicas (5 minutos).
Para quiz POST: presenta teoría avanzada y genera preguntas de análisis, aplicación y razonamiento (5-10 preguntas, 15 minutos).
El texto teórico debe ser preciso, educativo y estructurado pedagógicamente.`;

    const complexity = tipo === 'pre' ? 'básico' : 'avanzado';
    const guideContext = buildGuideContext(guideVersion);
const userPrompt = `Necesito preparar un quiz ${tipo === 'pre' ? 'PRE (diagnóstico)' : 'POST (sumativo)'} para una clase.
Debes producir un JSON con dos partes:
{
  "lectura": "Texto de 150-250 palabras con la TEORÍA CENTRAL del tema: definiciones clave, conceptos fundamentales, principios o fórmulas esenciales que el estudiante debe comprender y memorizar",
  "preguntas": [
    {
      "texto_pregunta": "...",
      "puntos": ${tipo === 'pre' ? '1-2' : '2-4'},
      "retroalimentacion": "mensaje específico y constructivo",
      "opciones": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "indice_correcto": 0
    }
  ]
}

Genera ${minPreguntas === maxPreguntas ? maxPreguntas : `${minPreguntas}-${maxPreguntas}`} preguntas de evaluación ${tipo === 'pre' ? 'diagnóstica PRE' : 'sumativa POST'} para:

Tema: ${temaNombre}
Descripción del tema: ${(clase.temas as any)?.descripcion || 'No especificada'}
Nivel de complejidad: ${complexity}
Grupo de edad: ${clase.grupo_edad || 'General'}
Enfoque: ${enfoque}
Objetivos de aprendizaje:
${guideVersion.objetivos}

Contexto detallado de la guía (teoría central, estructura y preguntas guía):
${guideContext}

CRÍTICO - La "lectura" debe ser el CORAZÓN TEÓRICO de la clase (150-250 palabras):
- Incluir las definiciones clave y conceptos fundamentales del tema
- Presentar los principios, fórmulas, reglas o leyes esenciales
- Ser la síntesis de lo que el estudiante DEBE memorizar y comprender profundamente
- Usar un lenguaje claro, preciso y apropiado para el grupo de edad
- Estructurar la información de forma lógica y pedagógica (de lo básico a lo específico)
- Ser técnicamente rigurosa pero accesible
- NO debe ser una simple introducción amigable, sino el contenido teórico nuclear de la lección

Las preguntas deben:
- Evaluar la comprensión de la teoría presentada en la lectura
- Medir pensamiento crítico (análisis, razonamiento, aplicación)
- Ser apropiadas para el nivel ${complexity}
${tipo === 'pre' 
  ? '- Enfocarse en conocimientos teóricos básicos del tema\n- Ser breves y directas (máximo 3 preguntas)\n- Verificar que el estudiante comprendió los conceptos clave de la lectura' 
  : '- Ser más desafiantes que una evaluación pre\n- Incluir análisis profundo y aplicación práctica de la teoría'}
- Conectar explícitamente con los conceptos teóricos presentados en la lectura
- Incluir retroalimentación automática específica que refuerce el aprendizaje teórico
${tipo === 'pre' ? '- Tiempo estimado: 5 minutos total' : '- Tiempo estimado: 15 minutos total'}

Mantén el formato JSON descrito anteriormente sin texto adicional.`;

    // Call AI using helper
    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 2000,
      });

const quizContent = parseAIJSON<{
  lectura?: string;
  preguntas: Array<{
    texto_pregunta: string;
    tipo: string;
    puntos: number;
    retroalimentacion: string;
    opciones: string[];
    indice_correcto: number;
  }>;
}>(aiResponse.content);

    const readingText = quizContent.lectura?.trim() || `Lectura introductoria para el tema ${temaNombre}.`;
    quizContent.preguntas = Array.isArray(quizContent.preguntas) ? quizContent.preguntas : [];

    // Validate number of questions
const numPreguntas = quizContent.preguntas.length;
if (tipo === 'pre') {
  if (numPreguntas === 0) {
    return createErrorResponse('El quiz pre debe tener al menos 1 pregunta', 400);
  }
  if (numPreguntas > 3) {
    quizContent.preguntas = quizContent.preguntas.slice(0, 3);
  }
} else if (tipo === 'post' && (numPreguntas < 5 || numPreguntas > 10)) {
      // Adjust to valid range for post
      if (quizContent.preguntas.length < 5) {
        return createErrorResponse('El quiz post debe tener al menos 5 preguntas', 400);
      }
      quizContent.preguntas = quizContent.preguntas.slice(0, 10);
    }

    // Create quiz with specific parameters
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        id_clase,
        titulo: `Evaluación ${tipo === 'pre' ? 'Diagnóstica PRE' : 'Sumativa POST'}`,
        tipo: tipo === 'pre' ? 'previo' : 'post',
        tipo_evaluacion: tipo,
        estado: 'borrador',
        tiempo_limite: tiempoLimite,
        instrucciones: readingText
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz:', quizError);
      return createErrorResponse(quizError.message, 500);
    }

    // Create questions
const buildOpciones = (opciones: string[]): Array<{ id: string; label: string }> => {
  const items = Array.isArray(opciones) ? opciones : [];
  return items.map((texto, idx) => ({
    id: `option-${idx + 1}`,
    label: texto,
  }));
};

const preguntasToInsert = quizContent.preguntas.map((q, index: number) => {
  const opciones = buildOpciones(q.opciones);
  const correctOption =
    opciones?.[q.indice_correcto] ||
    opciones?.[0] || { id: 'option-1', label: '' };

  return {
    id_quiz: quiz.id,
    texto_pregunta: q.texto_pregunta,
    tipo: 'opcion_multiple',
    orden: index + 1,
    justificacion: q.retroalimentacion,
    texto_contexto: readingText,
    respuesta_correcta: correctOption.id,
    opciones,
  };
});

    const { error: preguntasError } = await supabase
      .from('preguntas')
      .insert(preguntasToInsert);

    if (preguntasError) {
      console.error('Error creating questions:', preguntasError);
      return createErrorResponse(preguntasError.message, 500);
    }

    return createSuccessResponse({ 
      quiz_id: quiz.id,
      lectura: readingText,
      preguntas: quizContent.preguntas,
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
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, false);
    const { id_grupo } = await req.json();

    if (!id_grupo) {
      return createErrorResponse('id_grupo es requerido', 400);
    }

    // Verificar que el profesor tiene acceso al grupo
    const { data: asignaciones } = await supabase
      .from('asignaciones_profesor')
      .select('id')
      .eq('id_profesor', profesor.id)
      .eq('id_grupo', id_grupo);

    if (!asignaciones || asignaciones.length === 0) {
      return createErrorResponse('No tienes acceso a este grupo', 403);
    }

    // Obtener las clases del profesor en este grupo con quizzes POST
    const { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select(`
        id,
        id_tema,
        temas (
          nombre
        ),
        quizzes!inner (
          id,
          tipo,
          preguntas (
            id,
            texto_pregunta,
            texto_contexto
          ),
          respuestas_alumno (
            id,
            estado,
            respuestas_detalle (
              id_pregunta,
              es_correcta
            )
          )
        )
      `)
      .eq('id_profesor', profesor.id)
      .eq('id_grupo', id_grupo)
      .eq('quizzes.tipo', 'post');

    if (clasesError) throw clasesError;

    if (!clases || clases.length === 0) {
      return createSuccessResponse({
        recomendaciones: [],
        mensaje: 'No hay evaluaciones POST disponibles para generar recomendaciones',
      });
    }

    // Procesar las respuestas para identificar conceptos con bajo rendimiento
    const conceptosStats = new Map<string, { 
      correctas: number; 
      total: number; 
      preguntas: Array<{ id: string; texto: string }>;
      tema: string;
    }>();

    clases.forEach((clase: any) => {
      const temaNombre = clase.temas?.nombre || 'Tema sin nombre';
      
      clase.quizzes?.forEach((quiz: any) => {
        quiz.preguntas?.forEach((pregunta: any) => {
          // Usamos el texto de la pregunta como identificador del concepto
          const conceptoKey = pregunta.texto_contexto || pregunta.texto_pregunta;
          
          if (!conceptosStats.has(conceptoKey)) {
            conceptosStats.set(conceptoKey, {
              correctas: 0,
              total: 0,
              preguntas: [],
              tema: temaNombre,
            });
          }

          const stats = conceptosStats.get(conceptoKey)!;
          stats.preguntas.push({
            id: pregunta.id,
            texto: pregunta.texto_pregunta,
          });

          // Contar respuestas
          quiz.respuestas_alumno?.forEach((respuesta: any) => {
            if (respuesta.estado === 'completado') {
              const detalle = respuesta.respuestas_detalle?.find(
                (d: any) => d.id_pregunta === pregunta.id
              );
              if (detalle) {
                stats.total++;
                if (detalle.es_correcta) {
                  stats.correctas++;
                }
              }
            }
          });
        });
      });
    });

    // Identificar conceptos con bajo rendimiento (< 50%)
    const conceptosBajoRendimiento: Array<{
      concepto: string;
      porcentaje: number;
      preguntas: Array<{ id: string; texto: string }>;
      tema: string;
    }> = [];

    conceptosStats.forEach((stats, concepto) => {
      if (stats.total > 0) {
        const porcentaje = (stats.correctas / stats.total) * 100;
        if (porcentaje < 50) {
          conceptosBajoRendimiento.push({
            concepto,
            porcentaje: Math.round(porcentaje),
            preguntas: stats.preguntas,
            tema: stats.tema,
          });
        }
      }
    });

    if (conceptosBajoRendimiento.length === 0) {
      return createSuccessResponse({
        recomendaciones: [],
        mensaje: 'No hay conceptos con bajo rendimiento que requieran recomendaciones',
      });
    }

    // Preparar prompt para IA
    const conceptosTexto = conceptosBajoRendimiento
      .map((c, idx) => 
        `${idx + 1}. "${c.concepto}" (${c.porcentaje}% de logro) - Tema: ${c.tema}\n   Preguntas relacionadas:\n${c.preguntas.map(p => `   - ${p.texto}`).join('\n')}`
      )
      .join('\n\n');

    const systemPrompt = `Eres un asistente pedagógico experto que genera recomendaciones concretas y accionables para profesores.

Tu tarea es crear recomendaciones específicas para reforzar conceptos con bajo rendimiento (menos del 50% de logro) basándote en los resultados de evaluaciones POST.

Cada recomendación debe incluir:
1. Una descripción clara del concepto a reforzar
2. Una estrategia pedagógica concreta y práctica que el profesor pueda implementar en la próxima sesión

Sé específico, práctico y orienta las recomendaciones a acciones inmediatas que el profesor puede tomar.`;

    const userPrompt = `Genera recomendaciones para reforzar los siguientes conceptos que tuvieron bajo rendimiento:

${conceptosTexto}

Formato de respuesta (JSON):
{
  "recomendaciones": [
    {
      "concepto": "descripción del concepto",
      "estrategia": "estrategia pedagógica concreta"
    }
  ]
}`;

    // Llamar a Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurado');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error en Lovable AI:', aiResponse.status, errorText);
      throw new Error(`Error generando recomendaciones: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    const recomendacionesIA = JSON.parse(aiContent);

    // Guardar recomendaciones en la tabla 'recomendaciones' para cada clase
    const recomendacionesParaGuardar = [];
    
    for (const clase of clases) {
      for (const rec of recomendacionesIA.recomendaciones) {
        recomendacionesParaGuardar.push({
          id_clase: clase.id,
          contenido: JSON.stringify({
            tipo: 'refuerzo_post',
            concepto: rec.concepto,
            estrategia: rec.estrategia,
          }),
          aplicada: false,
        });
      }
    }

    // Insertar en batch
    const { error: insertError } = await supabase
      .from('recomendaciones')
      .insert(recomendacionesParaGuardar);

    if (insertError) {
      console.error('Error guardando recomendaciones:', insertError);
      throw insertError;
    }

    return createSuccessResponse({
      recomendaciones: recomendacionesIA.recomendaciones,
      cantidad: recomendacionesIA.recomendaciones.length,
      mensaje: 'Recomendaciones generadas exitosamente',
    });

  } catch (error) {
    console.error('Error en generar-recomendaciones-metricas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});

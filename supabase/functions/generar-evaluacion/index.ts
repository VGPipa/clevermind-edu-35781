import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { id_clase, tipo } = await req.json();

    if (!['pre', 'post'].includes(tipo)) {
      return new Response(JSON.stringify({ error: 'Invalid tipo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating ${tipo} evaluation for class:`, id_clase);

    // Get class guide
    const { data: guide, error: guideError } = await supabase
      .from('guias_clase')
      .select('objetivos, estructura')
      .eq('id_clase', id_clase)
      .single();

    if (guideError || !guide) {
      return new Response(JSON.stringify({ error: 'Guide not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get class data for context
    const { data: clase } = await supabase
      .from('clases')
      .select('grupo_edad, metodologia, temas(nombre)')
      .eq('id', id_clase)
      .single();

    const temaNombre = (clase?.temas as any)?.nombre || 'General';

    // Build AI prompt
    const systemPrompt = `Eres un experto en evaluación educativa y pensamiento crítico.
Genera preguntas de evaluación que midan habilidades de pensamiento crítico.`;

    const complexity = tipo === 'pre' ? 'básico' : 'avanzado';
    const userPrompt = `Genera 5 preguntas de evaluación ${tipo === 'pre' ? 'diagnóstica' : 'sumativa'} para:

Tema: ${temaNombre}
Nivel de complejidad: ${complexity}
Grupo de edad: ${clase?.grupo_edad || 'General'}
Objetivos de aprendizaje:
${guide.objetivos}

Las preguntas deben:
- Evaluar pensamiento crítico (análisis, razonamiento, aplicación)
- Ser apropiadas para el nivel ${complexity}
${tipo === 'post' ? '- Ser más desafiantes que una evaluación pre' : '- Establecer línea base de conocimientos'}
- Incluir retroalimentación automática específica

Responde en formato JSON:
{
  "preguntas": [
    {
      "texto_pregunta": "...",
      "tipo": "analisis|razonamiento|aplicacion",
      "puntos": 2-4,
      "retroalimentacion": "mensaje específico"
    },
    ...
  ]
}`;

    // Call Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Límite de solicitudes excedido. Intenta nuevamente en un momento.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Fondos insuficientes. Contacta al administrador.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Error generating evaluation' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const questions = JSON.parse(aiData.choices[0].message.content);

    // Create quiz
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        id_clase,
        titulo: `Evaluación ${tipo === 'pre' ? 'Diagnóstica' : 'Sumativa'}`,
        tipo: 'diagnostica',
        tipo_evaluacion: tipo,
        estado: 'borrador',
        instrucciones: `Evaluación ${tipo === 'pre' ? 'inicial' : 'final'} de pensamiento crítico`
      })
      .select()
      .single();

    if (quizError) {
      console.error('Error creating quiz:', quizError);
      return new Response(JSON.stringify({ error: quizError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create questions
    const preguntasToInsert = questions.preguntas.map((q: any, index: number) => ({
      id_quiz: quiz.id,
      texto_pregunta: q.texto_pregunta,
      tipo: q.tipo,
      orden: index + 1,
      justificacion: q.retroalimentacion,
      respuesta_correcta: '',
      opciones: []
    }));

    const { error: preguntasError } = await supabase
      .from('preguntas')
      .insert(preguntasToInsert);

    if (preguntasError) {
      console.error('Error creating questions:', preguntasError);
      return new Response(JSON.stringify({ error: preguntasError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ 
        quiz_id: quiz.id,
        preguntas: questions.preguntas 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generar-evaluacion:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
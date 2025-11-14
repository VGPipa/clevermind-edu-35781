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

    const { id_clase } = await req.json();

    console.log('Generating guide for class:', id_clase);

    // Get class data
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select(`
        *,
        temas!inner(nombre, descripcion, objetivos),
        grupos!inner(nombre, grado, perfil)
      `)
      .eq('id', id_clase)
      .single();

    if (claseError || !clase) {
      return new Response(JSON.stringify({ error: 'Clase not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get recommendations for this class
    const { data: recommendations } = await supabase
      .from('recomendaciones')
      .select('contenido')
      .eq('id_clase', id_clase)
      .eq('aplicada', false);

    // Build AI prompt
    const systemPrompt = `Eres un asistente experto en educación y pensamiento crítico. 
Tu tarea es generar guías de clase estructuradas y efectivas que desarrollen habilidades de pensamiento crítico en los estudiantes.
Usa la metodología especificada y adapta el contenido al nivel del estudiante.`;

    const userPrompt = `Genera una guía de clase con la siguiente información:

Tema: ${clase.temas.nombre}
Descripción: ${clase.temas.descripcion || 'No especificada'}
Objetivos curriculares: ${clase.temas.objetivos || 'No especificados'}
Grado: ${clase.grupos.grado}
Grupo de edad: ${clase.grupo_edad}
Duración: ${clase.duracion_minutos} minutos
Metodología: ${clase.metodologia}
Contexto específico: ${clase.contexto || 'No especificado'}
${recommendations && recommendations.length > 0 ? `\nRecomendaciones de clases anteriores:\n${recommendations.map(r => r.contenido).join('\n')}` : ''}

La guía debe incluir:
1. Objetivos de aprendizaje específicos (3-4 objetivos medibles)
2. Estructura de la clase con actividades y tiempos (dividir los ${clase.duracion_minutos} minutos)
3. Preguntas socráticas para fomentar el pensamiento crítico (4-6 preguntas)

Responde en formato JSON con esta estructura:
{
  "objetivos": ["objetivo 1", "objetivo 2", ...],
  "estructura": [
    {"tiempo": 10, "actividad": "Nombre", "descripcion": "Detalles"},
    ...
  ],
  "preguntas_socraticas": ["pregunta 1", "pregunta 2", ...]
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

      return new Response(JSON.stringify({ error: 'Error generating guide' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const guideContent = JSON.parse(aiData.choices[0].message.content);

    // Save guide
    const { data: guide, error: guideError } = await supabase
      .from('guias_clase')
      .upsert({
        id_clase,
        objetivos: guideContent.objetivos.join('\n'),
        estructura: guideContent.estructura,
        preguntas_socraticas: guideContent.preguntas_socraticas,
        generada_ia: true,
        contenido: {}
      })
      .select()
      .single();

    if (guideError) {
      console.error('Error saving guide:', guideError);
      return new Response(JSON.stringify({ error: guideError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({ guide: guideContent }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generar-guia-clase:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
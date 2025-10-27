import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { materia, grado, tema, duracion, objetivos, contextoAlumnos } = await req.json();
    
    console.log('Generando clase con los siguientes parámetros:', { materia, grado, tema, duracion, objetivos });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY no está configurada');
    }

    const systemPrompt = `Eres un experto pedagogo chileno especializado en crear guías de clase detalladas y efectivas. 
Tu tarea es generar una planificación completa de clase que incluya:

1. Inicio (10-15% del tiempo): Motivación y activación de conocimientos previos
2. Desarrollo (60-70% del tiempo): Actividades principales de aprendizaje
3. Cierre (15-20% del tiempo): Síntesis y evaluación

La guía debe ser práctica, alineada con el currículum chileno, e incluir estrategias diferenciadas cuando sea necesario.

Usa un formato estructurado con secciones claras y formato HTML simple para mejor legibilidad.`;

    const userPrompt = `Genera una guía de clase completa con la siguiente información:

**Materia:** ${materia}
**Grado:** ${grado}
**Tema:** ${tema}
**Duración:** ${duracion} minutos
**Objetivos de aprendizaje:** ${objetivos}
${contextoAlumnos ? `**Contexto de los alumnos:** ${contextoAlumnos}` : ''}

Por favor estructura la guía con:
- Objetivos específicos de la clase
- Materiales necesarios
- Desarrollo detallado (inicio, desarrollo, cierre)
- Actividades diferenciadas según niveles
- Estrategias de evaluación
- Preguntas clave para guiar el aprendizaje

Usa formato HTML simple con <strong>, <p>, <ul>, <li> para organizar la información.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Límite de solicitudes excedido. Por favor intenta más tarde.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos agotados. Por favor agrega fondos a tu cuenta de Lovable AI.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const errorText = await response.text();
      console.error('Error del gateway de IA:', response.status, errorText);
      throw new Error('Error al comunicarse con el servicio de IA');
    }

    const data = await response.json();
    const contenido = data.choices?.[0]?.message?.content;

    if (!contenido) {
      throw new Error('No se recibió contenido del servicio de IA');
    }

    console.log('Guía generada exitosamente');

    return new Response(
      JSON.stringify({
        materia,
        grado,
        tema,
        duracion,
        contenido
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error en generar-clase:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Error desconocido al generar la clase' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

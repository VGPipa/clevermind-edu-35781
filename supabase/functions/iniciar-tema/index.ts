import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id_tema, total_sesiones, contexto_grupo, metodologias } = await req.json();

    console.log('Iniciando tema:', { id_tema, total_sesiones });

    // Obtener datos del profesor
    const { data: profesor } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profesor) {
      return new Response(JSON.stringify({ error: 'Profesor no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener datos del tema
    const { data: tema } = await supabase
      .from('temas')
      .select(`
        *,
        materias (
          nombre,
          horas_semanales,
          plan_anual (
            grado
          )
        )
      `)
      .eq('id', id_tema)
      .single();

    if (!tema) {
      return new Response(JSON.stringify({ error: 'Tema no encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generar guía maestra con IA
    const prompt = `Eres un asistente pedagógico experto. Genera una guía maestra completa para el siguiente tema:

TEMA: ${tema.nombre}
DESCRIPCIÓN: ${tema.descripcion || 'No especificada'}
OBJETIVOS: ${tema.objetivos || 'No especificados'}
GRADO: ${tema.materias.plan_anual.grado}
MATERIA: ${tema.materias.nombre}
TOTAL SESIONES: ${total_sesiones}
HORAS SEMANALES: ${tema.materias.horas_semanales}
DURACIÓN ESTIMADA: ${tema.duracion_estimada} horas
CONTEXTO DEL GRUPO: ${contexto_grupo}
METODOLOGÍAS PREFERIDAS: ${metodologias.join(', ')}

Genera una guía maestra que incluya:
1. Objetivos generales del tema
2. Competencias a desarrollar
3. Estructura sugerida de sesiones (distribución del contenido en ${total_sesiones} sesiones)
4. Recursos recomendados
5. Estrategias de evaluación
6. Actividades transversales sugeridas

Devuelve la respuesta en formato JSON con la siguiente estructura:
{
  "objetivos_generales": "...",
  "competencias": ["...", "..."],
  "estructura_sesiones": [
    {
      "numero": 1,
      "titulo": "...",
      "contenido_clave": "...",
      "duracion_sugerida": 90
    }
  ],
  "recursos": ["...", "..."],
  "estrategias_evaluacion": ["...", "..."],
  "actividades_transversales": ["...", "..."]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Eres un asistente pedagógico experto que genera guías maestras para temas educativos. Siempre respondes en formato JSON válido.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error AI:', errorText);
      throw new Error('Error al generar guía maestra con IA');
    }

    const aiData = await aiResponse.json();
    const contenido = JSON.parse(aiData.choices[0].message.content);

    // Insertar guía maestra
    const { data: guiaTema, error: insertError } = await supabase
      .from('guias_tema')
      .insert({
        id_tema,
        id_profesor: profesor.id,
        contenido,
        estructura_sesiones: contenido.estructura_sesiones,
        metodologias,
        contexto_grupo,
        total_sesiones,
        objetivos_generales: contenido.objetivos_generales
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error insertando guía:', insertError);
      throw insertError;
    }

    console.log('Guía maestra creada:', guiaTema.id);

    return new Response(JSON.stringify({ 
      success: true, 
      guia_tema: guiaTema,
      mensaje: 'Guía maestra generada exitosamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en iniciar-tema:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
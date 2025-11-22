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

    // Verificar si ya existe una guía maestra para este tema
    const { data: guiaExistente } = await supabase
      .from('guias_tema')
      .select('*')
      .eq('id_tema', id_tema)
      .eq('id_profesor', profesor.id)
      .maybeSingle();

    if (guiaExistente) {
      return new Response(JSON.stringify({ 
        success: true,
        guia_existente: true,
        guia_tema: guiaExistente,
        mensaje: 'Ya existe una guía maestra para este tema. Puedes editarla desde Mis Temas.'
      }), {
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

    // Validar que el tema tenga grado asignado
    if (!tema.materias?.plan_anual?.grado) {
      return new Response(JSON.stringify({ 
        error: 'El tema no tiene grado asignado. Por favor, contacta al administrador para configurar el plan anual correctamente.' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generar datos preliminares con IA (solo estructura básica de sesiones)
    const grado = tema.materias?.plan_anual?.grado || 'No especificado';
    const prompt = `Eres un asistente pedagógico experto. Genera datos preliminares para el siguiente tema:

TEMA: ${tema.nombre}
DESCRIPCIÓN: ${tema.descripcion || 'No especificada'}
OBJETIVOS: ${tema.objetivos || 'No especificados'}
GRADO: ${grado}
MATERIA: ${tema.materias.nombre}
TOTAL SESIONES: ${total_sesiones}
HORAS SEMANALES: ${tema.materias.horas_semanales}
DURACIÓN ESTIMADA: ${tema.duracion_estimada} semanas
CONTEXTO DEL GRUPO: ${contexto_grupo || 'No especificado'}
METODOLOGÍAS PREFERIDAS: ${metodologias.join(', ')}

IMPORTANTE: Solo genera datos preliminares para cada sesión. NO generes la guía completa de clase.
Estos datos preliminares se usarán como referencia al momento de generar la guía de clase específica.

Para cada una de las ${total_sesiones} sesiones, genera:
- Un título preliminar descriptivo
- Un contexto preliminar básico (2-3 líneas sobre qué se abordará)
- Duración sugerida en minutos

Devuelve la respuesta en formato JSON con la siguiente estructura:
{
  "estructura_sesiones": [
    {
      "numero": 1,
      "titulo_preliminar": "Título descriptivo de la sesión",
      "contexto_preliminar": "Contexto básico de 2-3 líneas sobre qué se abordará en esta sesión",
      "duracion_sugerida": 90
    }
  ]
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
          { role: 'system', content: 'Eres un asistente pedagógico experto que genera datos preliminares de sesiones para temas educativos. Solo genera títulos preliminares, contexto básico y duración sugerida. NO generes guías completas. Siempre respondes en formato JSON válido.' },
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
    let contenido;
    
    try {
      contenido = JSON.parse(aiData.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parseando respuesta de IA:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Error al procesar la respuesta de la IA. Por favor, intenta nuevamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar estructura de la respuesta de IA
    if (!contenido.estructura_sesiones || !Array.isArray(contenido.estructura_sesiones)) {
      return new Response(JSON.stringify({ 
        error: 'La respuesta de IA no incluye estructura_sesiones válida. Por favor, intenta nuevamente.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (contenido.estructura_sesiones.length !== total_sesiones) {
      return new Response(JSON.stringify({ 
        error: `La estructura de sesiones debe tener exactamente ${total_sesiones} sesiones, pero tiene ${contenido.estructura_sesiones.length}. Por favor, intenta nuevamente.` 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validar que cada sesión tenga los campos necesarios
    for (let i = 0; i < contenido.estructura_sesiones.length; i++) {
      const sesion = contenido.estructura_sesiones[i];
      if (!sesion.numero || !sesion.titulo_preliminar || !sesion.contexto_preliminar) {
        return new Response(JSON.stringify({ 
          error: `La sesión ${i + 1} no tiene todos los campos requeridos (numero, titulo_preliminar, contexto_preliminar). Por favor, intenta nuevamente.` 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Insertar guía maestra con solo datos preliminares
    // El contenido se guarda como objeto vacío o mínimo, ya que solo necesitamos estructura_sesiones
    const { data: guiaTema, error: insertError } = await supabase
      .from('guias_tema')
      .insert({
        id_tema,
        id_profesor: profesor.id,
        contenido: {}, // Contenido mínimo, solo estructura preliminar
        estructura_sesiones: contenido.estructura_sesiones,
        metodologias,
        contexto_grupo,
        total_sesiones,
        objetivos_generales: null // No se generan objetivos generales en esta etapa
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
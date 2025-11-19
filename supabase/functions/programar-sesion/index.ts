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

    const { 
      id_tema, 
      id_grupo, 
      numero_sesion, 
      fecha_programada, 
      duracion_minutos, 
      contexto_especifico 
    } = await req.json();

    console.log('Programando sesión:', { id_tema, numero_sesion, fecha_programada });

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

    // Obtener guía maestra del tema
    const { data: guiaTema } = await supabase
      .from('guias_tema')
      .select(`
        *,
        temas (
          nombre,
          descripcion,
          objetivos,
          materias (
            nombre,
            plan_anual (
              grado
            )
          )
        )
      `)
      .eq('id_tema', id_tema)
      .eq('id_profesor', profesor.id)
      .single();

    if (!guiaTema) {
      return new Response(JSON.stringify({ 
        error: 'Guía maestra no encontrada. Primero debes crear la guía maestra del tema desde la página de Planificación haciendo clic en "Iniciar Tema".' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Obtener datos del grupo
    const { data: grupo } = await supabase
      .from('grupos')
      .select('*')
      .eq('id', id_grupo)
      .single();

    // Obtener la sesión específica de la estructura
    const sesionSugerida = guiaTema.estructura_sesiones?.find(
      (s: any) => s.numero === numero_sesion
    );

    // Adaptar guía maestra a sesión específica con IA
    const prompt = `Adapta la siguiente guía maestra a una sesión específica:

GUÍA MAESTRA:
${JSON.stringify(guiaTema.contenido, null, 2)}

SESIÓN ESPECÍFICA:
- Número: ${numero_sesion} de ${guiaTema.total_sesiones}
- Tema: ${guiaTema.temas.nombre}
- Título sugerido: ${sesionSugerida?.titulo || 'Sin título'}
- Contenido clave: ${sesionSugerida?.contenido_clave || 'No especificado'}
- Duración: ${duracion_minutos} minutos
- Grado: ${guiaTema.temas.materias.plan_anual.grado}
- Grupo: ${grupo.nombre}
- Contexto específico: ${contexto_especifico || 'No especificado'}

Genera una guía de clase detallada para esta sesión que incluya:
1. Objetivos específicos de la sesión
2. Inicio (motivación/activación)
3. Desarrollo (contenido principal con actividades específicas)
4. Cierre (consolidación y tarea)
5. Recursos específicos necesarios
6. Preguntas socráticas para guiar el aprendizaje

Devuelve en formato JSON:
{
  "objetivos": "...",
  "contenido": {
    "inicio": { "duracion": 10, "actividades": ["..."] },
    "desarrollo": { "duracion": 60, "actividades": ["..."] },
    "cierre": { "duracion": 20, "actividades": ["..."] }
  },
  "recursos": ["...", "..."],
  "preguntas_socraticas": ["...", "..."],
  "evaluacion": "..."
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
          { role: 'system', content: 'Eres un asistente pedagógico experto que adapta guías maestras a sesiones específicas. Siempre respondes en formato JSON válido.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Error AI:', errorText);
      throw new Error('Error al generar guía de sesión con IA');
    }

    const aiData = await aiResponse.json();
    const contenidoSesion = JSON.parse(aiData.choices[0].message.content);

    // Crear registro de clase
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .insert({
        id_tema,
        id_grupo,
        id_profesor: profesor.id,
        numero_sesion,
        total_sesiones_tema: guiaTema.total_sesiones,
        id_guia_tema: guiaTema.id,
        fecha_programada,
        duracion_minutos,
        estado: 'guia_aprobada',
        observaciones: contexto_especifico
      })
      .select()
      .single();

    if (claseError) {
      console.error('Error creando clase:', claseError);
      throw claseError;
    }

    // Crear versión de guía de clase
    const { data: guiaVersion, error: versionError } = await supabase
      .from('guias_clase_versiones')
      .insert({
        id_clase: clase.id,
        version_numero: 1,
        contenido: contenidoSesion,
        objetivos: contenidoSesion.objetivos,
        estructura: contenidoSesion.contenido,
        preguntas_socraticas: contenidoSesion.preguntas_socraticas,
        estado: 'aprobada',
        es_version_final: true,
        generada_ia: true
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error creando versión:', versionError);
      throw versionError;
    }

    // Actualizar clase con la versión
    await supabase
      .from('clases')
      .update({ id_guia_version_actual: guiaVersion.id })
      .eq('id', clase.id);

    console.log('Sesión programada:', clase.id);

    return new Response(JSON.stringify({ 
      success: true, 
      clase,
      guia_version: guiaVersion,
      mensaje: `Sesión ${numero_sesion}/${guiaTema.total_sesiones} programada exitosamente`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en programar-sesion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
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

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    if (!id_tema || !id_grupo || !numero_sesion || !fecha_programada) {
      return new Response(JSON.stringify({ error: 'Faltan datos requeridos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Programando sesión (solo contexto):', { id_tema, numero_sesion, fecha_programada });

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
      .select('id, total_sesiones')
      .eq('id_tema', id_tema)
      .eq('id_profesor', profesor.id)
      .single();

    if (!guiaTema) {
      return new Response(JSON.stringify({ 
        error: 'Guía maestra no encontrada. Primero debes crear la guía maestra del tema.' 
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Crear registro de clase solo con el contexto inicial
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
        estado: 'borrador',
        contexto: contexto_especifico,
        observaciones: contexto_especifico,
      })
      .select()
      .single();

    if (claseError) {
      console.error('Error creando clase:', claseError);
      throw claseError;
    }

    console.log('Sesión programada solo con contexto:', clase.id);

    return new Response(JSON.stringify({ 
      success: true, 
      clase,
      mensaje: `Sesión ${numero_sesion}/${guiaTema.total_sesiones} programada en estado borrador`
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
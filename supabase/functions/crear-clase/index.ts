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
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const {
      id_tema,
      id_grupo,
      fecha_programada,
      duracion_minutos,
      grupo_edad,
      metodologia,
      contexto,
      areas_transversales
    } = await req.json();

    console.log('Creating class for user:', user.id);

    // Get profesor ID
    const { data: profesor, error: profesorError } = await supabase
      .from('profesores')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profesorError || !profesor) {
      return new Response(JSON.stringify({ error: 'Profesor not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for previous class with same tema and grupo
    const { data: previousClass } = await supabase
      .from('clases')
      .select('id, observaciones')
      .eq('id_profesor', profesor.id)
      .eq('id_tema', id_tema)
      .eq('id_grupo', id_grupo)
      .eq('estado', 'completada')
      .order('fecha_ejecutada', { ascending: false })
      .limit(1)
      .single();

    // Create class
    const { data: newClass, error: classError } = await supabase
      .from('clases')
      .insert({
        id_profesor: profesor.id,
        id_tema,
        id_grupo,
        fecha_programada,
        duracion_minutos,
        grupo_edad,
        metodologia,
        contexto,
        areas_transversales,
        estado: 'borrador'
      })
      .select()
      .single();

    if (classError) {
      console.error('Error creating class:', classError);
      return new Response(JSON.stringify({ error: classError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If previous class exists, generate recommendation
    let recommendation = null;
    if (previousClass) {
      const { data: rec } = await supabase
        .from('recomendaciones')
        .insert({
          id_clase: newClass.id,
          id_clase_anterior: previousClass.id,
          contenido: previousClass.observaciones || 'Revisar resultados de la clase anterior',
          aplicada: false
        })
        .select()
        .single();
      
      recommendation = rec;
    }

    return new Response(
      JSON.stringify({
        class: newClass,
        previousClass,
        recommendation
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in crear-clase:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
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

    console.log('Validating class:', id_clase);

    // Check all requirements
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('contexto')
      .eq('id', id_clase)
      .single();

    const { data: guide } = await supabase
      .from('guias_clase')
      .select('id')
      .eq('id_clase', id_clase)
      .single();

    const { data: preEval } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id_clase', id_clase)
      .eq('tipo_evaluacion', 'pre')
      .single();

    const { data: postEval } = await supabase
      .from('quizzes')
      .select('id')
      .eq('id_clase', id_clase)
      .eq('tipo_evaluacion', 'post')
      .single();

    const validations = {
      has_context: !!clase?.contexto,
      has_guide: !!guide,
      has_pre_eval: !!preEval,
      has_post_eval: !!postEval,
      notifications_configured: true // Always true for now
    };

    const is_valid = Object.values(validations).every(v => v === true);

    // If valid, update class status
    if (is_valid) {
      const { error: updateError } = await supabase
        .from('clases')
        .update({ estado: 'preparada' })
        .eq('id', id_clase);

      if (updateError) {
        console.error('Error updating class status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ validations, is_valid }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in validar-clase:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
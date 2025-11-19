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
      id_guia_tema,
      objetivos_generales,
      estructura_sesiones,
      contenido,
      metodologias,
      contexto_grupo
    } = await req.json();

    console.log('Actualizando guía tema:', id_guia_tema);

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

    // Verificar que el profesor sea dueño de la guía
    const { data: guiaTema, error: guiaError } = await supabase
      .from('guias_tema')
      .select('*')
      .eq('id', id_guia_tema)
      .eq('id_profesor', profesor.id)
      .single();

    if (guiaError || !guiaTema) {
      return new Response(JSON.stringify({ error: 'Guía maestra no encontrada o no autorizada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (objetivos_generales !== undefined) {
      updateData.objetivos_generales = objetivos_generales;
    }
    if (estructura_sesiones !== undefined) {
      updateData.estructura_sesiones = estructura_sesiones;
    }
    if (contenido !== undefined) {
      updateData.contenido = contenido;
    }
    if (metodologias !== undefined) {
      updateData.metodologias = metodologias;
    }
    if (contexto_grupo !== undefined) {
      updateData.contexto_grupo = contexto_grupo;
    }

    // Actualizar guía maestra
    const { data: guiaActualizada, error: updateError } = await supabase
      .from('guias_tema')
      .update(updateData)
      .eq('id', id_guia_tema)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando guía:', updateError);
      throw updateError;
    }

    console.log('Guía maestra actualizada:', guiaActualizada.id);

    return new Response(JSON.stringify({ 
      success: true, 
      guia_tema: guiaActualizada,
      mensaje: 'Guía maestra actualizada exitosamente'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en actualizar-guia-tema:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});


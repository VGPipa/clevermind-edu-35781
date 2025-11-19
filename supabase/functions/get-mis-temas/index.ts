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

    console.log('Obteniendo temas del profesor:', user.id);

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

    // Obtener guías maestras del profesor
    const { data: guiasTema, error: guiasError } = await supabase
      .from('guias_tema')
      .select(`
        *,
        temas (
          id,
          nombre,
          descripcion,
          objetivos,
          duracion_estimada,
          bimestre,
          materias (
            nombre,
            horas_semanales,
            plan_anual (
              grado
            )
          )
        )
      `)
      .eq('id_profesor', profesor.id)
      .order('created_at', { ascending: false });

    if (guiasError) {
      console.error('Error obteniendo guías:', guiasError);
      throw guiasError;
    }

    // Para cada tema, obtener sus sesiones
    const temasConSesiones = await Promise.all(
      (guiasTema || []).map(async (guiaTema) => {
        const { data: sesiones } = await supabase
          .from('clases')
          .select(`
            id,
            numero_sesion,
            fecha_programada,
            fecha_ejecutada,
            estado,
            duracion_minutos,
            grupos (
              nombre,
              grado,
              seccion
            )
          `)
          .eq('id_guia_tema', guiaTema.id)
          .order('numero_sesion', { ascending: true });

        const sesionesCompletadas = sesiones?.filter(s => s.estado === 'completada').length || 0;
        const sesionesProgramadas = sesiones?.filter(s => s.fecha_programada && s.estado !== 'completada').length || 0;
        const sesionesPendientes = guiaTema.total_sesiones - (sesiones?.length || 0);

        return {
          id: guiaTema.id,
          tema: guiaTema.temas,
          guia_maestra: {
            id: guiaTema.id,
            objetivos_generales: guiaTema.objetivos_generales,
            contenido: guiaTema.contenido,
            estructura_sesiones: guiaTema.estructura_sesiones,
            metodologias: guiaTema.metodologias,
            created_at: guiaTema.created_at
          },
          total_sesiones: guiaTema.total_sesiones,
          sesiones: sesiones || [],
          progreso: {
            completadas: sesionesCompletadas,
            programadas: sesionesProgramadas,
            pendientes: sesionesPendientes,
            porcentaje: Math.round((sesionesCompletadas / guiaTema.total_sesiones) * 100)
          },
          estado: sesionesCompletadas === guiaTema.total_sesiones ? 'completado' : 
                  sesionesCompletadas > 0 ? 'en_progreso' : 'iniciado'
        };
      })
    );

    console.log(`Encontrados ${temasConSesiones.length} temas`);

    return new Response(JSON.stringify({ 
      temas: temasConSesiones 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error en get-mis-temas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
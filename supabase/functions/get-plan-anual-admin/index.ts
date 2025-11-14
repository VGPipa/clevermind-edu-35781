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

    // Get authenticated user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get query parameters
    const url = new URL(req.url);
    const grado = url.searchParams.get('grado');
    const anioEscolar = url.searchParams.get('anio_escolar') || '2025';

    // Get user institution
    const { data: profile } = await supabase
      .from('profiles')
      .select('id_institucion')
      .eq('user_id', user.id)
      .single();

    if (!profile?.id_institucion) {
      return new Response(JSON.stringify({ error: 'Institution not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get plan anual
    let planQuery = supabase
      .from('plan_anual')
      .select('*')
      .eq('id_institucion', profile.id_institucion)
      .eq('anio_escolar', anioEscolar);

    if (grado) {
      planQuery = planQuery.eq('grado', grado);
    }

    const { data: planes, error: planesError } = await planQuery;

    if (planesError) {
      console.error('Error fetching plan anual:', planesError);
      return new Response(JSON.stringify({ error: 'Error fetching plan anual' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!planes || planes.length === 0) {
      return new Response(JSON.stringify({ 
        plan_anual: null,
        estadisticas: {
          total_materias: 0,
          materias_con_temas: 0,
          materias_sin_temas: 0,
          total_temas: 0,
          distribucion_bimestres: { 1: 0, 2: 0, 3: 0, 4: 0 },
          total_horas_semanales: 0
        },
        materias: []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process all plans (could be multiple grades)
    const allMateriasData = [];
    let totalStats = {
      total_materias: 0,
      materias_con_temas: 0,
      materias_sin_temas: 0,
      total_temas: 0,
      distribucion_bimestres: { 1: 0, 2: 0, 3: 0, 4: 0 },
      total_horas_semanales: 0
    };

    for (const plan of planes) {
      // Get materias for this plan
      const { data: materias, error: materiasError } = await supabase
        .from('materias')
        .select('*')
        .eq('id_plan_anual', plan.id)
        .order('orden');

      if (materiasError) {
        console.error('Error fetching materias:', materiasError);
        continue;
      }

      // For each materia, get temas and statistics
      for (const materia of materias || []) {
        const { data: temas, error: temasError } = await supabase
          .from('temas')
          .select('*')
          .eq('id_materia', materia.id)
          .order('bimestre')
          .order('orden');

        // Get assignment statistics
        const { count: profesoresAsignados } = await supabase
          .from('asignaciones_profesor')
          .select('id', { count: 'exact', head: true })
          .eq('id_materia', materia.id)
          .eq('anio_escolar', anioEscolar);

        // Get class statistics
        const { data: clasesData } = await supabase
          .from('clases')
          .select('id, estado, id_tema')
          .in('id_tema', (temas || []).map(t => t.id));

        const clasesProgramadas = clasesData?.length || 0;
        const clasesEjecutadas = clasesData?.filter(c => c.estado === 'ejecutada').length || 0;

        // Organize temas by bimestre
        const temasPorBimestre: any = { 1: [], 2: [], 3: [], 4: [] };
        (temas || []).forEach(tema => {
          const bimestre = tema.bimestre || 1;
          temasPorBimestre[bimestre].push(tema);
          totalStats.distribucion_bimestres[bimestre as 1 | 2 | 3 | 4]++;
        });

        const totalTemas = temas?.length || 0;
        totalStats.total_materias++;
        totalStats.total_temas += totalTemas;
        totalStats.total_horas_semanales += materia.horas_semanales || 0;

        if (totalTemas > 0) {
          totalStats.materias_con_temas++;
        } else {
          totalStats.materias_sin_temas++;
        }

        allMateriasData.push({
          id: materia.id,
          nombre: materia.nombre,
          descripcion: materia.descripcion,
          horas_semanales: materia.horas_semanales || 0,
          orden: materia.orden || 0,
          grado: plan.grado,
          anio_escolar: plan.anio_escolar,
          total_temas: totalTemas,
          temas_por_bimestre: temasPorBimestre,
          profesores_asignados: profesoresAsignados || 0,
          clases_programadas: clasesProgramadas,
          clases_ejecutadas: clasesEjecutadas,
          estado: totalTemas > 0 ? 'completo' : 'pendiente',
        });
      }
    }

    return new Response(JSON.stringify({
      plan_anual: planes[0], // Main plan (or first if multiple)
      estadisticas: totalStats,
      materias: allMateriasData,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-plan-anual-admin:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

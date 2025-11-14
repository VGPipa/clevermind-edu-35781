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

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    // Classes this week
    const { count: classesThisWeek } = await supabase
      .from('clases')
      .select('id', { count: 'exact', head: true })
      .eq('id_profesor', profesor.id)
      .gte('fecha_programada', weekStart.toISOString())
      .lte('fecha_programada', today.toISOString());

    // Assigned subjects (via asignaciones_profesor)
    const { count: assignedSubjects } = await supabase
      .from('asignaciones_profesor')
      .select('id_materia', { count: 'exact', head: true })
      .eq('id_profesor', profesor.id);

    // Total students (count unique students in assigned grupos)
    const { data: grupos } = await supabase
      .from('asignaciones_profesor')
      .select('id_grupo')
      .eq('id_profesor', profesor.id);

    let totalStudents = 0;
    if (grupos && grupos.length > 0) {
      const grupoIds = grupos.map(g => g.id_grupo);
      const { data: gruposData } = await supabase
        .from('grupos')
        .select('cantidad_alumnos')
        .in('id', grupoIds);
      
      totalStudents = gruposData?.reduce((sum, g) => sum + (g.cantidad_alumnos || 0), 0) || 0;
    }

    // General average (from completed classes)
    const { data: results } = await supabase
      .from('resultados_clase')
      .select('promedio_puntaje, clases!inner(id_profesor)')
      .eq('clases.id_profesor', profesor.id);

    const generalAverage = results && results.length > 0
      ? results.reduce((sum, r) => sum + Number(r.promedio_puntaje || 0), 0) / results.length
      : 0;

    // Upcoming classes (next 7 days)
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const { data: upcomingClasses } = await supabase
      .from('clases')
      .select(`
        id,
        fecha_programada,
        estado,
        duracion_minutos,
        metodologia,
        temas!inner(id, nombre, id_materia),
        grupos!inner(id, nombre, cantidad_alumnos, grado, seccion)
      `)
      .eq('id_profesor', profesor.id)
      .gte('fecha_programada', today.toISOString())
      .lte('fecha_programada', sevenDaysFromNow.toISOString())
      .order('fecha_programada', { ascending: true });

    // Get materia names for each class
    const classesWithMaterias = await Promise.all(
      (upcomingClasses || []).map(async (clase: any) => {
        const { data: materia } = await supabase
          .from('materias')
          .select('nombre')
          .eq('id', clase.temas[0].id_materia)
          .single();

        return {
          ...clase,
          materia_nombre: materia?.nombre || 'Sin materia',
          tema_info: clase.temas[0],
          grupo_info: clase.grupos[0],
        };
      })
    );

    // Check for guides and evaluations for each class
    const classesWithStatus = await Promise.all(
      classesWithMaterias.map(async (clase: any) => {
        const { data: guia } = await supabase
          .from('guias_clase')
          .select('id')
          .eq('id_clase', clase.id)
          .maybeSingle();
        
        const { data: evalPre } = await supabase
          .from('quizzes')
          .select('id, estado')
          .eq('id_clase', clase.id)
          .eq('tipo', 'diagnostica')
          .maybeSingle();
        
        const { data: evalPost } = await supabase
          .from('quizzes')
          .select('id, estado')
          .eq('id_clase', clase.id)
          .eq('tipo', 'sumativa')
          .maybeSingle();
        
        return {
          id: clase.id,
          fecha_programada: clase.fecha_programada,
          materia: clase.materia_nombre,
          tema: clase.tema_info.nombre,
          grupo: `${clase.grupo_info.grado} ${clase.grupo_info.seccion}`,
          estudiantes: clase.grupo_info.cantidad_alumnos || 0,
          estado: clase.estado,
          tiene_guia: !!guia,
          tiene_eval_pre: !!evalPre,
          tiene_eval_post: !!evalPost,
          eval_pre_estado: evalPre?.estado || null,
          eval_post_estado: evalPost?.estado || null,
        };
      })
    );

    // Separate into two sections
    const clasesPendientes = classesWithStatus.filter(c => !c.tiene_guia || c.estado === 'borrador');
    const clasesListas = classesWithStatus.filter(c => c.tiene_guia && c.estado !== 'borrador');
    
    // Preparation alerts (classes in next 7 days that are still draft)
    // Latest recommendations
    const { data: recommendations } = await supabase
      .from('recomendaciones')
      .select(`
        id,
        contenido,
        created_at,
        clases!inner(id_profesor, temas!inner(nombre))
      `)
      .eq('clases.id_profesor', profesor.id)
      .eq('aplicada', false)
      .order('created_at', { ascending: false })
      .limit(3);

    return new Response(
      JSON.stringify({
        stats: {
          classes_this_week: classesThisWeek || 0,
          assigned_subjects: assignedSubjects || 0,
          total_students: totalStudents,
          general_average: Number(generalAverage.toFixed(1))
        },
        clases_pendientes: clasesPendientes,
        clases_listas: clasesListas,
        recommendations: recommendations || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in dashboard-profesor:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
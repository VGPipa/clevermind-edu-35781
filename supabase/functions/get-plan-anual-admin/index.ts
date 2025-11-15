import {
  createSupabaseClient,
  getAuthenticatedUser,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createErrorResponse('No authorization header', 401);
    }

    const supabase = createSupabaseClient(authHeader, true);
    const user = await getAuthenticatedUser(supabase);

    // Verify admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!userRole || userRole.role !== 'admin') {
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Get parameters from query string or body
    const url = new URL(req.url);
    let grado = url.searchParams.get('grado');
    let anioEscolar = url.searchParams.get('anio_escolar') || '2025';
    let viewMode = url.searchParams.get('view_mode') || 'grado'; // 'overview' | 'grado'
    
    // If POST request, try to get from body first (Supabase functions.invoke sends body in POST)
    // Note: req.json() can only be called once, so we need to handle this carefully
    if (req.method === 'POST') {
      try {
        // Check if request has body by cloning (but Deno doesn't support clone, so we try-catch)
        const body = await req.json();
        if (body && typeof body === 'object') {
          grado = body.grado || grado;
          anioEscolar = body.anio_escolar || anioEscolar;
          viewMode = body.view_mode || viewMode;
        }
      } catch (e) {
        // Body parsing failed or empty, use query params only
        // This is expected for GET requests or empty bodies
      }
    }

    // Get user institution
    const { data: profile } = await supabase
      .from('profiles')
      .select('id_institucion')
      .eq('user_id', user.id)
      .single();

    if (!profile?.id_institucion) {
      return createErrorResponse('Institution not found', 404);
    }

    // If overview mode, return data grouped by grado
    if (viewMode === 'overview') {
      const gradosPosibles = [
        '1° Primaria',
        '2° Primaria',
        '3° Primaria',
        '4° Primaria',
        '5° Primaria',
        '6° Primaria',
      ];

      const planesPorGrado = await Promise.all(
        gradosPosibles.map(async (gradoNombre) => {
          // Get plan for this grado
          const { data: plan } = await supabase
            .from('plan_anual')
            .select('*')
            .eq('id_institucion', profile.id_institucion)
            .eq('anio_escolar', anioEscolar)
            .eq('grado', gradoNombre)
            .maybeSingle();

          // Get grupos for this grado
          const { data: grupos, count: gruposCount } = await supabase
            .from('grupos')
            .select('id, nombre, seccion, cantidad_alumnos', { count: 'exact' })
            .eq('id_institucion', profile.id_institucion)
            .eq('grado', gradoNombre);

          // Get materias and calculate stats if plan exists
          let estadisticas = {
            total_materias: 0,
            total_temas: 0,
            horas_semanales: 0,
            completitud: 0,
            materias_con_temas: 0,
            materias_sin_temas: 0,
          };

          let profesoresAsignados = 0;

          if (plan) {
            const { data: materias } = await supabase
              .from('materias')
              .select('id, horas_semanales')
              .eq('id_plan_anual', plan.id);

            estadisticas.total_materias = materias?.length || 0;
            estadisticas.horas_semanales = materias?.reduce((sum, m) => sum + (m.horas_semanales || 0), 0) || 0;

            if (materias && materias.length > 0) {
              const materiaIds = materias.map(m => m.id);
              const { data: temas } = await supabase
                .from('temas')
                .select('id, id_materia')
                .in('id_materia', materiaIds);

              estadisticas.total_temas = temas?.length || 0;

              const materiasConTemas = new Set(temas?.map(t => t.id_materia) || []);
              estadisticas.materias_con_temas = materiasConTemas.size;
              estadisticas.materias_sin_temas = estadisticas.total_materias - estadisticas.materias_con_temas;
              estadisticas.completitud = estadisticas.total_materias > 0
                ? Math.round((estadisticas.materias_con_temas / estadisticas.total_materias) * 100)
                : 0;

              // Count unique profesores assigned to this grado
              const { data: asignaciones } = await supabase
                .from('asignaciones_profesor')
                .select('id_profesor')
                .in('id_materia', materiaIds)
                .eq('anio_escolar', anioEscolar);

              const profesoresUnicos = new Set(asignaciones?.map(a => a.id_profesor) || []);
              profesoresAsignados = profesoresUnicos.size;
            }
          }

          return {
            grado: gradoNombre,
            plan_anual: plan,
            grupos: grupos || [],
            cantidad_grupos: gruposCount || 0,
            estadisticas,
            profesores_asignados: profesoresAsignados,
          };
        })
      );

      return createSuccessResponse({
        view_mode: 'overview',
        anio_escolar: anioEscolar,
        planes_por_grado: planesPorGrado,
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
      return createErrorResponse('Error fetching plan anual', 500);
    }

    if (!planes || planes.length === 0) {
      return createSuccessResponse({ 
        view_mode: 'grado',
        plan_anual: null,
        estadisticas: {
          total_materias: 0,
          materias_con_temas: 0,
          materias_sin_temas: 0,
          total_temas: 0,
          distribucion_bimestres: { 1: 0, 2: 0, 3: 0, 4: 0 },
          total_horas_semanales: 0
        },
        materias: [],
        grupos: []
      });
    }

    // Get grupos for the selected grado(s)
    const gradosEnPlanes = [...new Set(planes.map(p => p.grado))];
    const { data: grupos } = await supabase
      .from('grupos')
      .select('id, nombre, grado, seccion, cantidad_alumnos')
      .eq('id_institucion', profile.id_institucion)
      .in('grado', gradosEnPlanes);

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

    return createSuccessResponse({
      view_mode: 'grado',
      plan_anual: planes[0], // Main plan (or first if multiple)
      estadisticas: totalStats,
      materias: allMateriasData,
      grupos: grupos || [],
    });

  } catch (error) {
    console.error('Error in get-plan-anual-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});

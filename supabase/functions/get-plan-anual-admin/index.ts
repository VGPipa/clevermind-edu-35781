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
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError) {
      console.error('Error checking user role:', roleError);
      return createErrorResponse('Error verifying permissions', 500);
    }

    if (!userRole || userRole.role !== 'admin') {
      return createErrorResponse('Forbidden - Admin access required', 403);
    }

    // Get parameters from query string or body
    const url = new URL(req.url);
    let grado = url.searchParams.get('grado');
    let anioEscolar = url.searchParams.get('anio_escolar') || new Date().getFullYear().toString();
    let viewMode = url.searchParams.get('view_mode') || 'grado'; // 'overview' | 'grado'
    
    // If POST request, try to get from body
    if (req.method === 'POST') {
      try {
        const contentType = req.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const body = await req.json();
          if (body && typeof body === 'object') {
            grado = body.grado || grado;
            anioEscolar = body.anio_escolar || anioEscolar;
            viewMode = body.view_mode || viewMode;
          }
        }
      } catch (e) {
        console.warn('Failed to parse request body, using query params:', e);
      }
    }

    // Get user institution
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id_institucion')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return createErrorResponse('Error fetching user profile', 500);
    }

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

      // Fetch all data in parallel for better performance
      const [planesResult, gruposResult] = await Promise.all([
        supabase
          .from('plan_anual')
          .select('*')
          .eq('id_institucion', profile.id_institucion)
          .eq('anio_escolar', anioEscolar)
          .in('grado', gradosPosibles),
        supabase
          .from('grupos')
          .select('id, nombre, grado, seccion, cantidad_alumnos')
          .eq('id_institucion', profile.id_institucion)
          .in('grado', gradosPosibles)
      ]);

      if (planesResult.error) {
        console.error('Error fetching planes:', planesResult.error);
        return createErrorResponse('Error fetching annual plans', 500);
      }

      if (gruposResult.error) {
        console.error('Error fetching grupos:', gruposResult.error);
        return createErrorResponse('Error fetching groups', 500);
      }

      const planes = planesResult.data || [];
      const todosGrupos = gruposResult.data || [];

      // Group grupos by grado
      const gruposPorGrado = todosGrupos.reduce((acc: any, grupo: any) => {
        if (!acc[grupo.grado]) acc[grupo.grado] = [];
        acc[grupo.grado].push(grupo);
        return acc;
      }, {});

      // Get all materias for all planes in parallel
      const planIds = planes.map(p => p.id);
      const { data: todasMaterias, error: materiasError } = planIds.length > 0 
        ? await supabase
            .from('materias')
            .select('id, id_plan_anual, horas_semanales')
            .in('id_plan_anual', planIds)
        : { data: null, error: null };

      if (materiasError) {
        console.error('Error fetching materias:', materiasError);
        return createErrorResponse('Error fetching subjects', 500);
      }

      // Group materias by plan
      const materiasPorPlan = (todasMaterias || []).reduce((acc: any, materia: any) => {
        if (!acc[materia.id_plan_anual]) acc[materia.id_plan_anual] = [];
        acc[materia.id_plan_anual].push(materia);
        return acc;
      }, {});

      // Get all temas for all materias in parallel
      const materiaIds = (todasMaterias || []).map((m: any) => m.id);
      const { data: todosTemas, error: temasError } = materiaIds.length > 0
        ? await supabase
            .from('temas')
            .select('id, id_materia')
            .in('id_materia', materiaIds)
        : { data: null, error: null };

      if (temasError) {
        console.error('Error fetching temas:', temasError);
        return createErrorResponse('Error fetching topics', 500);
      }

      // Group temas by materia
      const temasPorMateria = (todosTemas || []).reduce((acc: any, tema: any) => {
        if (!acc[tema.id_materia]) acc[tema.id_materia] = 0;
        acc[tema.id_materia]++;
        return acc;
      }, {});

      // Get all asignaciones in parallel
      const { data: todasAsignaciones, error: asignacionesError } = materiaIds.length > 0
        ? await supabase
            .from('asignaciones_profesor')
            .select('id_profesor, id_materia')
            .in('id_materia', materiaIds)
            .eq('anio_escolar', anioEscolar)
        : { data: null, error: null };

      if (asignacionesError) {
        console.error('Error fetching asignaciones:', asignacionesError);
        return createErrorResponse('Error fetching assignments', 500);
      }

      // Group profesores by plan
      const profesoresPorPlan = (todasAsignaciones || []).reduce((acc: any, asig: any) => {
        const materia = (todasMaterias || []).find((m: any) => m.id === asig.id_materia);
        if (materia) {
          if (!acc[materia.id_plan_anual]) acc[materia.id_plan_anual] = new Set();
          acc[materia.id_plan_anual].add(asig.id_profesor);
        }
        return acc;
      }, {});

      // Build response for each grado
      const planesPorGrado = gradosPosibles.map((gradoNombre) => {
        const plan = planes.find(p => p.grado === gradoNombre);
        const grupos = gruposPorGrado[gradoNombre] || [];
        
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
          const materias = materiasPorPlan[plan.id] || [];
          estadisticas.total_materias = materias.length;
          estadisticas.horas_semanales = materias.reduce((sum: number, m: any) => sum + (m.horas_semanales || 0), 0);

          const materiasConTemas = materias.filter((m: any) => temasPorMateria[m.id] > 0);
          estadisticas.materias_con_temas = materiasConTemas.length;
          estadisticas.materias_sin_temas = estadisticas.total_materias - estadisticas.materias_con_temas;
          estadisticas.total_temas = materias.reduce((sum: number, m: any) => sum + (temasPorMateria[m.id] || 0), 0);
          estadisticas.completitud = estadisticas.total_materias > 0
            ? Math.round((estadisticas.materias_con_temas / estadisticas.total_materias) * 100)
            : 0;

          profesoresAsignados = profesoresPorPlan[plan.id]?.size || 0;
        }

        return {
          grado: gradoNombre,
          plan_anual: plan || null,
          grupos,
          cantidad_grupos: grupos.length,
          estadisticas,
          profesores_asignados: profesoresAsignados,
        };
      });

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
    const allMateriasData: any[] = [];
    let totalStats = {
      total_materias: 0,
      materias_con_temas: 0,
      materias_sin_temas: 0,
      total_temas: 0,
      distribucion_bimestres: { 1: 0, 2: 0, 3: 0, 4: 0 },
      total_horas_semanales: 0
    };

    if (planes.length === 0) {
      return createSuccessResponse({ 
        view_mode: 'grado',
        plan_anual: null,
        estadisticas: totalStats,
        materias: [],
        grupos: grupos || []
      });
    }

    const planIds = planes.map(p => p.id);

    // Fetch all related data in parallel
    const [materiasResult, clasesDataResult] = await Promise.all([
      supabase
        .from('materias')
        .select('*')
        .in('id_plan_anual', planIds)
        .order('orden'),
      // We'll get clases for all temas later
      Promise.resolve({ data: [], error: null })
    ]);

    if (materiasResult.error) {
      console.error('Error fetching materias:', materiasResult.error);
      return createErrorResponse('Error fetching subjects', 500);
    }

    const todasMaterias = materiasResult.data || [];
    const materiaIds = todasMaterias.map(m => m.id);

    if (materiaIds.length === 0) {
      return createSuccessResponse({
        view_mode: 'grado',
        plan_anual: planes[0],
        estadisticas: totalStats,
        materias: [],
        grupos: grupos || [],
      });
    }

    // Fetch temas, asignaciones, and clases in parallel
    const [temasResult, asignacionesResult, clasesResult] = await Promise.all([
      supabase
        .from('temas')
        .select('*')
        .in('id_materia', materiaIds)
        .order('bimestre')
        .order('orden'),
      supabase
        .from('asignaciones_profesor')
        .select('id, id_materia', { count: 'exact', head: true })
        .in('id_materia', materiaIds)
        .eq('anio_escolar', anioEscolar),
      Promise.resolve({ data: [], error: null }) // We'll fetch clases per tema later
    ]);

    if (temasResult.error) {
      console.error('Error fetching temas:', temasResult.error);
      return createErrorResponse('Error fetching topics', 500);
    }

    if (asignacionesResult.error) {
      console.error('Error fetching asignaciones:', asignacionesResult.error);
      return createErrorResponse('Error fetching assignments', 500);
    }

    const todosTemas = temasResult.data || [];
    const temaIds = todosTemas.map(t => t.id);

    // Get clases for all temas
    const { data: clasesData, error: clasesError } = temaIds.length > 0
      ? await supabase
          .from('clases')
          .select('id, estado, id_tema')
          .in('id_tema', temaIds)
      : { data: null, error: null };

    if (clasesError) {
      console.error('Error fetching clases:', clasesError);
      // Don't fail completely, just log the error
    }

    // Group data by materia
    const temasPorMateria = todosTemas.reduce((acc: any, tema: any) => {
      if (!acc[tema.id_materia]) acc[tema.id_materia] = [];
      acc[tema.id_materia].push(tema);
      return acc;
    }, {});

    const clasesPorTema = (clasesData || []).reduce((acc: any, clase: any) => {
      if (!acc[clase.id_tema]) acc[clase.id_tema] = [];
      acc[clase.id_tema].push(clase);
      return acc;
    }, {});

    // Count asignaciones per materia
    const asignacionesPorMateria: any = {};
    for (const materia of todasMaterias) {
      const { count } = await supabase
        .from('asignaciones_profesor')
        .select('id', { count: 'exact', head: true })
        .eq('id_materia', materia.id)
        .eq('anio_escolar', anioEscolar);
      asignacionesPorMateria[materia.id] = count || 0;
    }

    // Build materias data
    for (const plan of planes) {
      const materiasDePlan = todasMaterias.filter(m => m.id_plan_anual === plan.id);

      for (const materia of materiasDePlan) {
        const temas = temasPorMateria[materia.id] || [];
        const totalTemas = temas.length;

        // Organize temas by bimestre
        const temasPorBimestre: any = { 1: [], 2: [], 3: [], 4: [] };
        temas.forEach((tema: any) => {
          const bimestre = tema.bimestre || 1;
          temasPorBimestre[bimestre].push(tema);
          totalStats.distribucion_bimestres[bimestre as 1 | 2 | 3 | 4]++;
        });

        // Calculate clases statistics
        let clasesProgramadas = 0;
        let clasesEjecutadas = 0;
        temas.forEach((tema: any) => {
          const clasesDelTema = clasesPorTema[tema.id] || [];
          clasesProgramadas += clasesDelTema.length;
          clasesEjecutadas += clasesDelTema.filter((c: any) => c.estado === 'ejecutada').length;
        });

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
          profesores_asignados: asignacionesPorMateria[materia.id] || 0,
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

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[get-asignaciones-admin] No authorization header');
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[get-asignaciones-admin] User authentication failed:', userError);
      throw new Error('Usuario no autenticado');
    }

    // Verificar que el usuario es admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !userRole) {
      console.error('[get-asignaciones-admin] Authorization failed for user:', user.id);
      throw new Error('Usuario no autorizado');
    }

    console.log('[get-asignaciones-admin] User authorized:', user.email);

    // Obtener parámetros de consulta
    const url = new URL(req.url);
    const profesorId = url.searchParams.get('profesor');
    const materiaId = url.searchParams.get('materia');
    const grado = url.searchParams.get('grado');
    const anioEscolar = url.searchParams.get('anio') || new Date().getFullYear().toString();

    console.log('[get-asignaciones-admin] Query params:', { profesorId, materiaId, grado, anioEscolar });

    // Construir query para asignaciones con joins - OPTIMIZADO con campos específicos
    let query = supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        anio_escolar,
        created_at,
        id_profesor,
        id_materia,
        id_grupo,
        profesores!inner(
          id,
          user_id,
          especialidad,
          activo
        ),
        materias!inner(
          id,
          nombre,
          descripcion,
          horas_semanales
        ),
        grupos!inner(
          id,
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        )
      `)
      .eq('anio_escolar', anioEscolar)
      .order('created_at', { ascending: false });

    // Aplicar filtros si existen
    if (profesorId) {
      query = query.eq('id_profesor', profesorId);
    }
    if (materiaId) {
      query = query.eq('id_materia', materiaId);
    }

    const queryStart = Date.now();
    const { data: asignacionesRaw, error: asignacionesError } = await query;
    console.log('[get-asignaciones-admin] Asignaciones query took:', Date.now() - queryStart, 'ms');

    if (asignacionesError) {
      console.error('[get-asignaciones-admin] Error fetching asignaciones:', asignacionesError);
      throw asignacionesError;
    }

    // PARALELIZAR: Obtener perfiles, profesores, materias y grupos en paralelo
    const profesorUserIds = [...new Set(
      asignacionesRaw.map((a: any) => a.profesores.user_id)
    )];

    const parallelStart = Date.now();
    const [profilesResult, profesoresResult, materiasResult, gruposResult] = await Promise.all([
      // Perfiles de profesores
      supabase
        .from('profiles')
        .select('user_id, nombre, apellido, email')
        .in('user_id', profesorUserIds),
      
      // Todos los profesores activos
      supabase
        .from('profesores')
        .select('id, user_id, especialidad, activo')
        .eq('activo', true),
      
      // Todas las materias con plan anual
      supabase
        .from('materias')
        .select('id, nombre, descripcion, horas_semanales, id_plan_anual, plan_anual(grado)')
        .order('nombre'),
      
      // Todos los grupos
      supabase
        .from('grupos')
        .select('id, nombre, grado, seccion, cantidad_alumnos')
        .order('grado, seccion')
    ]);

    console.log('[get-asignaciones-admin] Parallel queries took:', Date.now() - parallelStart, 'ms');

    if (profilesResult.error) throw profilesResult.error;
    if (profesoresResult.error) throw profesoresResult.error;
    if (materiasResult.error) throw materiasResult.error;
    if (gruposResult.error) throw gruposResult.error;

    // Crear mapa de perfiles para acceso rápido
    const profilesMap = new Map(
      profilesResult.data?.map(p => [p.user_id, p]) || []
    );

    // Obtener perfiles de profesores activos
    const profesoresUserIds = profesoresResult.data?.map(p => p.user_id) || [];
    const { data: profesoresProfiles } = await supabase
      .from('profiles')
      .select('user_id, nombre, apellido, email')
      .in('user_id', profesoresUserIds);

    const profesoresProfilesMap = new Map(
      profesoresProfiles?.map(p => [p.user_id, p]) || []
    );

    // Formatear profesores con perfil
    const profesoresFormateados = profesoresResult.data?.map(p => {
      const profile = profesoresProfilesMap.get(p.user_id);
      return {
        id: p.id,
        user_id: p.user_id,
        nombre: profile?.nombre || '',
        apellido: profile?.apellido || '',
        email: profile?.email || '',
        especialidad: p.especialidad,
        activo: p.activo,
      };
    }) || [];

    // Formatear las asignaciones
    const asignaciones = asignacionesRaw.map((a: any) => {
      const profile = profilesMap.get(a.profesores.user_id);
      
      return {
        id: a.id,
        anio_escolar: a.anio_escolar,
        created_at: a.created_at,
        profesor: {
          id: a.profesores.id,
          nombre: profile?.nombre || '',
          apellido: profile?.apellido || '',
          email: profile?.email || '',
          especialidad: a.profesores.especialidad,
          activo: a.profesores.activo,
        },
        materia: {
          id: a.materias.id,
          nombre: a.materias.nombre,
          descripcion: a.materias.descripcion,
          horas_semanales: a.materias.horas_semanales,
        },
        grupo: {
          id: a.grupos.id,
          nombre: a.grupos.nombre,
          grado: a.grupos.grado,
          seccion: a.grupos.seccion,
          cantidad_alumnos: a.grupos.cantidad_alumnos,
        },
      };
    });

    // Filtrar por grado si se especificó
    let asignacionesFiltradas = asignaciones;
    if (grado) {
      asignacionesFiltradas = asignaciones.filter(a => a.grupo.grado === grado);
    }

    // Calcular estadísticas mejoradas
    const profesoresUnicos = new Set(asignacionesFiltradas.map(a => a.profesor.id));
    const materiasUnicas = new Set(asignacionesFiltradas.map(a => a.materia.id));
    
    // Calcular grupos completos (grupos que tienen todas las materias asignadas del mismo grado)
    const gruposPorGrado = new Map();
    const materiasDelAnio = materiasResult.data || [];
    
    // Agrupar por grado y contar materias
    gruposResult.data?.forEach(grupo => {
      const materiasDeEsteGrado = materiasDelAnio.filter(m => {
        // plan_anual puede ser un objeto { grado: string } o null
        const planAnual = m.plan_anual;
        if (!planAnual) return false;
        // Asegurar que plan_anual es un objeto con grado
        const gradoValue = (planAnual as any)?.grado;
        return gradoValue === grupo.grado;
      });
      gruposPorGrado.set(grupo.id, {
        grado: grupo.grado,
        materiasTotales: materiasDeEsteGrado.length,
        materiasAsignadas: 0,
      });
    });

    // Contar materias asignadas por grupo
    asignacionesFiltradas.forEach(a => {
      const grupoInfo = gruposPorGrado.get(a.grupo.id);
      if (grupoInfo) {
        grupoInfo.materiasAsignadas++;
      }
    });

    // Contar grupos completos
    let gruposCompletos = 0;
    gruposPorGrado.forEach(info => {
      if (info.materiasTotales > 0 && info.materiasAsignadas >= info.materiasTotales) {
        gruposCompletos++;
      }
    });

    // Calcular profesores sobrecargados (más de 40 horas semanales)
    const cargaHorariaPorProfesor = new Map();
    asignacionesFiltradas.forEach(a => {
      const current = cargaHorariaPorProfesor.get(a.profesor.id) || 0;
      cargaHorariaPorProfesor.set(a.profesor.id, current + (a.materia.horas_semanales || 0));
    });

    const profesoresSobrecargados = Array.from(cargaHorariaPorProfesor.values())
      .filter(horas => horas > 40).length;

    // Calcular materias sin profesor
    const materiasConProfesor = new Set(asignacionesFiltradas.map(a => a.materia.id));
    const materiasSinProfesor = materiasUnicas.size === 0 
      ? 0 
      : materiasDelAnio.filter(m => !materiasConProfesor.has(m.id)).length;

    const estadisticas = {
      total_asignaciones: asignacionesFiltradas.length,
      profesores_asignados: profesoresUnicos.size,
      materias_cubiertas: materiasUnicas.size,
      grupos_completos: gruposCompletos,
      alertas: {
        profesores_sobrecargados: profesoresSobrecargados,
        materias_sin_profesor: materiasSinProfesor,
      }
    };

    const totalTime = Date.now() - startTime;
    console.log('[get-asignaciones-admin] Total request time:', totalTime, 'ms');
    console.log('[get-asignaciones-admin] Asignaciones obtenidas exitosamente:', asignacionesFiltradas.length);

    return new Response(
      JSON.stringify({
        asignaciones: asignacionesFiltradas,
        estadisticas,
        profesores: profesoresFormateados,
        materias: materiasResult.data || [],
        grupos: gruposResult.data || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[get-asignaciones-admin] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const statusCode = error instanceof Error && error.message.includes('no autenticado') ? 401 :
                       error instanceof Error && error.message.includes('no autorizado') ? 403 : 500;
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: statusCode,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

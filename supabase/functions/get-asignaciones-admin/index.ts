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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error de autenticación:', userError);
      return new Response(
        JSON.stringify({ error: 'No autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar que es admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener parámetros de filtro
    const url = new URL(req.url);
    const profesorId = url.searchParams.get('profesor_id');
    const materiaId = url.searchParams.get('materia_id');
    const grado = url.searchParams.get('grado');
    const anioEscolar = url.searchParams.get('anio_escolar');

    // Construir query de asignaciones
    let query = supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        anio_escolar,
        created_at,
        id_profesor,
        id_materia,
        id_grupo,
        profesores (
          id,
          user_id,
          especialidad,
          activo
        ),
        materias (
          id,
          nombre,
          horas_semanales,
          descripcion,
          plan_anual (
            grado
          )
        ),
        grupos (
          id,
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        )
      `);

    if (profesorId) query = query.eq('id_profesor', profesorId);
    if (materiaId) query = query.eq('id_materia', materiaId);
    if (anioEscolar) query = query.eq('anio_escolar', anioEscolar);

    const { data: asignaciones, error: asignacionesError } = await query;

    if (asignacionesError) {
      console.error('Error obteniendo asignaciones:', asignacionesError);
      return new Response(
        JSON.stringify({ error: 'Error obteniendo asignaciones' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener perfiles de profesores
    const profesoresIds = [...new Set((asignaciones || []).map((a: any) => a.profesores?.user_id).filter(Boolean))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, nombre, apellido, email')
      .in('user_id', profesoresIds.length > 0 ? profesoresIds : ['']);

    const profilesMap = new Map(
      (profiles || []).map(p => [p.user_id, p])
    );

    // Formatear asignaciones
    const asignacionesFormateadas = (asignaciones || []).map((a: any) => {
      const profile = profilesMap.get(a.profesores?.user_id);
      return {
        id: a.id,
        profesor: {
          id: a.profesores?.id,
          nombre: profile?.nombre || '',
          apellido: profile?.apellido || '',
          email: profile?.email || '',
          especialidad: a.profesores?.especialidad || 'General'
        },
        materia: {
          id: a.materias?.id,
          nombre: a.materias?.nombre,
          horas_semanales: a.materias?.horas_semanales || 0,
          grado: a.materias?.plan_anual?.grado || ''
        },
        grupo: {
          id: a.grupos?.id,
          nombre: a.grupos?.nombre,
          grado: a.grupos?.grado,
          seccion: a.grupos?.seccion,
          cantidad_alumnos: a.grupos?.cantidad_alumnos || 0
        },
        anio_escolar: a.anio_escolar,
        created_at: a.created_at
      };
    });

    // Filtrar por grado si se especifica
    const asignacionesFiltradas = grado 
      ? asignacionesFormateadas.filter(a => a.grupo.grado === grado)
      : asignacionesFormateadas;

    // Calcular estadísticas
    const profesoresUnicos = new Set(asignacionesFiltradas.map(a => a.profesor.id));
    const materiasUnicas = new Set(asignacionesFiltradas.map(a => a.materia.id));

    // Obtener lista de profesores
    const { data: profesores } = await supabase
      .from('profesores')
      .select(`
        id,
        especialidad,
        activo,
        profiles:user_id (
          nombre,
          apellido,
          email
        )
      `)
      .eq('activo', true);

    // Obtener lista de materias
    const { data: materias } = await supabase
      .from('materias')
      .select('id, nombre, horas_semanales, plan_anual(grado)');

    // Obtener lista de grupos
    const { data: grupos } = await supabase
      .from('grupos')
      .select('id, nombre, grado, seccion, cantidad_alumnos');

    const resultado = {
      asignaciones: asignacionesFiltradas,
      estadisticas: {
        total_asignaciones: asignacionesFiltradas.length,
        profesores_asignados: profesoresUnicos.size,
        materias_cubiertas: materiasUnicas.size,
        grupos_completos: 0, // Calcular en base a si todos tienen todas las materias
        alertas: {
          materias_sin_profesor: 0,
          profesores_sobrecargados: 0,
          grupos_sin_materias: 0
        }
      },
      profesores: (profesores || []).map((p: any) => ({
        id: p.id,
        nombre: p.profiles?.nombre || '',
        apellido: p.profiles?.apellido || '',
        especialidad: p.especialidad
      })),
      materias: (materias || []).map((m: any) => ({
        id: m.id,
        nombre: m.nombre,
        horas_semanales: m.horas_semanales,
        grado: m.plan_anual?.grado || ''
      })),
      grupos: grupos || []
    };

    console.log('Asignaciones obtenidas exitosamente:', asignacionesFiltradas.length);

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en get-asignaciones-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

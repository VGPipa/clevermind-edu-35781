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

    console.log('Usuario autenticado:', user.id);

    // Obtener datos del profesor
    const { data: profesor, error: profesorError } = await supabase
      .from('profesores')
      .select(`
        id,
        user_id,
        especialidad,
        activo,
        created_at
      `)
      .eq('user_id', user.id)
      .single();

    if (profesorError || !profesor) {
      console.error('Error obteniendo profesor:', profesorError);
      return new Response(
        JSON.stringify({ error: 'Profesor no encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('nombre, apellido, email, avatar_url')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Error obteniendo perfil:', profileError);
    }

    // Obtener asignaciones con detalles
    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        anio_escolar,
        created_at,
        id_materia,
        id_grupo,
        materias (
          id,
          nombre,
          horas_semanales,
          descripcion
        ),
        grupos (
          id,
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        )
      `)
      .eq('id_profesor', profesor.id);

    if (asignacionesError) {
      console.error('Error obteniendo asignaciones:', asignacionesError);
    }

    console.log('Asignaciones obtenidas:', asignaciones?.length || 0);
    console.log('Asignaciones con datos completos:', asignaciones?.filter((a: any) => a.materias && a.grupos).length || 0);

    const asignacionesConEstadisticas = await Promise.all(
      (asignaciones || [])
        .filter((a: any) => a.materias && a.grupos) // Filtrar asignaciones con datos válidos
        .map(async (asignacion: any) => {
        // Contar temas de la materia
        const { count: totalTemas } = await supabase
          .from('temas')
          .select('*', { count: 'exact', head: true })
          .eq('id_materia', asignacion.id_materia);

        // Contar clases de esta asignación
        const { data: temasData } = await supabase
          .from('temas')
          .select('id')
          .eq('id_materia', asignacion.id_materia);
        
        const temasIds = temasData?.map(t => t.id) || [];
        
        const { data: clases } = await supabase
          .from('clases')
          .select('id, estado, fecha_programada, id_tema')
          .eq('id_profesor', profesor.id)
          .eq('id_grupo', asignacion.id_grupo)
          .in('id_tema', temasIds.length > 0 ? temasIds : ['00000000-0000-0000-0000-000000000000']);

        const clasesProgramadas = clases?.filter(c => c.estado === 'programada').length || 0;
        const clasesCompletadas = clases?.filter(c => c.estado === 'ejecutada').length || 0;
        const temasConClases = new Set(clases?.map(c => c.id_tema)).size;

        return {
          id: asignacion.id,
          materia: {
            id: asignacion.materias?.id || '',
            nombre: asignacion.materias?.nombre || '',
            horas_semanales: asignacion.materias?.horas_semanales || 0,
            total_temas: totalTemas || 0,
            descripcion: asignacion.materias?.descripcion || ''
          },
          grupo: {
            id: asignacion.grupos?.id || '',
            nombre: asignacion.grupos?.nombre || '',
            grado: asignacion.grupos?.grado || '',
            seccion: asignacion.grupos?.seccion || '',
            cantidad_alumnos: asignacion.grupos?.cantidad_alumnos || 0
          },
          anio_escolar: asignacion.anio_escolar,
          estadisticas: {
            clases_programadas: clasesProgramadas,
            clases_completadas: clasesCompletadas,
            temas_cubiertos: temasConClases,
            porcentaje_cobertura: totalTemas ? Math.round((temasConClases / totalTemas) * 100) : 0
          }
        };
      })
    );


    // Calcular estadísticas generales - manejar caso sin asignaciones
    const totalMaterias = asignacionesConEstadisticas.length;
    const gruposUnicos = new Set(
      asignacionesConEstadisticas
        .map(a => a.grupo?.id)
        .filter(id => id && id !== '')
    );
    const totalGrupos = gruposUnicos.size;
    const totalEstudiantes = asignacionesConEstadisticas.reduce(
      (sum, a) => sum + (a.grupo?.cantidad_alumnos || 0), 0
    );
    const horasSemanales = asignacionesConEstadisticas.reduce(
      (sum, a) => sum + (a.materia?.horas_semanales || 0), 0
    );

    const { count: clasesProgramadasMes } = await supabase
      .from('clases')
      .select('*', { count: 'exact', head: true })
      .eq('id_profesor', profesor.id)
      .eq('estado', 'programada')
      .gte('fecha_programada', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .lte('fecha_programada', new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());

    const { count: clasesCompletadasTotal } = await supabase
      .from('clases')
      .select('*', { count: 'exact', head: true })
      .eq('id_profesor', profesor.id)
      .eq('estado', 'ejecutada');

    const resultado = {
      profesor: {
        id: profesor.id,
        nombre: profile?.nombre || '',
        apellido: profile?.apellido || '',
        email: profile?.email || user.email || '',
        especialidad: profesor.especialidad || 'General',
        activo: profesor.activo ?? true,
        avatar_url: profile?.avatar_url || null,
        created_at: profesor.created_at
      },
      asignaciones: asignacionesConEstadisticas,
      estadisticas_generales: {
        total_materias: totalMaterias,
        total_grupos: totalGrupos,
        total_estudiantes: totalEstudiantes,
        horas_semanales_totales: horasSemanales,
        clases_programadas_mes: clasesProgramadasMes || 0,
        clases_completadas_total: clasesCompletadasTotal || 0,
        promedio_rendimiento: 0 // Placeholder para futura implementación
      }
    };

    console.log('Perfil del profesor obtenido exitosamente');

    return new Response(
      JSON.stringify(resultado),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en get-perfil-profesor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

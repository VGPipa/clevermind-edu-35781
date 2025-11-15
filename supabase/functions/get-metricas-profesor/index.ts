import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, false);

    // Get asignaciones to know which grupos and materias to analyze
    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        id_materia,
        id_grupo,
        materias (
          id,
          nombre
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
      throw asignacionesError;
    }

    if (!asignaciones || asignaciones.length === 0) {
      return createSuccessResponse({
        estadisticas: {
          promedioGeneral: 0,
          alumnosTotal: 0,
          quizzesCompletados: 0,
          tasaAprobacion: 0,
        },
        cursos: [],
        temasDesafiantes: [],
        alumnosDestacados: [],
        alumnosAtencion: [],
      });
    }

    // Get all clases for this profesor
    const { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select('id, id_grupo, id_tema, temas!inner(id, id_materia)')
      .eq('id_profesor', profesor.id);

    if (clasesError) {
      console.error('Error obteniendo clases:', clasesError);
    }

    const claseIds = clases?.map(c => c.id) || [];

    // Get all quizzes for these clases
    const { data: quizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, id_clase, tipo, estado')
      .in('id_clase', claseIds.length > 0 ? claseIds : ['00000000-0000-0000-0000-000000000000']);

    if (quizzesError) {
      console.error('Error obteniendo quizzes:', quizzesError);
    }

    const quizIds = quizzes?.map(q => q.id) || [];
    const quizzesCompletados = quizzes?.filter(q => q.estado === 'publicado' || q.estado === 'cerrado').length || 0;

    // Get all respuestas_alumno (completed responses)
    const { data: respuestas, error: respuestasError } = await supabase
      .from('respuestas_alumno')
      .select('id, id_quiz, id_alumno, estado, fecha_envio')
      .in('id_quiz', quizIds.length > 0 ? quizIds : ['00000000-0000-0000-0000-000000000000'])
      .eq('estado', 'completado');

    if (respuestasError) {
      console.error('Error obteniendo respuestas:', respuestasError);
    }

    const respuestaIds = respuestas?.map(r => r.id) || [];

    // Get all calificaciones
    const { data: calificaciones, error: calificacionesError } = await supabase
      .from('calificaciones')
      .select('id, id_respuesta_alumno, nota_numerica, porcentaje_aciertos')
      .in('id_respuesta_alumno', respuestaIds.length > 0 ? respuestaIds : ['00000000-0000-0000-0000-000000000000']);

    if (calificacionesError) {
      console.error('Error obteniendo calificaciones:', calificacionesError);
    }

    // Calculate general statistics
    const notas = calificaciones?.map(c => Number(c.nota_numerica || 0)).filter(n => n > 0) || [];
    const promedioGeneral = notas.length > 0
      ? notas.reduce((sum, n) => sum + n, 0) / notas.length
      : 0;

    const aprobados = calificaciones?.filter(c => Number(c.nota_numerica || 0) >= 6.0).length || 0;
    const tasaAprobacion = calificaciones && calificaciones.length > 0
      ? Math.round((aprobados / calificaciones.length) * 100)
      : 0;

    // Get unique students count
    const alumnosUnicos = new Set(respuestas?.map(r => r.id_alumno) || []);
    const alumnosTotal = alumnosUnicos.size;

    // Get quizzes completed this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const quizzesCompletadosMes = respuestas?.filter(r => {
      if (!r.fecha_envio) return false;
      const fecha = new Date(r.fecha_envio);
      return fecha >= startOfMonth;
    }).length || 0;

    // Calculate per-course statistics
    const cursosConEstadisticas = await Promise.all(
      (asignaciones || []).map(async (asignacion: any) => {
        if (!asignacion.materias || !asignacion.grupos) return null;

        // Get clases for this asignacion
        const clasesAsignacion = clases?.filter(c => {
          const tema = Array.isArray(c.temas) ? c.temas[0] : c.temas;
          return c.id_grupo === asignacion.id_grupo && tema?.id_materia === asignacion.id_materia;
        }) || [];

        const clasesIds = clasesAsignacion.map(c => c.id);

        // Get quizzes for these clases
        const quizzesAsignacion = quizzes?.filter(q => clasesIds.includes(q.id_clase)) || [];
        const quizzesIds = quizzesAsignacion.map(q => q.id);

        // Get respuestas for these quizzes
        const respuestasAsignacion = respuestas?.filter(r => quizzesIds.includes(r.id_quiz)) || [];
        const respuestasIds = respuestasAsignacion.map(r => r.id);

        // Get calificaciones
        const calificacionesAsignacion = calificaciones?.filter(c => 
          respuestasIds.includes(c.id_respuesta_alumno)
        ) || [];

        const notasCurso = calificacionesAsignacion.map(c => Number(c.nota_numerica || 0)).filter(n => n > 0);
        const promedio = notasCurso.length > 0
          ? notasCurso.reduce((sum, n) => sum + n, 0) / notasCurso.length
          : 0;

        // Calculate trend (simplified - compare last month vs this month)
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const respuestasEsteMes = respuestasAsignacion.filter(r => {
          if (!r.fecha_envio) return false;
          const fecha = new Date(r.fecha_envio);
          return fecha >= startOfMonth;
        });

        const respuestasMesAnterior = respuestasAsignacion.filter(r => {
          if (!r.fecha_envio) return false;
          const fecha = new Date(r.fecha_envio);
          return fecha >= lastMonth && fecha <= lastMonthEnd;
        });

        const promedioEsteMes = respuestasEsteMes.length > 0
          ? respuestasEsteMes.reduce((sum, r) => {
              const cal = calificacionesAsignacion.find(c => respuestasIds.includes(c.id_respuesta_alumno));
              return sum + Number(cal?.nota_numerica || 0);
            }, 0) / respuestasEsteMes.length
          : 0;

        const promedioMesAnterior = respuestasMesAnterior.length > 0
          ? respuestasMesAnterior.reduce((sum, r) => {
              const cal = calificacionesAsignacion.find(c => respuestasIds.includes(c.id_respuesta_alumno));
              return sum + Number(cal?.nota_numerica || 0);
            }, 0) / respuestasMesAnterior.length
          : 0;

        const tendencia = promedioEsteMes > promedioMesAnterior ? 'up' : 'stable';

        return {
          nombre: `${asignacion.materias.nombre} ${asignacion.grupos.grado}${asignacion.grupos.seccion}`,
          alumnos: asignacion.grupos.cantidad_alumnos || 0,
          promedio: Number(promedio.toFixed(1)),
          tendencia,
          quizzes: quizzesAsignacion.length,
          asistencia: 0, // Placeholder - would need asistencia table
        };
      })
    );

    const cursos = cursosConEstadisticas.filter(c => c !== null);

    // Get challenging topics (topics with lowest averages)
    const temasConPromedios = await Promise.all(
      (clases || []).map(async (clase: any) => {
        const { data: tema } = await supabase
          .from('temas')
          .select('id, nombre, id_materia')
          .eq('id', clase.id_tema)
          .single();

        if (!tema) return null;

        const { data: materia } = await supabase
          .from('materias')
          .select('nombre')
          .eq('id', tema.id_materia)
          .single();

        const { data: grupo } = await supabase
          .from('grupos')
          .select('grado, seccion')
          .eq('id', clase.id_grupo)
          .single();

        const quizzesTema = quizzes?.filter(q => q.id_clase === clase.id) || [];
        const quizzesIds = quizzesTema.map(q => q.id);
        const respuestasTema = respuestas?.filter(r => quizzesIds.includes(r.id_quiz)) || [];
        const respuestasIds = respuestasTema.map(r => r.id);
        const calificacionesTema = calificaciones?.filter(c => respuestasIds.includes(c.id_respuesta_alumno)) || [];

        const notasTema = calificacionesTema.map(c => Number(c.nota_numerica || 0)).filter(n => n > 0);
        const promedioTema = notasTema.length > 0
          ? notasTema.reduce((sum, n) => sum + n, 0) / notasTema.length
          : 0;

        return {
          tema: tema.nombre,
          curso: `${materia?.nombre || 'Sin materia'} ${grupo?.grado || ''}${grupo?.seccion || ''}`,
          promedio: Number(promedioTema.toFixed(1)),
          intentos: respuestasTema.length,
          dificultad: promedioTema < 6.0 ? 'alta' : promedioTema < 7.0 ? 'media' : 'baja',
        };
      })
    );

    const temasDesafiantes = temasConPromedios
      .filter(t => t !== null && t.promedio > 0)
      .sort((a: any, b: any) => (a?.promedio || 0) - (b?.promedio || 0))
      .slice(0, 5);

    // Get outstanding students (top performers)
    const alumnosConPromedios = new Map<string, { nombre: string; curso: string; notas: number[]; racha: number }>();

    for (const respuesta of respuestas || []) {
      const calificacion = calificaciones?.find(c => c.id_respuesta_alumno === respuesta.id);
      if (!calificacion) continue;

      const nota = Number(calificacion.nota_numerica || 0);
      if (nota === 0) continue;

      // Get alumno info
      const { data: alumno } = await supabase
        .from('alumnos')
        .select('id, profiles!inner(nombre, apellido)')
        .eq('id', respuesta.id_alumno)
        .single();

      if (!alumno) continue;

      // Get curso info
      const clase = clases?.find(c => {
        const quiz = quizzes?.find(q => q.id === respuesta.id_quiz);
        return quiz && quiz.id_clase === c.id;
      });

      if (!clase) continue;

      const asignacion = asignaciones?.find(a => a.id_grupo === clase.id_grupo);
      const materia = Array.isArray(asignacion?.materias) ? asignacion.materias[0] : asignacion?.materias;
      const grupo = Array.isArray(asignacion?.grupos) ? asignacion.grupos[0] : asignacion?.grupos;
      const cursoNombre = asignacion
        ? `${materia?.nombre || ''} ${grupo?.grado || ''}${grupo?.seccion || ''}`
        : 'Sin curso';

      const key = respuesta.id_alumno;
      const profile = Array.isArray(alumno.profiles) ? alumno.profiles[0] : alumno.profiles;
      if (!alumnosConPromedios.has(key)) {
        alumnosConPromedios.set(key, {
          nombre: `${profile?.nombre || ''} ${profile?.apellido || ''}`.trim(),
          curso: cursoNombre,
          notas: [],
          racha: 0,
        });
      }

      const alumnoData = alumnosConPromedios.get(key)!;
      alumnoData.notas.push(nota);
      if (nota >= 7.0) {
        alumnoData.racha += 1;
      } else {
        alumnoData.racha = 0;
      }
    }

    const alumnosDestacados = Array.from(alumnosConPromedios.values())
      .map(a => ({
        nombre: a.nombre,
        curso: a.curso,
        promedio: a.notas.length > 0
          ? Number((a.notas.reduce((sum, n) => sum + n, 0) / a.notas.length).toFixed(1))
          : 0,
        racha: a.racha,
      }))
      .filter(a => a.promedio >= 7.0)
      .sort((a, b) => b.promedio - a.promedio)
      .slice(0, 5);

    // Get students needing attention (low performers or with pending quizzes)
    const alumnosAtencion = Array.from(alumnosConPromedios.values())
      .map(a => {
        const promedio = a.notas.length > 0
          ? a.notas.reduce((sum, n) => sum + n, 0) / a.notas.length
          : 0;

        // Count pending quizzes for this student
        const quizzesPendientes = quizzes?.filter(q => {
          const respuesta = respuestas?.find(r => 
            r.id_alumno === Array.from(alumnosConPromedios.keys()).find(k => 
              alumnosConPromedios.get(k) === a
            ) && r.id_quiz === q.id
          );
          return !respuesta && q.estado === 'publicado';
        }).length || 0;

        return {
          nombre: a.nombre,
          curso: a.curso,
          promedio: Number(promedio.toFixed(1)),
          quizzesPendientes,
        };
      })
      .filter(a => a.promedio < 6.5 || a.quizzesPendientes > 0)
      .sort((a, b) => a.promedio - b.promedio)
      .slice(0, 5);

    return createSuccessResponse({
      estadisticas: {
        promedioGeneral: Number(promedioGeneral.toFixed(1)),
        alumnosTotal,
        quizzesCompletados: quizzesCompletadosMes,
        tasaAprobacion,
      },
      cursos,
      temasDesafiantes,
      alumnosDestacados,
      alumnosAtencion,
    });

  } catch (error) {
    console.error('Error en get-metricas-profesor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});


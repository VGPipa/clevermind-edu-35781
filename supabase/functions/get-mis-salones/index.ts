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

    // Get asignaciones del profesor
    const anioActual = new Date().getFullYear().toString();
    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        anio_escolar,
        id_materia,
        id_grupo,
        grupos (
          id,
          nombre,
          grado,
          seccion,
          cantidad_alumnos
        ),
        materias (
          id,
          nombre
        )
      `)
      .eq('id_profesor', profesor.id)
      .eq('anio_escolar', anioActual);

    if (asignacionesError) {
      console.error('Error obteniendo asignaciones:', asignacionesError);
      throw asignacionesError;
    }

    if (!asignaciones || asignaciones.length === 0) {
      return createSuccessResponse({ salones: [] });
    }

    // Group by salón (grupo)
    const gruposUnicos = new Map<string, any>();
    asignaciones.forEach((asignacion: any) => {
      if (asignacion.grupos && !gruposUnicos.has(asignacion.id_grupo)) {
        gruposUnicos.set(asignacion.id_grupo, {
          grupo: asignacion.grupos,
          asignaciones: [],
        });
      }
      if (asignacion.grupos) {
        gruposUnicos.get(asignacion.id_grupo)?.asignaciones.push(asignacion);
      }
    });

    // For each salón, get temas with guía maestra that have at least one sesión
    const salonesConTemas = await Promise.all(
      Array.from(gruposUnicos.values()).map(async ({ grupo, asignaciones: grupoAsignaciones }) => {
        // Get all temas from materias assigned to this grupo
        const materiaIds = grupoAsignaciones.map((a: any) => a.id_materia).filter(Boolean);
        
        if (materiaIds.length === 0) {
          return {
            grupo,
            temas: [],
            progreso_general: { porcentaje: 0, total_sesiones: 0, completadas: 0, programadas: 0, pendientes: 0 },
            resumen: {
              promedio_nota: null,
              comprension_promedio: null,
              participacion_promedio: null,
              completitud_promedio: null,
              alumnos_en_riesgo: 0,
              quizzes_pendientes: 0,
              promedio_quiz_pre: null,
              promedio_quiz_post: null,
            },
            alumnos: [],
            recomendaciones: [],
          };
        }

        const { data: temas } = await supabase
          .from('temas')
          .select('id, nombre, id_materia')
          .in('id_materia', materiaIds);

        if (!temas || temas.length === 0) {
          return {
            grupo,
            temas: [],
            progreso_general: { porcentaje: 0, total_sesiones: 0, completadas: 0, programadas: 0, pendientes: 0 },
            resumen: {
              promedio_nota: null,
              comprension_promedio: null,
              participacion_promedio: null,
              completitud_promedio: null,
              alumnos_en_riesgo: 0,
              quizzes_pendientes: 0,
              promedio_quiz_pre: null,
              promedio_quiz_post: null,
            },
            alumnos: [],
            recomendaciones: [],
          };
        }

        const temaIds = temas.map(t => t.id);

        // Get guías maestras for these temas
        const { data: guiasTema } = await supabase
          .from('guias_tema')
          .select('id, id_tema, total_sesiones')
          .eq('id_profesor', profesor.id)
          .in('id_tema', temaIds.length > 0 ? temaIds : ['00000000-0000-0000-0000-000000000000']);

        const temasConGuia = new Set(guiasTema?.map(g => g.id_tema) || []);

        // Get clases (sesiones) for temas with guía, filtered by grupo
        const { data: clases } = await supabase
          .from('clases')
          .select(`
            id,
            id_tema,
            id_guia_tema,
            id_guia_version_actual,
            numero_sesion,
            fecha_programada,
            fecha_ejecutada,
            estado,
            duracion_minutos,
            temas (
              id,
              nombre,
              id_materia,
              materias (
                id,
                nombre
              )
            ),
            quizzes (
              id,
              tipo,
              estado,
              created_at,
              fecha_envio,
              respuestas_alumno (
                id,
                id_alumno,
                estado,
                fecha_envio,
                calificaciones (
                  nota_numerica,
                  porcentaje_aciertos
                )
              )
            )
          `)
          .eq('id_profesor', profesor.id)
          .eq('id_grupo', grupo.id)
          .in('id_tema', Array.from(temasConGuia));

        // Group clases by tema and filter: only temas with at least one sesión
        const temasConSesiones = new Map<string, any[]>();
        (clases || []).forEach((claseOriginal: any) => {
          const clase = {
            ...claseOriginal,
            tiene_guia: Boolean(claseOriginal.id_guia_version_actual),
          };
          if (clase.id_tema) {
            if (!temasConSesiones.has(clase.id_tema)) {
              temasConSesiones.set(clase.id_tema, []);
            }
            temasConSesiones.get(clase.id_tema)!.push(clase);
          }
        });

        // Build temas with sesiones
        const temasData = Array.from(temasConSesiones.entries()).map(([temaId, sesiones]) => {
          const tema = temas.find(t => t.id === temaId);
          const guiaTema = guiasTema?.find(g => g.id_tema === temaId);
          const primeraSesion = sesiones[0];
          const materia = primeraSesion?.temas?.materias;

          const completadas = sesiones.filter(s => s.estado === 'completada' || s.estado === 'ejecutada').length;
          const programadas = sesiones.filter(s => s.fecha_programada && s.estado !== 'completada' && s.estado !== 'ejecutada').length;
          const totalSesiones = guiaTema?.total_sesiones || 0;
          const pendientes = totalSesiones - sesiones.length;

          return {
            tema: {
              id: tema?.id || temaId,
              nombre: tema?.nombre || 'Sin nombre',
              materia: {
                id: materia?.id,
                nombre: materia?.nombre,
              },
            },
            guia_tema: {
              id: guiaTema?.id,
              total_sesiones: totalSesiones,
            },
            sesiones: sesiones.sort((a, b) => (a.numero_sesion || 0) - (b.numero_sesion || 0)),
            progreso: {
              completadas,
              programadas,
              pendientes,
              total: sesiones.length,
              porcentaje: totalSesiones > 0 
                ? Math.round((completadas / totalSesiones) * 100)
                : 0,
            },
          };
        });

        const { data: alumnosGrupo, error: alumnosGrupoError } = await supabase
          .from('alumnos_grupo')
          .select(`
            id,
            alumnos (
              id,
              nombre,
              apellido,
              grado,
              seccion
            )
          `)
          .eq('id_grupo', grupo.id);

        if (alumnosGrupoError) {
          console.error('Error obteniendo alumnos del grupo:', alumnosGrupoError);
        }

        const alumnosSalon = (alumnosGrupo || [])
          .map((registro: any) => registro.alumnos)
          .filter(Boolean);

        const clasesConDatos = clases || [];
        const quizzesSalon = clasesConDatos.flatMap((clase: any) =>
          (clase.quizzes || []).map((quiz: any) => ({
            ...quiz,
            clase_metadata: {
              id: clase.id,
              numero_sesion: clase.numero_sesion,
              fecha_programada: clase.fecha_programada,
              estado: clase.estado,
            },
          }))
        );

        const respuestasSalon = quizzesSalon.flatMap((quiz: any) =>
          (quiz.respuestas_alumno || []).map((respuesta: any) => ({
            ...respuesta,
            quiz_id: quiz.id,
            quiz_tipo: quiz.tipo,
            calificacion: Array.isArray(respuesta.calificaciones)
              ? respuesta.calificaciones[0]
              : respuesta.calificaciones,
          }))
        );

        const notas = respuestasSalon
          .map(respuesta => respuesta.calificacion?.nota_numerica)
          .filter((nota): nota is number => typeof nota === 'number');

        const porcentajes = respuestasSalon
          .map(respuesta => respuesta.calificacion?.porcentaje_aciertos)
          .filter((valor): valor is number => typeof valor === 'number');

        const promedioNota = notas.length > 0
          ? notas.reduce((sum, nota) => sum + nota, 0) / notas.length
          : null;

        const promedioComprension = porcentajes.length > 0
          ? porcentajes.reduce((sum, valor) => sum + valor, 0) / porcentajes.length
          : null;

        const totalEsperadoRespuestas = alumnosSalon.length * quizzesSalon.length;
        const respuestasCompletadas = respuestasSalon.filter(r => r.estado === 'completado').length;
        const participacionPromedio = totalEsperadoRespuestas > 0
          ? (respuestasCompletadas / totalEsperadoRespuestas) * 100
          : null;

        // Debug logs
        console.log(`[get-mis-salones] Grupo ${grupo.id}:`, {
          alumnosCount: alumnosSalon.length,
          quizzesCount: quizzesSalon.length,
          respuestasCount: respuestasSalon.length,
          promedioNota,
          promedioComprension,
          participacionPromedio,
        });

        const quizzesPendientes = quizzesSalon.filter(quiz => {
          const completadasQuiz = (quiz.respuestas_alumno || []).filter((r: any) => r.estado === 'completado').length;
          return alumnosSalon.length > 0 ? completadasQuiz < alumnosSalon.length : false;
        }).length;

        const promedioQuizPre = (() => {
          const notasPre = respuestasSalon
            .filter(r => r.quiz_tipo === 'previo')
            .map(r => r.calificacion?.nota_numerica)
            .filter((nota): nota is number => typeof nota === 'number');
          if (!notasPre.length) return null;
          return notasPre.reduce((sum, nota) => sum + nota, 0) / notasPre.length;
        })();

        const promedioQuizPost = (() => {
          const notasPost = respuestasSalon
            .filter(r => r.quiz_tipo === 'post')
            .map(r => r.calificacion?.nota_numerica)
            .filter((nota): nota is number => typeof nota === 'number');
          if (!notasPost.length) return null;
          return notasPost.reduce((sum, nota) => sum + nota, 0) / notasPost.length;
        })();

        // Retroalimentaciones feature removed - table doesn't exist
        const retroPorAlumno = new Map<string, any>();

        const { data: recomendacionesData, error: recomendacionesError } = await supabase
          .from('recomendaciones')
          .select(`
            id,
            tipo,
            aplicada,
            contenido,
            created_at,
            clases!inner (
              id,
              numero_sesion,
              fecha_programada,
              estado,
              id_grupo,
              id_profesor
            )
          `)
          .eq('clases.id_grupo', grupo.id)
          .eq('clases.id_profesor', profesor.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (recomendacionesError) {
          console.error('Error obteniendo recomendaciones:', recomendacionesError);
        }

        const recomendacionesSalon = (recomendacionesData || []).map((recomendacion: any) => ({
          id: recomendacion.id,
          tipo: recomendacion.tipo,
          aplicada: recomendacion.aplicada,
          contenido: recomendacion.contenido,
          created_at: recomendacion.created_at,
          clase: recomendacion.clases
            ? {
                id: recomendacion.clases.id,
                numero_sesion: recomendacion.clases.numero_sesion,
                fecha_programada: recomendacion.clases.fecha_programada,
                estado: recomendacion.clases.estado,
              }
            : null,
        }));

        const alumnosStats = alumnosSalon.map((alumno: any) => {
          const respuestasAlumno = respuestasSalon.filter(r => r.id_alumno === alumno.id);
          const calificacionesAlumno = respuestasAlumno
            .map(r => r.calificacion?.nota_numerica)
            .filter((nota): nota is number => typeof nota === 'number');
          const aciertosAlumno = respuestasAlumno
            .map(r => r.calificacion?.porcentaje_aciertos)
            .filter((valor): valor is number => typeof valor === 'number');

          const promedioAlumno =
            calificacionesAlumno.length > 0
              ? calificacionesAlumno.reduce((sum, nota) => sum + nota, 0) / calificacionesAlumno.length
              : null;

          const promedioAciertos =
            aciertosAlumno.length > 0
              ? aciertosAlumno.reduce((sum, valor) => sum + valor, 0) / aciertosAlumno.length
              : null;

          const quizzesCompletados = respuestasAlumno.filter(r => r.estado === 'completado').length;
          const quizzesTotales = quizzesSalon.length;
          const quizzesPendientesAlumno = quizzesTotales > 0 ? Math.max(quizzesTotales - quizzesCompletados, 0) : 0;

          const alertas = {
            bajoRendimiento: promedioAlumno !== null ? promedioAlumno < 11 : false,
            pocaParticipacion: quizzesTotales > 0 ? quizzesCompletados / quizzesTotales < 0.5 : false,
          };

          const ultimaRetro = retroPorAlumno.get(alumno.id);

          return {
            id: alumno.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            grado: alumno.grado,
            seccion: alumno.seccion,
            promedio_nota: promedioAlumno,
            promedio_aciertos: promedioAciertos,
            quizzes_completados: quizzesCompletados,
            quizzes_pendientes: quizzesPendientesAlumno,
            alertas,
            ultima_retroalimentacion: ultimaRetro
              ? {
                  tipo: ultimaRetro.tipo,
                  resumen: ultimaRetro.contenido?.resumen || null,
                  fecha: ultimaRetro.fecha_envio || ultimaRetro.created_at,
                }
              : null,
          };
        });

        const alumnosEnRiesgo = alumnosStats.filter(
          alumno => alumno.alertas?.bajoRendimiento || alumno.alertas?.pocaParticipacion
        ).length;

        // Calculate overall progress for salón
        const totalSesionesSalon = temasData.reduce((sum, t) => sum + (t.guia_tema?.total_sesiones || 0), 0);
        const sesionesCompletadasSalon = temasData.reduce((sum, t) => sum + t.progreso.completadas, 0);
        const progresoGeneral = totalSesionesSalon > 0
          ? Math.round((sesionesCompletadasSalon / totalSesionesSalon) * 100)
          : 0;

        const resumenSalon = {
          promedio_nota: promedioNota,
          comprension_promedio: promedioComprension,
          participacion_promedio: participacionPromedio,
          completitud_promedio: participacionPromedio,
          alumnos_en_riesgo: alumnosEnRiesgo,
          quizzes_pendientes: quizzesPendientes,
          promedio_quiz_pre: promedioQuizPre,
          promedio_quiz_post: promedioQuizPost,
        };

        const salonData = {
          grupo,
          temas: temasData,
          progreso_general: {
            porcentaje: progresoGeneral,
            total_sesiones: totalSesionesSalon,
            completadas: sesionesCompletadasSalon,
            programadas: temasData.reduce((sum, t) => sum + t.progreso.programadas, 0),
            pendientes: temasData.reduce((sum, t) => sum + t.progreso.pendientes, 0),
          },
          resumen: resumenSalon,
          alumnos: alumnosStats,
          recomendaciones: recomendacionesSalon,
        };

        // Debug: verificar estructura completa
        console.log(`[get-mis-salones] Datos completos para grupo ${grupo.id}:`, {
          tieneResumen: !!salonData.resumen,
          tieneAlumnos: Array.isArray(salonData.alumnos),
          alumnosCount: salonData.alumnos.length,
          tieneRecomendaciones: Array.isArray(salonData.recomendaciones),
          recomendacionesCount: salonData.recomendaciones.length,
        });

        return salonData;
      })
    );

    return createSuccessResponse({
      salones: salonesConTemas,
      total_salones: salonesConTemas.length,
    });

  } catch (error) {
    console.error('Error en get-mis-salones:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});


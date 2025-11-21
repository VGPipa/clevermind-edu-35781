import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AlumnoResultado {
  id: string;
  nombre: string;
  apellido: string;
  grado?: string | null;
  seccion?: string | null;
  nota_quiz_pre?: number | null;
  nota_quiz_post?: number | null;
  porcentaje_aciertos_pre?: number | null;
  porcentaje_aciertos_post?: number | null;
  estado_quiz_pre?: string | null;
  estado_quiz_post?: string | null;
  tiempo_promedio?: number | null;
  alertas?: {
    bajoRendimiento?: boolean;
    noCompleto?: boolean;
    bajaParticipacion?: boolean;
  };
  ultima_retroalimentacion?: {
    tipo: string;
    resumen?: string;
    fecha?: string;
  } | null;
}

export interface ClaseConResultados {
  id: string;
  numero_sesion: number | null;
  fecha_programada: string | null;
  fecha_ejecutada: string | null;
  estado: string | null;
  tema: {
    id: string;
    nombre: string;
    materia: {
      id: string;
      nombre: string;
    };
  };
  grupo: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
  };
  quiz_pre?: {
    id: string;
    estado: string | null;
    fecha_limite: string | null;
  };
  quiz_post?: {
    id: string;
    estado: string | null;
    fecha_limite: string | null;
  };
  metricas?: {
    promedio_nota_post: number | null;
    tasa_participacion: number;
    tasa_completacion: number;
    nivel_comprension: number | null;
    promedio_quiz_pre: number | null;
    promedio_quiz_post: number | null;
    mejora_promedio: number | null;
    total_alumnos: number;
    alumnos_completaron: number;
  };
  resultados_alumnos: AlumnoResultado[];
  tiene_retroalimentaciones: boolean;
  tiene_recomendaciones: boolean;
}

export interface QuizConResultados {
  id: string;
  titulo: string;
  tipo: string;
  tipo_evaluacion: string | null;
  estado: string | null;
  fecha_disponible: string | null;
  fecha_limite: string | null;
  clase: {
    id: string;
    tema: {
      nombre: string;
      materia: {
        nombre: string;
      };
    };
    grupo: {
      nombre: string;
    };
  };
  estadisticas: {
    promedio: number | null;
    tasa_completacion: number;
    total_preguntas: number;
    preguntas_dificiles: Array<{
      id: string;
      texto: string;
      porcentaje_aciertos: number;
    }>;
  };
  resultados_alumnos: Array<{
    alumno_id: string;
    alumno_nombre: string;
    nota: number | null;
    porcentaje: number | null;
    estado: string | null;
  }>;
}

export interface AlumnoAtencion {
  id: string;
  nombre: string;
  apellido: string;
  grupo: {
    id: string;
    nombre: string;
  };
  materia: {
    id: string;
    nombre: string;
  };
  tipo_alerta: "bajo_rendimiento" | "quizzes_pendientes" | "baja_participacion";
  promedio_nota: number | null;
  quizzes_pendientes: number;
  tasa_participacion: number;
}

export interface MisClasesProfesorData {
  kpis: {
    total_clases: number;
    promedio_general: number | null;
    tasa_participacion_promedio: number;
    alumnos_en_riesgo: number;
    quizzes_pendientes_revisar: number;
  };
  clases: ClaseConResultados[];
  quizzes: QuizConResultados[];
  alumnos_atencion: AlumnoAtencion[];
}

export function useMisClasesProfesor() {
  return useQuery<MisClasesProfesorData>({
    queryKey: ["mis-clases-profesor"],
    queryFn: async () => {
      // 1. Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      // 2. Obtener registro del profesor
      const { data: profesor, error: profesorError } = await supabase
        .from("profesores")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (profesorError || !profesor) {
        throw new Error("Profesor no encontrado");
      }

      // 3. Obtener clases del profesor
      const { data: clases, error: clasesError } = await supabase
        .from("clases")
        .select(`
          id,
          numero_sesion,
          fecha_programada,
          fecha_ejecutada,
          estado,
          id_grupo,
          id_tema,
          temas!inner (
            id,
            nombre,
            materias!inner (
              id,
              nombre
            )
          ),
          grupos!inner (
            id,
            nombre,
            grado,
            seccion
          )
        `)
        .eq("id_profesor", profesor.id)
        .order("fecha_programada", { ascending: false, nullsFirst: false });

      if (clasesError) {
        console.error("Error obteniendo clases:", clasesError);
      }

      const claseIds = (clases || []).map((c: any) => c.id);

      // 4. Obtener quizzes de las clases
      const { data: quizzes, error: quizzesError } = await supabase
        .from("quizzes")
        .select(`
          id,
          titulo,
          tipo,
          tipo_evaluacion,
          estado,
          fecha_disponible,
          fecha_limite,
          id_clase,
          clases!inner (
            id,
            temas!inner (
              nombre,
              materias!inner (
                nombre
              )
            ),
            grupos!inner (
              nombre
            )
          )
        `)
        .in("id_clase", claseIds.length > 0 ? claseIds : ["00000000-0000-0000-0000-000000000000"]);

      if (quizzesError) {
        console.error("Error obteniendo quizzes:", quizzesError);
      }

      // 5. Obtener preguntas por quiz
      const quizIds = (quizzes || []).map((q: any) => q.id);
      const { data: preguntas, error: preguntasError } = await supabase
        .from("preguntas")
        .select("id, id_quiz, texto_pregunta")
        .in("id_quiz", quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]);

      if (preguntasError) {
        console.error("Error obteniendo preguntas:", preguntasError);
      }

      const preguntasPorQuiz = new Map<string, number>();
      (preguntas || []).forEach((p: any) => {
        preguntasPorQuiz.set(p.id_quiz, (preguntasPorQuiz.get(p.id_quiz) || 0) + 1);
      });

      // 6. Obtener respuestas de alumnos
      const { data: respuestas, error: respuestasError } = await supabase
        .from("respuestas_alumno")
        .select(`
          id,
          id_quiz,
          id_alumno,
          estado,
          fecha_envio,
          calificaciones (
            nota_numerica,
            porcentaje_aciertos
          )
        `)
        .in("id_quiz", quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]);

      if (respuestasError) {
        console.error("Error obteniendo respuestas:", respuestasError);
      }

      // 7. Obtener respuestas detalle para tiempo promedio
      const respuestaIds = (respuestas || []).map((r: any) => r.id);
      const { data: respuestasDetalle, error: detalleError } = await supabase
        .from("respuestas_detalle")
        .select("id_respuesta_alumno, tiempo_segundos")
        .in("id_respuesta_alumno", respuestaIds.length > 0 ? respuestaIds : ["00000000-0000-0000-0000-000000000000"]);

      if (detalleError) {
        console.error("Error obteniendo respuestas detalle:", detalleError);
      }

      // 8. Obtener alumnos de grupos del profesor
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from("asignaciones_profesor")
        .select("id_grupo")
        .eq("id_profesor", profesor.id);

      if (asignacionesError) {
        console.error("Error obteniendo asignaciones:", asignacionesError);
      }

      const grupoIds = (asignaciones || []).map((a: any) => a.id_grupo).filter(Boolean);
      const { data: alumnosGrupo, error: alumnosGrupoError } = await supabase
        .from("alumnos_grupo")
        .select(`
          id_alumno,
          id_grupo,
          alumnos!inner (
            id,
            nombre,
            apellido,
            grado,
            seccion
          )
        `)
        .in("id_grupo", grupoIds.length > 0 ? grupoIds : ["00000000-0000-0000-0000-000000000000"]);

      if (alumnosGrupoError) {
        console.error("Error obteniendo alumnos:", alumnosGrupoError);
      }

      // 9. Obtener resultados_clase para métricas agregadas
      const { data: resultadosClase, error: resultadosError } = await supabase
        .from("resultados_clase")
        .select("*")
        .in("id_clase", claseIds.length > 0 ? claseIds : ["00000000-0000-0000-0000-000000000000"]);

      if (resultadosError) {
        console.error("Error obteniendo resultados_clase:", resultadosError);
      }

      // 10. Obtener retroalimentaciones
      const { data: retroalimentaciones, error: retroError } = await supabase
        .from("retroalimentaciones")
        .select("id, id_clase, tipo, contenido, fecha_envio")
        .in("id_clase", claseIds.length > 0 ? claseIds : ["00000000-0000-0000-0000-000000000000"]);

      if (retroError) {
        console.error("Error obteniendo retroalimentaciones:", retroError);
      }

      // 11. Obtener recomendaciones
      const { data: recomendaciones, error: recError } = await supabase
        .from("recomendaciones")
        .select("id, id_clase")
        .in("id_clase", claseIds.length > 0 ? claseIds : ["00000000-0000-0000-0000-000000000000"]);

      if (recError) {
        console.error("Error obteniendo recomendaciones:", recError);
      }

      // 12. Procesar datos y calcular métricas
      const clasesConResultados: ClaseConResultados[] = (clases || []).map((clase: any) => {
        const tema = clase.temas;
        const materia = tema?.materias;
        const grupo = clase.grupos;

        const quizzesClase = (quizzes || []).filter((q: any) => q.id_clase === clase.id);
        const quizPre = quizzesClase.find((q: any) => q.tipo === "previo");
        const quizPost = quizzesClase.find((q: any) => q.tipo === "post");

        // Obtener alumnos del grupo
        const alumnosDelGrupo = (alumnosGrupo || [])
          .filter((ag: any) => ag.id_grupo === grupo?.id)
          .map((ag: any) => ag.alumnos)
          .filter(Boolean);

        // Procesar resultados por alumno
        const resultadosAlumnos: AlumnoResultado[] = alumnosDelGrupo.map((alumno: any) => {
          const respuestasAlumno = (respuestas || []).filter(
            (r: any) => r.id_alumno === alumno.id
          );

          const respuestaPre = respuestasAlumno.find((r: any) => r.id_quiz === quizPre?.id);
          const respuestaPost = respuestasAlumno.find((r: any) => r.id_quiz === quizPost?.id);

          const califPre = respuestaPre?.calificaciones;
          const califPost = respuestaPost?.calificaciones;
          const califPreData = Array.isArray(califPre) ? califPre[0] : califPre;
          const califPostData = Array.isArray(califPost) ? califPost[0] : califPost;

          // Calcular tiempo promedio
          const respuestasDetalleAlumno = (respuestasDetalle || []).filter(
            (rd: any) => rd.id_respuesta_alumno === respuestaPost?.id
          );
          const tiempos = respuestasDetalleAlumno
            .map((rd: any) => rd.tiempo_segundos)
            .filter((t): t is number => typeof t === "number");
          const tiempoPromedio =
            tiempos.length > 0 ? tiempos.reduce((sum, t) => sum + t, 0) / tiempos.length : null;

          // Obtener última retroalimentación
          const retroAlumno = (retroalimentaciones || []).find(
            (r: any) => r.id_clase === clase.id && r.id_alumno === alumno.id
          );

          const notaPost = califPostData?.nota_numerica;
          const promedio = notaPost !== null && notaPost !== undefined ? notaPost : null;

          return {
            id: alumno.id,
            nombre: alumno.nombre || "",
            apellido: alumno.apellido || "",
            grado: alumno.grado,
            seccion: alumno.seccion,
            nota_quiz_pre: califPreData?.nota_numerica || null,
            nota_quiz_post: notaPost,
            porcentaje_aciertos_pre: califPreData?.porcentaje_aciertos || null,
            porcentaje_aciertos_post: califPostData?.porcentaje_aciertos || null,
            estado_quiz_pre: respuestaPre?.estado || null,
            estado_quiz_post: respuestaPost?.estado || null,
            tiempo_promedio: tiempoPromedio,
            alertas: {
              bajoRendimiento: promedio !== null ? promedio < 11 : false,
              noCompleto: respuestaPost?.estado !== "completado",
              bajaParticipacion: false, // Se calculará después
            },
            ultima_retroalimentacion: retroAlumno
              ? {
                  tipo: retroAlumno.tipo,
                  resumen: retroAlumno.contenido?.resumen || null,
                  fecha: retroAlumno.fecha_envio || null,
                }
              : null,
          };
        });

        // Calcular métricas agregadas
        const resultadoClase = (resultadosClase || []).find((r: any) => r.id_clase === clase.id);
        const notasPost = resultadosAlumnos
          .map((a) => a.nota_quiz_post)
          .filter((n): n is number => typeof n === "number");
        const notasPre = resultadosAlumnos
          .map((a) => a.nota_quiz_pre)
          .filter((n): n is number => typeof n === "number");

        const promedioNotaPost =
          notasPost.length > 0 ? notasPost.reduce((sum, n) => sum + n, 0) / notasPost.length : null;
        const promedioNotaPre =
          notasPre.length > 0 ? notasPre.reduce((sum, n) => sum + n, 0) / notasPre.length : null;

        const totalAlumnos = alumnosDelGrupo.length;
        const alumnosCompletaron = resultadosAlumnos.filter(
          (a) => a.estado_quiz_post === "completado"
        ).length;

        return {
          id: clase.id,
          numero_sesion: clase.numero_sesion,
          fecha_programada: clase.fecha_programada,
          fecha_ejecutada: clase.fecha_ejecutada,
          estado: clase.estado,
          tema: {
            id: tema?.id,
            nombre: tema?.nombre,
            materia: {
              id: materia?.id,
              nombre: materia?.nombre,
            },
          },
          grupo: {
            id: grupo?.id,
            nombre: grupo?.nombre,
            grado: grupo?.grado,
            seccion: grupo?.seccion,
          },
          quiz_pre: quizPre
            ? {
                id: quizPre.id,
                estado: quizPre.estado,
                fecha_limite: quizPre.fecha_limite,
              }
            : undefined,
          quiz_post: quizPost
            ? {
                id: quizPost.id,
                estado: quizPost.estado,
                fecha_limite: quizPost.fecha_limite,
              }
            : undefined,
          metricas: {
            promedio_nota_post: promedioNotaPost,
            tasa_participacion:
              totalAlumnos > 0 ? (alumnosCompletaron / totalAlumnos) * 100 : 0,
            tasa_completacion: resultadoClase?.tasa_completacion || 0,
            nivel_comprension: resultadoClase?.nivel_comprension || null,
            promedio_quiz_pre: promedioNotaPre,
            promedio_quiz_post: promedioNotaPost,
            mejora_promedio:
              promedioNotaPre !== null && promedioNotaPost !== null
                ? promedioNotaPost - promedioNotaPre
                : null,
            total_alumnos: totalAlumnos,
            alumnos_completaron: alumnosCompletaron,
          },
          resultados_alumnos: resultadosAlumnos,
          tiene_retroalimentaciones: (retroalimentaciones || []).some(
            (r: any) => r.id_clase === clase.id
          ),
          tiene_recomendaciones: (recomendaciones || []).some((r: any) => r.id_clase === clase.id),
        };
      });

      // 13. Procesar quizzes con resultados
      const quizzesConResultados: QuizConResultados[] = (quizzes || []).map((quiz: any) => {
        const respuestasQuiz = (respuestas || []).filter((r: any) => r.id_quiz === quiz.id);
        const respuestasCompletadas = respuestasQuiz.filter((r: any) => r.estado === "completado");
        const calificaciones = respuestasCompletadas
          .map((r: any) => {
            const calif = r.calificaciones;
            return Array.isArray(calif) ? calif[0] : calif;
          })
          .filter(Boolean);

        const notas = calificaciones
          .map((c: any) => c.nota_numerica)
          .filter((n): n is number => typeof n === "number");
        const promedio = notas.length > 0 ? notas.reduce((sum, n) => sum + n, 0) / notas.length : null;

        // Obtener preguntas difíciles (necesitaríamos respuestas_detalle por pregunta)
        const preguntasDificiles: Array<{ id: string; texto: string; porcentaje_aciertos: number }> =
          [];

        const tema = quiz.clases?.temas;
        const materia = tema?.materias;
        const grupo = quiz.clases?.grupos;

        return {
          id: quiz.id,
          titulo: quiz.titulo,
          tipo: quiz.tipo,
          tipo_evaluacion: quiz.tipo_evaluacion,
          estado: quiz.estado,
          fecha_disponible: quiz.fecha_disponible,
          fecha_limite: quiz.fecha_limite,
          clase: {
            id: quiz.id_clase,
            tema: {
              nombre: tema?.nombre,
              materia: {
                nombre: materia?.nombre,
              },
            },
            grupo: {
              nombre: grupo?.nombre,
            },
          },
          estadisticas: {
            promedio,
            tasa_completacion:
              respuestasQuiz.length > 0
                ? (respuestasCompletadas.length / respuestasQuiz.length) * 100
                : 0,
            total_preguntas: preguntasPorQuiz.get(quiz.id) || 0,
            preguntas_dificiles: preguntasDificiles,
          },
          resultados_alumnos: respuestasCompletadas.map((r: any) => {
            const calif = r.calificaciones;
            const califData = Array.isArray(calif) ? calif[0] : calif;
            const alumno = (alumnosGrupo || [])
              .find((ag: any) => ag.id_alumno === r.id_alumno)
              ?.alumnos;

            return {
              alumno_id: r.id_alumno,
              alumno_nombre: alumno
                ? `${alumno.nombre || ""} ${alumno.apellido || ""}`.trim()
                : "Alumno desconocido",
              nota: califData?.nota_numerica || null,
              porcentaje: califData?.porcentaje_aciertos || null,
              estado: r.estado,
            };
          }),
        };
      });

      // 14. Identificar alumnos que necesitan atención
      const alumnosAtencionMap = new Map<string, AlumnoAtencion>();

      clasesConResultados.forEach((clase) => {
        clase.resultados_alumnos.forEach((alumno) => {
          const key = `${alumno.id}-${clase.tema.materia.id}`;
          if (!alumnosAtencionMap.has(key)) {
            alumnosAtencionMap.set(key, {
              id: alumno.id,
              nombre: alumno.nombre,
              apellido: alumno.apellido,
              grupo: {
                id: clase.grupo.id,
                nombre: clase.grupo.nombre,
              },
              materia: {
                id: clase.tema.materia.id,
                nombre: clase.tema.materia.nombre,
              },
              tipo_alerta: "bajo_rendimiento",
              promedio_nota: alumno.nota_quiz_post,
              quizzes_pendientes: alumno.estado_quiz_post !== "completado" ? 1 : 0,
              tasa_participacion: 0,
            });
          } else {
            const existing = alumnosAtencionMap.get(key)!;
            if (alumno.nota_quiz_post !== null) {
              existing.promedio_nota =
                existing.promedio_nota !== null
                  ? (existing.promedio_nota + alumno.nota_quiz_post) / 2
                  : alumno.nota_quiz_post;
            }
            if (alumno.estado_quiz_post !== "completado") {
              existing.quizzes_pendientes += 1;
            }
          }
        });
      });

      const alumnosAtencion = Array.from(alumnosAtencionMap.values()).filter(
        (a) =>
          (a.promedio_nota !== null && a.promedio_nota < 11) ||
          a.quizzes_pendientes > 0 ||
          a.tasa_participacion < 50
      );

      // 15. Calcular KPIs generales
      const todasLasNotas: number[] = [];
      clasesConResultados.forEach((clase) => {
        clase.resultados_alumnos.forEach((alumno) => {
          if (alumno.nota_quiz_post !== null) {
            todasLasNotas.push(alumno.nota_quiz_post);
          }
        });
      });

      const promedioGeneral =
        todasLasNotas.length > 0
          ? todasLasNotas.reduce((sum, n) => sum + n, 0) / todasLasNotas.length
          : null;

      const tasasParticipacion = clasesConResultados.map((c) => c.metricas?.tasa_participacion || 0);
      const tasaParticipacionPromedio =
        tasasParticipacion.length > 0
          ? tasasParticipacion.reduce((sum, t) => sum + t, 0) / tasasParticipacion.length
          : 0;

      const clasesProgramadas = clasesConResultados.filter(
        (c) => c.estado === "programada" || c.estado === "clase_programada"
      ).length;
      const clasesEjecutadas = clasesConResultados.filter(
        (c) => c.estado === "ejecutada" || c.estado === "completada"
      ).length;

      return {
        kpis: {
          total_clases: clasesProgramadas + clasesEjecutadas,
          promedio_general: promedioGeneral,
          tasa_participacion_promedio: Math.round(tasaParticipacionPromedio),
          alumnos_en_riesgo: alumnosAtencion.length,
          quizzes_pendientes_revisar: quizzesConResultados.filter(
            (q) => q.estado === "publicado" && q.estadisticas.tasa_completacion < 100
          ).length,
        },
        clases: clasesConResultados,
        quizzes: quizzesConResultados,
        alumnos_atencion: alumnosAtencion,
      };
    },
  });
}


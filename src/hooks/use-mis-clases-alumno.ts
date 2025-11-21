import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPeruTime } from "@/lib/timezone";

export interface MateriaData {
  id: string;
  nombre: string;
  profesor?: {
    id: string;
    nombre?: string;
    apellido?: string;
  };
  progreso: number;
  promedio_nota: number | null;
  proxima_clase?: {
    id: string;
    fecha_programada: string | null;
    tema: {
      nombre: string;
    };
  };
  quizzes_pendientes: number;
  total_sesiones: number;
  sesiones_completadas: number;
}

export interface ClaseData {
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
  };
  profesor?: {
    id: string;
    nombre?: string;
    apellido?: string;
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
  resultado_quiz_post?: {
    nota: number | null;
    porcentaje: number | null;
  };
  tiene_retroalimentaciones: boolean;
}

export interface QuizData {
  id: string;
  titulo: string;
  tipo: string;
  tipo_evaluacion: string | null;
  estado: string | null;
  fecha_disponible: string | null;
  fecha_limite: string | null;
  tiempo_limite: number | null;
  clase: {
    id: string;
    tema: {
      nombre: string;
      materia: {
        nombre: string;
      };
    };
  };
  respuesta_alumno?: {
    id: string;
    estado: string | null;
    fecha_envio: string | null;
    calificacion?: {
      nota_numerica: number | null;
      porcentaje_aciertos: number | null;
    };
  };
  preguntas_count?: number;
}

export interface ResultadoMateria {
  materia_id: string;
  materia_nombre: string;
  promedio_nota: number | null;
  quizzes_completados: number;
  ultima_calificacion: number | null;
  tendencia: "up" | "down" | "stable" | null;
}

export interface RetroalimentacionData {
  id: string;
  tipo: string;
  contenido: any;
  fecha_envio: string | null;
  created_at: string | null;
  clase?: {
    id: string;
    tema: {
      nombre: string;
    };
  };
}

export interface MisClasesData {
  kpis: {
    promedio_general: number | null;
    quizzes_completados: number;
    quizzes_pendientes: number;
    tasa_participacion: number;
    progreso_general: number;
  };
  materias: MateriaData[];
  clases: ClaseData[];
  quizzes: QuizData[];
  resultados: ResultadoMateria[];
  retroalimentaciones: RetroalimentacionData[];
}

export function useMisClasesAlumno() {
  return useQuery<MisClasesData>({
    queryKey: ["mis-clases-alumno"],
    queryFn: async () => {
      // 1. Obtener usuario autenticado
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuario no autenticado");
      }

      // 2. Obtener registro del alumno
      const { data: alumno, error: alumnoError } = await supabase
        .from("alumnos")
        .select("id, nombre, apellido, grado, seccion")
        .eq("user_id", user.id)
        .single();

      if (alumnoError || !alumno) {
        throw new Error("Alumno no encontrado");
      }

      // 3. Obtener año escolar activo (necesitamos la institución del alumno)
      // Primero obtenemos los grupos del alumno para saber la institución
      const { data: alumnosGrupo, error: agError } = await supabase
        .from("alumnos_grupo")
        .select(`
          id_grupo,
          grupos!inner (
            id,
            id_institucion
          )
        `)
        .eq("id_alumno", alumno.id)
        .limit(1);

      let anioEscolarActivo: string | null = null;
      if (alumnosGrupo && alumnosGrupo.length > 0) {
        const grupo = alumnosGrupo[0].grupos as any;
        if (grupo?.id_institucion) {
          const { data: anioActivo } = await supabase
            .from("anios_escolares")
            .select("anio_escolar")
            .eq("id_institucion", grupo.id_institucion)
            .eq("activo", true)
            .maybeSingle();
          
          if (anioActivo && anioActivo.anio_escolar) {
            anioEscolarActivo = anioActivo.anio_escolar;
          }
        }
      }

      // 4. Obtener grupos del alumno para el año escolar activo
      let gruposAlumno: any[] = [];
      if (anioEscolarActivo) {
        const { data: gruposData, error: gruposError } = await supabase
          .from("alumnos_grupo")
          .select(`
            id_grupo,
            grupos!inner (
              id,
              nombre,
              grado,
              seccion
            )
          `)
          .eq("id_alumno", alumno.id)
          .eq("anio_escolar", anioEscolarActivo);

        if (gruposError) {
          console.error("Error obteniendo grupos:", gruposError);
        } else {
          gruposAlumno = gruposData || [];
        }
      } else {
        // Si no hay año escolar activo, obtener todos los grupos del alumno
        const { data: gruposData, error: gruposError } = await supabase
          .from("alumnos_grupo")
          .select(`
            id_grupo,
            grupos!inner (
              id,
              nombre,
              grado,
              seccion
            )
          `)
          .eq("id_alumno", alumno.id);

        if (gruposError) {
          console.error("Error obteniendo grupos:", gruposError);
        } else {
          gruposAlumno = gruposData || [];
        }
      }

      const grupoIds = gruposAlumno.map((ag: any) => ag.grupos?.id).filter(Boolean) as string[];

      if (grupoIds.length === 0) {
        return {
          kpis: {
            promedio_general: null,
            quizzes_completados: 0,
            quizzes_pendientes: 0,
            tasa_participacion: 0,
            progreso_general: 0,
          },
          materias: [],
          clases: [],
          quizzes: [],
          resultados: [],
          retroalimentaciones: [],
        };
      }

      // 5. Obtener clases de los grupos del alumno
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
          id_profesor,
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
            nombre
          ),
          profesores (
            id,
            profiles (
              nombre,
              apellido
            )
          )
        `)
        .in("id_grupo", grupoIds)
        .order("fecha_programada", { ascending: true, nullsFirst: false });

      if (clasesError) {
        console.error("Error obteniendo clases:", clasesError);
      }

      // 6. Obtener quizzes de las clases
      const claseIds = (clases || []).map((c: any) => c.id);
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
          tiempo_limite,
          id_clase,
          clases!inner (
            id,
            temas!inner (
              nombre,
              materias!inner (
                nombre
              )
            )
          )
        `)
        .in("id_clase", claseIds.length > 0 ? claseIds : ["00000000-0000-0000-0000-000000000000"]);

      if (quizzesError) {
        console.error("Error obteniendo quizzes:", quizzesError);
      }

      // 7. Obtener respuestas del alumno
      const quizIds = (quizzes || []).map((q: any) => q.id);
      const { data: respuestas, error: respuestasError } = await supabase
        .from("respuestas_alumno")
        .select(`
          id,
          id_quiz,
          estado,
          fecha_envio,
          calificaciones (
            nota_numerica,
            porcentaje_aciertos
          )
        `)
        .eq("id_alumno", alumno.id)
        .in("id_quiz", quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]);

      if (respuestasError) {
        console.error("Error obteniendo respuestas:", respuestasError);
      }

      // 8. Obtener conteo de preguntas por quiz
      const { data: preguntasData, error: preguntasError } = await supabase
        .from("preguntas")
        .select("id_quiz")
        .in("id_quiz", quizIds.length > 0 ? quizIds : ["00000000-0000-0000-0000-000000000000"]);

      const preguntasPorQuiz = new Map<string, number>();
      (preguntasData || []).forEach((p: any) => {
        preguntasPorQuiz.set(p.id_quiz, (preguntasPorQuiz.get(p.id_quiz) || 0) + 1);
      });

      // 9. Obtener retroalimentaciones del alumno
      const { data: retroalimentaciones, error: retroError } = await supabase
        .from("retroalimentaciones")
        .select(`
          id,
          tipo,
          contenido,
          fecha_envio,
          created_at,
          clases (
            id,
            temas!inner (
              nombre
            )
          )
        `)
        .eq("id_alumno", alumno.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (retroError) {
        console.error("Error obteniendo retroalimentaciones:", retroError);
      }

      // 10. Procesar datos y calcular métricas
      const clasesData = (clases || []).map((clase: any) => {
        const tema = clase.temas;
        const materia = tema?.materias;
        const grupo = clase.grupos;
        const profesor = clase.profesores;
        const profile = Array.isArray(profesor?.profiles) ? profesor.profiles[0] : profesor?.profiles;

        const quizzesClase = (quizzes || []).filter((q: any) => q.id_clase === clase.id);
        const quizPre = quizzesClase.find((q: any) => q.tipo === "previo");
        const quizPost = quizzesClase.find((q: any) => q.tipo === "post");

        const respuestaPost = (respuestas || []).find(
          (r: any) => r.id_quiz === quizPost?.id && r.estado === "completado"
        );
        const calificacionPost = respuestaPost?.calificaciones;
        const calificacion = Array.isArray(calificacionPost) ? calificacionPost[0] : calificacionPost;

        const tieneRetro = (retroalimentaciones || []).some(
          (r: any) => r.clases?.id === clase.id
        );

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
          },
          profesor: profesor
            ? {
                id: profesor.id,
                nombre: profile?.nombre || null,
                apellido: profile?.apellido || null,
              }
            : undefined,
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
          resultado_quiz_post: calificacion
            ? {
                nota: calificacion.nota_numerica,
                porcentaje: calificacion.porcentaje_aciertos,
              }
            : undefined,
          tiene_retroalimentaciones: tieneRetro,
        } as ClaseData;
      });

      // 11. Procesar quizzes con respuestas del alumno
      const quizzesData = (quizzes || []).map((quiz: any) => {
        const respuesta = (respuestas || []).find((r: any) => r.id_quiz === quiz.id);
        const calificacion = respuesta?.calificaciones;
        const calif = Array.isArray(calificacion) ? calificacion[0] : calificacion;
        const tema = quiz.clases?.temas;
        const materia = tema?.materias;

        return {
          id: quiz.id,
          titulo: quiz.titulo,
          tipo: quiz.tipo,
          tipo_evaluacion: quiz.tipo_evaluacion,
          estado: quiz.estado,
          fecha_disponible: quiz.fecha_disponible,
          fecha_limite: quiz.fecha_limite,
          tiempo_limite: quiz.tiempo_limite,
          clase: {
            id: quiz.id_clase,
            tema: {
              nombre: tema?.nombre,
              materia: {
                nombre: materia?.nombre,
              },
            },
          },
          respuesta_alumno: respuesta
            ? {
                id: respuesta.id,
                estado: respuesta.estado,
                fecha_envio: respuesta.fecha_envio,
                calificacion: calif
                  ? {
                      nota_numerica: calif.nota_numerica,
                      porcentaje_aciertos: calif.porcentaje_aciertos,
                    }
                  : undefined,
              }
            : undefined,
          preguntas_count: preguntasPorQuiz.get(quiz.id) || 0,
        } as QuizData;
      });

      // 12. Agrupar por materia y calcular métricas
      const materiasMap = new Map<string, MateriaData>();
      const resultadosMap = new Map<string, ResultadoMateria>();

      clasesData.forEach((clase) => {
        const materiaId = clase.tema.materia.id;
        const materiaNombre = clase.tema.materia.nombre;

        if (!materiasMap.has(materiaId)) {
          materiasMap.set(materiaId, {
            id: materiaId,
            nombre: materiaNombre,
            progreso: 0,
            promedio_nota: null,
            quizzes_pendientes: 0,
            total_sesiones: 0,
            sesiones_completadas: 0,
          });
        }

        const materia = materiasMap.get(materiaId)!;
        materia.total_sesiones += 1;
        if (clase.estado === "completada" || clase.estado === "ejecutada") {
          materia.sesiones_completadas += 1;
        }

        // Asignar profesor de la primera clase
        if (!materia.profesor && clase.profesor) {
          materia.profesor = clase.profesor;
        }

        // Proxima clase
        if (!materia.proxima_clase && clase.fecha_programada) {
          const fechaProg = new Date(clase.fecha_programada);
          const ahora = new Date();
          if (fechaProg >= ahora) {
            materia.proxima_clase = {
              id: clase.id,
              fecha_programada: clase.fecha_programada,
              tema: {
                nombre: clase.tema.nombre,
              },
            };
          }
        }
      });

      // Calcular promedios y quizzes pendientes por materia
      const notasPorMateria = new Map<string, number[]>();
      const quizzesCompletadosPorMateria = new Map<string, number>();
      const quizzesPendientesPorMateria = new Map<string, number>();

      quizzesData.forEach((quiz) => {
        const materiaId = clasesData.find((c) => c.id === quiz.clase.id)?.tema.materia.id;
        if (!materiaId) return;

        if (quiz.respuesta_alumno?.calificacion?.nota_numerica) {
          const notas = notasPorMateria.get(materiaId) || [];
          notas.push(quiz.respuesta_alumno.calificacion.nota_numerica);
          notasPorMateria.set(materiaId, notas);

          const completados = quizzesCompletadosPorMateria.get(materiaId) || 0;
          quizzesCompletadosPorMateria.set(materiaId, completados + 1);
        } else if (quiz.estado === "publicado" || quiz.estado === "cerrado") {
          const pendientes = quizzesPendientesPorMateria.get(materiaId) || 0;
          quizzesPendientesPorMateria.set(materiaId, pendientes + 1);
        }
      });

      materiasMap.forEach((materia, materiaId) => {
        const notas = notasPorMateria.get(materiaId) || [];
        materia.promedio_nota =
          notas.length > 0 ? notas.reduce((sum, n) => sum + n, 0) / notas.length : null;
        materia.quizzes_pendientes = quizzesPendientesPorMateria.get(materiaId) || 0;
        materia.progreso =
          materia.total_sesiones > 0
            ? Math.round((materia.sesiones_completadas / materia.total_sesiones) * 100)
            : 0;

        // Resultados por materia
        const ultimaNota = notas.length > 0 ? notas[notas.length - 1] : null;
        const promedio = notas.length > 0 ? notas.reduce((sum, n) => sum + n, 0) / notas.length : null;
        let tendencia: "up" | "down" | "stable" | null = null;
        if (notas.length >= 2) {
          const primeraMitad = notas.slice(0, Math.floor(notas.length / 2));
          const segundaMitad = notas.slice(Math.floor(notas.length / 2));
          const promPrimera =
            primeraMitad.length > 0
              ? primeraMitad.reduce((sum, n) => sum + n, 0) / primeraMitad.length
              : 0;
          const promSegunda =
            segundaMitad.length > 0
              ? segundaMitad.reduce((sum, n) => sum + n, 0) / segundaMitad.length
              : 0;
          if (promSegunda > promPrimera + 0.5) tendencia = "up";
          else if (promSegunda < promPrimera - 0.5) tendencia = "down";
          else tendencia = "stable";
        }

        resultadosMap.set(materiaId, {
          materia_id: materiaId,
          materia_nombre: materia.nombre,
          promedio_nota: promedio,
          quizzes_completados: quizzesCompletadosPorMateria.get(materiaId) || 0,
          ultima_calificacion: ultimaNota,
          tendencia,
        });
      });

      // 13. Calcular KPIs generales
      const todasLasNotas: number[] = [];
      let quizzesCompletados = 0;
      let quizzesPendientes = 0;

      quizzesData.forEach((quiz) => {
        if (quiz.respuesta_alumno?.calificacion?.nota_numerica) {
          todasLasNotas.push(quiz.respuesta_alumno.calificacion.nota_numerica);
          quizzesCompletados += 1;
        } else if (quiz.estado === "publicado" || quiz.estado === "cerrado") {
          quizzesPendientes += 1;
        }
      });

      const promedioGeneral =
        todasLasNotas.length > 0
          ? todasLasNotas.reduce((sum, n) => sum + n, 0) / todasLasNotas.length
          : null;

      const totalQuizzes = quizzesData.length;
      const tasaParticipacion = totalQuizzes > 0 ? (quizzesCompletados / totalQuizzes) * 100 : 0;

      const totalSesiones = clasesData.length;
      const sesionesCompletadas = clasesData.filter(
        (c) => c.estado === "completada" || c.estado === "ejecutada"
      ).length;
      const progresoGeneral = totalSesiones > 0 ? (sesionesCompletadas / totalSesiones) * 100 : 0;

      // 14. Procesar retroalimentaciones
      const retroData = (retroalimentaciones || []).map((retro: any) => ({
        id: retro.id,
        tipo: retro.tipo,
        contenido: retro.contenido,
        fecha_envio: retro.fecha_envio,
        created_at: retro.created_at,
        clase: retro.clases
          ? {
              id: retro.clases.id,
              tema: {
                nombre: retro.clases.temas?.nombre,
              },
            }
          : undefined,
      })) as RetroalimentacionData[];

      return {
        kpis: {
          promedio_general: promedioGeneral,
          quizzes_completados: quizzesCompletados,
          quizzes_pendientes: quizzesPendientes,
          tasa_participacion: Math.round(tasaParticipacion),
          progreso_general: Math.round(progresoGeneral),
        },
        materias: Array.from(materiasMap.values()),
        clases: clasesData,
        quizzes: quizzesData,
        resultados: Array.from(resultadosMap.values()),
        retroalimentaciones: retroData,
      };
    },
  });
}


import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

// Helper functions para calcular niveles
function calcularNivelLogro(porcentaje: number): 'bajo' | 'intermedio' | 'alto' {
  if (porcentaje < 50) return 'bajo';
  if (porcentaje < 75) return 'intermedio';
  return 'alto';
}

function calcularSemaforo(porcentaje: number): 'verde' | 'amarillo' | 'rojo' {
  if (porcentaje >= 70) return 'verde';
  if (porcentaje >= 50) return 'amarillo';
  return 'rojo';
}

function clasificarPreparacion(porcentaje: number): 'baja' | 'media' | 'alta' {
  if (porcentaje < 40) return 'baja';
  if (porcentaje < 70) return 'media';
  return 'alta';
}

// Función para identificar conceptos de preguntas usando IA
async function identificarConceptosPreguntas(
  supabase: any,
  preguntas: Array<{ id: string; texto_pregunta: string; texto_contexto?: string | null }>
): Promise<Map<string, string>> {
  if (preguntas.length === 0) return new Map();

  try {
    const { data, error } = await supabase.functions.invoke('identificar-conceptos-preguntas', {
      body: { preguntas },
    });

    if (error || !data?.conceptos) {
      console.warn('Error identificando conceptos, usando fallback:', error);
      // Fallback: usar tema como concepto
      return new Map();
    }

    const conceptosMap = new Map<string, string>();
    for (const item of data.conceptos) {
      if (item.id_pregunta && item.concepto) {
        conceptosMap.set(item.id_pregunta, item.concepto.trim());
      }
    }

    return conceptosMap;
  } catch (error) {
    console.error('Error llamando identificar-conceptos-preguntas:', error);
    return new Map();
  }
}

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
      return createSuccessResponse({ salones: [], total_salones: 0 });
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

    // Process each salón
    const salonesConMetricas = await Promise.all(
      Array.from(gruposUnicos.values()).map(async ({ grupo, asignaciones: grupoAsignaciones }) => {
        const materiaIds = grupoAsignaciones.map((a: any) => a.id_materia).filter(Boolean);
        
        if (materiaIds.length === 0) {
          return crearSalonVacio(grupo);
        }

        // Get temas
        const { data: temas } = await supabase
          .from('temas')
          .select('id, nombre, id_materia')
          .in('id_materia', materiaIds);

        if (!temas || temas.length === 0) {
          return crearSalonVacio(grupo);
        }

        // Get materias for filtros
        const materiasUnicas = new Map<string, any>();
        grupoAsignaciones.forEach((a: any) => {
          if (a.materias) {
            materiasUnicas.set(a.id_materia, a.materias);
          }
        });

        // Get clases with quizzes
        const { data: clases } = await supabase
          .from('clases')
          .select(`
            id,
            id_tema,
            numero_sesion,
            fecha_programada,
            estado,
            temas!inner (
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
              tipo_evaluacion,
              estado,
              preguntas (
                id,
                texto_pregunta,
                texto_contexto
              ),
              respuestas_alumno (
                id,
                id_alumno,
                estado,
                fecha_envio,
                calificaciones (
                  nota_numerica,
                  porcentaje_aciertos
                ),
                respuestas_detalle (
                  id_pregunta,
                  es_correcta
                )
              )
            )
          `)
          .eq('id_profesor', profesor.id)
          .eq('id_grupo', grupo.id)
          .in('id_tema', temas.map(t => t.id));

        // Get alumnos del grupo
        const { data: alumnosGrupo } = await supabase
          .from('alumnos_grupo')
          .select(`
            id,
            alumnos (
              id,
              nombre,
              apellido
            )
          `)
          .eq('id_grupo', grupo.id);

        const alumnosSalon = (alumnosGrupo || [])
          .map((r: any) => r.alumnos)
          .filter(Boolean);

        // Build filtros
        const filtros = {
          materias: Array.from(materiasUnicas.values()).map((m: any) => ({
            id: m.id,
            nombre: m.nombre,
          })),
          temas: temas.map((t: any) => ({
            id: t.id,
            nombre: t.nombre,
            id_materia: t.id_materia,
          })),
          clases: (clases || []).map((c: any) => ({
            id: c.id,
            numero_sesion: c.numero_sesion,
            fecha_programada: c.fecha_programada,
            id_tema: c.id_tema,
          })),
        };

        // Process quizzes PRE and POST
        const quizzesPre: any[] = [];
        const quizzesPost: any[] = [];
        
        (clases || []).forEach((clase: any) => {
          (clase.quizzes || []).forEach((quiz: any) => {
            // Usar 'tipo' que tiene valores 'previo'/'post', no 'tipo_evaluacion'
            const tipoQuiz = quiz.tipo?.toLowerCase();
            if (tipoQuiz === 'previo' || tipoQuiz === 'pre') {
              quizzesPre.push({ ...quiz, id_clase: clase.id, clase_metadata: clase });
            } else if (tipoQuiz === 'post') {
              quizzesPost.push({ ...quiz, id_clase: clase.id, clase_metadata: clase });
            }
          });
        });

        // Identificar conceptos para PRE y POST
        const todasLasPreguntas = [
          ...quizzesPre.flatMap((q: any) => (q.preguntas || []).map((p: any) => ({ ...p, quiz_tipo: 'pre' }))),
          ...quizzesPost.flatMap((q: any) => (q.preguntas || []).map((p: any) => ({ ...p, quiz_tipo: 'post' }))),
        ];

        const conceptosMap = await identificarConceptosPreguntas(
          supabase,
          todasLasPreguntas.map((p: any) => ({
            id: p.id,
            texto_pregunta: p.texto_pregunta,
            texto_contexto: p.texto_contexto,
          }))
        );

        // Calcular métricas globales (año escolar completo)
        const metricasGlobales = calcularMetricasGlobales(
          [...quizzesPre, ...quizzesPost],
          alumnosSalon,
          conceptosMap
        );

        // Calcular datos PRE
        const datosPre = calcularDatosPre(quizzesPre, alumnosSalon, conceptosMap);

        // Calcular datos POST
        const datosPost = calcularDatosPost(quizzesPost, alumnosSalon, conceptosMap);

        // Generar recomendaciones
        const recomendaciones = generarRecomendaciones(datosPre, datosPost, conceptosMap);

        return {
          grupo: {
            id: grupo.id,
            nombre: grupo.nombre,
            grado: grupo.grado,
            seccion: grupo.seccion,
            cantidad_alumnos: grupo.cantidad_alumnos || alumnosSalon.length,
          },
          metricas_globales: metricasGlobales,
          filtros: filtros,
          datos_pre: datosPre,
          datos_post: datosPost,
          recomendaciones: recomendaciones,
        };
      })
    );

    return createSuccessResponse({
      salones: salonesConMetricas,
      total_salones: salonesConMetricas.length,
    });

  } catch (error) {
    console.error('Error en get-mis-salones:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});

function crearSalonVacio(grupo: any) {
  return {
    grupo: {
      id: grupo.id,
      nombre: grupo.nombre,
      grado: grupo.grado,
      seccion: grupo.seccion,
      cantidad_alumnos: grupo.cantidad_alumnos || 0,
    },
    metricas_globales: {
      participacion_promedio: 0,
      dominio_por_conceptos: [],
      areas_fuertes: [],
      areas_dificultad: [],
      alumnos_riesgo: { cantidad: 0, porcentaje: 0 },
    },
    filtros: {
      materias: [],
      temas: [],
      clases: [],
    },
    datos_pre: null,
    datos_post: null,
    recomendaciones: { pre: [], post: [] },
  };
}

function calcularMetricasGlobales(
  todosLosQuizzes: any[],
  alumnosSalon: any[],
  conceptosMap: Map<string, string>
) {
  if (todosLosQuizzes.length === 0 || alumnosSalon.length === 0) {
    return {
      participacion_promedio: 0,
      dominio_por_conceptos: [],
      areas_fuertes: [],
      areas_dificultad: [],
      alumnos_riesgo: { cantidad: 0, porcentaje: 0 },
    };
  }

  // Calcular participación promedio
  const totalEsperadoRespuestas = alumnosSalon.length * todosLosQuizzes.length;
  const respuestasCompletadas = todosLosQuizzes.reduce((sum, quiz) => {
    return sum + (quiz.respuestas_alumno || []).filter((r: any) => r.estado === 'completado').length;
  }, 0);
  const participacionPromedio = totalEsperadoRespuestas > 0
    ? Math.round((respuestasCompletadas / totalEsperadoRespuestas) * 100)
    : 0;

  // Calcular dominio por conceptos (solo POST)
  const quizzesPost = todosLosQuizzes.filter((q: any) => {
    const tipoQuiz = q.tipo?.toLowerCase();
    return tipoQuiz === 'post';
  });
  const dominioPorConceptos = calcularDominioPorConceptos(quizzesPost, conceptosMap);

  // Áreas fuertes y débiles
  const conceptosOrdenados = [...dominioPorConceptos].sort((a, b) => b.porcentaje_logro - a.porcentaje_logro);
  const areasFuertes = conceptosOrdenados.slice(0, 3).map(c => ({
    concepto: c.concepto,
    porcentaje: c.porcentaje_logro,
  }));
  const areasDificultad = conceptosOrdenados.slice(-3).reverse().map(c => ({
    concepto: c.concepto,
    porcentaje: c.porcentaje_logro,
  }));

  // Alumnos en riesgo (basado en POST)
  const alumnosEnRiesgo = calcularAlumnosEnRiesgo(quizzesPost, alumnosSalon);
  const porcentajeRiesgo = alumnosSalon.length > 0
    ? Math.round((alumnosEnRiesgo.length / alumnosSalon.length) * 100)
    : 0;

  return {
    participacion_promedio: participacionPromedio,
    dominio_por_conceptos: dominioPorConceptos,
    areas_fuertes: areasFuertes,
    areas_dificultad: areasDificultad,
    alumnos_riesgo: {
      cantidad: alumnosEnRiesgo.length,
      porcentaje: porcentajeRiesgo,
    },
  };
}

function calcularDominioPorConceptos(quizzes: any[], conceptosMap: Map<string, string>) {
  const conceptosStats = new Map<string, { correctas: number; total: number }>();

  quizzes.forEach((quiz: any) => {
    (quiz.preguntas || []).forEach((pregunta: any) => {
      const concepto = conceptosMap.get(pregunta.id) || 'Concepto no identificado';
      
      if (!conceptosStats.has(concepto)) {
        conceptosStats.set(concepto, { correctas: 0, total: 0 });
      }

      const stats = conceptosStats.get(concepto)!;
      
      // Contar respuestas correctas para esta pregunta
      (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
        if (respuesta.estado === 'completado') {
          const detalle = (respuesta.respuestas_detalle || []).find(
            (d: any) => d.id_pregunta === pregunta.id
          );
          if (detalle) {
            stats.total++;
            if (detalle.es_correcta) {
              stats.correctas++;
            }
          }
        }
      });
    });
  });

  const resultado: Array<{ concepto: string; porcentaje_logro: number; nivel_logro: string }> = [];
  
  conceptosStats.forEach((stats, concepto) => {
    if (stats.total > 0) {
      const porcentaje = Math.round((stats.correctas / stats.total) * 100);
      resultado.push({
        concepto,
        porcentaje_logro: porcentaje,
        nivel_logro: calcularNivelLogro(porcentaje),
      });
    }
  });

  return resultado;
}

function calcularAlumnosEnRiesgo(quizzes: any[], alumnosSalon: any[]): any[] {
  const alumnosStats = new Map<string, { porcentajes: number[] }>();

  alumnosSalon.forEach((alumno: any) => {
    alumnosStats.set(alumno.id, { porcentajes: [] });
  });

  quizzes.forEach((quiz: any) => {
    (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
      if (respuesta.estado === 'completado' && respuesta.calificaciones) {
        const calificacion = Array.isArray(respuesta.calificaciones)
          ? respuesta.calificaciones[0]
          : respuesta.calificaciones;
        
        if (calificacion?.porcentaje_aciertos !== null && calificacion?.porcentaje_aciertos !== undefined) {
          const stats = alumnosStats.get(respuesta.id_alumno);
          if (stats) {
            stats.porcentajes.push(Number(calificacion.porcentaje_aciertos));
          }
        }
      }
    });
  });

  const alumnosRiesgo: any[] = [];
  
  alumnosStats.forEach((stats, alumnoId) => {
    if (stats.porcentajes.length > 0) {
      const promedio = stats.porcentajes.reduce((sum, p) => sum + p, 0) / stats.porcentajes.length;
      if (promedio < 50) {
        const alumno = alumnosSalon.find((a: any) => a.id === alumnoId);
        if (alumno) {
          alumnosRiesgo.push({
            id: alumno.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            porcentaje: Math.round(promedio),
          });
        }
      }
    }
  });

  return alumnosRiesgo;
}

function calcularDatosPre(quizzesPre: any[], alumnosSalon: any[], conceptosMap: Map<string, string>) {
  if (quizzesPre.length === 0) return null;

  // Participación
  const totalEsperado = alumnosSalon.length * quizzesPre.length;
  const respuestasCompletadas = quizzesPre.reduce((sum, quiz) => {
    return sum + (quiz.respuestas_alumno || []).filter((r: any) => r.estado === 'completado').length;
  }, 0);
  const porcentajeParticipacion = totalEsperado > 0
    ? Math.round((respuestasCompletadas / totalEsperado) * 100)
    : 0;

  // Ausentes
  const alumnosQueRespondieron = new Set<string>();
  quizzesPre.forEach((quiz: any) => {
    (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
      if (respuesta.estado === 'completado') {
        alumnosQueRespondieron.add(respuesta.id_alumno);
      }
    });
  });
  const ausentes = alumnosSalon
    .filter((a: any) => !alumnosQueRespondieron.has(a.id))
    .map((a: any) => ({
      id: a.id,
      nombre: a.nombre,
      apellido: a.apellido,
    }));

  // Nivel de preparación
  const porcentajesAciertos: number[] = [];
  quizzesPre.forEach((quiz: any) => {
    (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
      if (respuesta.estado === 'completado' && respuesta.calificaciones) {
        const calificacion = Array.isArray(respuesta.calificaciones)
          ? respuesta.calificaciones[0]
          : respuesta.calificaciones;
        if (calificacion?.porcentaje_aciertos !== null && calificacion?.porcentaje_aciertos !== undefined) {
          porcentajesAciertos.push(Number(calificacion.porcentaje_aciertos));
        }
      }
    });
  });
  const promedioAciertos = porcentajesAciertos.length > 0
    ? porcentajesAciertos.reduce((sum, p) => sum + p, 0) / porcentajesAciertos.length
    : 0;

  // Conceptos débiles
  const conceptosDebiles = calcularConceptosDebiles(quizzesPre, conceptosMap);

  // Alumnos en riesgo
  const alumnosRiesgo = calcularAlumnosRiesgoPre(quizzesPre, alumnosSalon);

  return {
    participacion: {
      porcentaje: porcentajeParticipacion,
      ausentes: ausentes,
    },
    nivel_preparacion: {
      porcentaje: Math.round(promedioAciertos),
      clasificacion: clasificarPreparacion(promedioAciertos),
    },
    conceptos_debiles: conceptosDebiles,
    alumnos_riesgo: alumnosRiesgo,
  };
}

function calcularConceptosDebiles(quizzes: any[], conceptosMap: Map<string, string>) {
  const conceptosStats = new Map<string, { correctas: number; total: number }>();

  quizzes.forEach((quiz: any) => {
    (quiz.preguntas || []).forEach((pregunta: any) => {
      const concepto = conceptosMap.get(pregunta.id) || 'Concepto no identificado';
      
      if (!conceptosStats.has(concepto)) {
        conceptosStats.set(concepto, { correctas: 0, total: 0 });
      }

      const stats = conceptosStats.get(concepto)!;
      
      (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
        if (respuesta.estado === 'completado') {
          const detalle = (respuesta.respuestas_detalle || []).find(
            (d: any) => d.id_pregunta === pregunta.id
          );
          if (detalle) {
            stats.total++;
            if (detalle.es_correcta) {
              stats.correctas++;
            }
          }
        }
      });
    });
  });

  const resultado: Array<{ concepto: string; porcentaje_acierto: number }> = [];
  
  conceptosStats.forEach((stats, concepto) => {
    if (stats.total > 0) {
      const porcentaje = Math.round((stats.correctas / stats.total) * 100);
      resultado.push({ concepto, porcentaje_acierto: porcentaje });
    }
  });

  // Ordenar por porcentaje (menor primero) y tomar top 5
  return resultado.sort((a, b) => a.porcentaje_acierto - b.porcentaje_acierto).slice(0, 5);
}

function calcularAlumnosRiesgoPre(quizzes: any[], alumnosSalon: any[]) {
  const alumnosStats = new Map<string, { porcentajes: number[] }>();

  alumnosSalon.forEach((alumno: any) => {
    alumnosStats.set(alumno.id, { porcentajes: [] });
  });

  quizzes.forEach((quiz: any) => {
    (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
      if (respuesta.estado === 'completado' && respuesta.calificaciones) {
        const calificacion = Array.isArray(respuesta.calificaciones)
          ? respuesta.calificaciones[0]
          : respuesta.calificaciones;
        
        if (calificacion?.porcentaje_aciertos !== null && calificacion?.porcentaje_aciertos !== undefined) {
          const stats = alumnosStats.get(respuesta.id_alumno);
          if (stats) {
            stats.porcentajes.push(Number(calificacion.porcentaje_aciertos));
          }
        }
      }
    });
  });

  const alumnosRiesgo: any[] = [];
  
  alumnosStats.forEach((stats, alumnoId) => {
    if (stats.porcentajes.length > 0) {
      const promedio = stats.porcentajes.reduce((sum, p) => sum + p, 0) / stats.porcentajes.length;
      if (promedio < 40) { // Preparación baja
        const alumno = alumnosSalon.find((a: any) => a.id === alumnoId);
        if (alumno) {
          alumnosRiesgo.push({
            id: alumno.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            porcentaje: Math.round(promedio),
          });
        }
      }
    }
  });

  return alumnosRiesgo.sort((a, b) => a.porcentaje - b.porcentaje);
}

function calcularDatosPost(quizzesPost: any[], alumnosSalon: any[], conceptosMap: Map<string, string>) {
  if (quizzesPost.length === 0) return null;

  // Participación
  const totalEsperado = alumnosSalon.length * quizzesPost.length;
  const respuestasCompletadas = quizzesPost.reduce((sum, quiz) => {
    return sum + (quiz.respuestas_alumno || []).filter((r: any) => r.estado === 'completado').length;
  }, 0);
  const porcentajeParticipacion = totalEsperado > 0
    ? Math.round((respuestasCompletadas / totalEsperado) * 100)
    : 0;

  // Nivel de logro
  const porcentajesAciertos: number[] = [];
  quizzesPost.forEach((quiz: any) => {
    (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
      if (respuesta.estado === 'completado' && respuesta.calificaciones) {
        const calificacion = Array.isArray(respuesta.calificaciones)
          ? respuesta.calificaciones[0]
          : respuesta.calificaciones;
        if (calificacion?.porcentaje_aciertos !== null && calificacion?.porcentaje_aciertos !== undefined) {
          porcentajesAciertos.push(Number(calificacion.porcentaje_aciertos));
        }
      }
    });
  });
  const promedioLogro = porcentajesAciertos.length > 0
    ? porcentajesAciertos.reduce((sum, p) => sum + p, 0) / porcentajesAciertos.length
    : 0;

  // Distribución por niveles
  const distribucion = {
    riesgo: porcentajesAciertos.filter(p => p < 50).length,
    suficiente: porcentajesAciertos.filter(p => p >= 50 && p < 75).length,
    bueno: porcentajesAciertos.filter(p => p >= 75 && p < 90).length,
    destacado: porcentajesAciertos.filter(p => p >= 90).length,
  };

  // Conceptos logrados
  const conceptosLogrados = calcularConceptosLogrados(quizzesPost, conceptosMap);

  // Alumnos que requieren apoyo
  const alumnosApoyo = calcularAlumnosApoyo(quizzesPost, alumnosSalon);

  return {
    participacion: {
      porcentaje: porcentajeParticipacion,
    },
    nivel_logro: {
      promedio: Math.round(promedioLogro),
      distribucion: distribucion,
    },
    conceptos_logrados: conceptosLogrados,
    alumnos_apoyo: alumnosApoyo,
  };
}

function calcularConceptosLogrados(quizzes: any[], conceptosMap: Map<string, string>) {
  const conceptosStats = new Map<string, { correctas: number; total: number }>();

  quizzes.forEach((quiz: any) => {
    (quiz.preguntas || []).forEach((pregunta: any) => {
      const concepto = conceptosMap.get(pregunta.id) || 'Concepto no identificado';
      
      if (!conceptosStats.has(concepto)) {
        conceptosStats.set(concepto, { correctas: 0, total: 0 });
      }

      const stats = conceptosStats.get(concepto)!;
      
      (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
        if (respuesta.estado === 'completado') {
          const detalle = (respuesta.respuestas_detalle || []).find(
            (d: any) => d.id_pregunta === pregunta.id
          );
          if (detalle) {
            stats.total++;
            if (detalle.es_correcta) {
              stats.correctas++;
            }
          }
        }
      });
    });
  });

  const resultado: Array<{ concepto: string; porcentaje_logro: number; semaforo: string }> = [];
  
  conceptosStats.forEach((stats, concepto) => {
    if (stats.total > 0) {
      const porcentaje = Math.round((stats.correctas / stats.total) * 100);
      resultado.push({
        concepto,
        porcentaje_logro: porcentaje,
        semaforo: calcularSemaforo(porcentaje),
      });
    }
  });

  return resultado.sort((a, b) => b.porcentaje_logro - a.porcentaje_logro);
}

function calcularAlumnosApoyo(quizzes: any[], alumnosSalon: any[]) {
  const alumnosStats = new Map<string, { porcentajes: number[] }>();

  alumnosSalon.forEach((alumno: any) => {
    alumnosStats.set(alumno.id, { porcentajes: [] });
  });

  quizzes.forEach((quiz: any) => {
    (quiz.respuestas_alumno || []).forEach((respuesta: any) => {
      if (respuesta.estado === 'completado' && respuesta.calificaciones) {
        const calificacion = Array.isArray(respuesta.calificaciones)
          ? respuesta.calificaciones[0]
          : respuesta.calificaciones;
        
        if (calificacion?.porcentaje_aciertos !== null && calificacion?.porcentaje_aciertos !== undefined) {
          const stats = alumnosStats.get(respuesta.id_alumno);
          if (stats) {
            stats.porcentajes.push(Number(calificacion.porcentaje_aciertos));
          }
        }
      }
    });
  });

  const alumnosApoyo: any[] = [];
  
  alumnosStats.forEach((stats, alumnoId) => {
    if (stats.porcentajes.length > 0) {
      const promedio = stats.porcentajes.reduce((sum, p) => sum + p, 0) / stats.porcentajes.length;
      if (promedio < 50) { // En riesgo
        const alumno = alumnosSalon.find((a: any) => a.id === alumnoId);
        if (alumno) {
          alumnosApoyo.push({
            id: alumno.id,
            nombre: alumno.nombre,
            apellido: alumno.apellido,
            porcentaje: Math.round(promedio),
          });
        }
      }
    }
  });

  return alumnosApoyo.sort((a, b) => a.porcentaje - b.porcentaje);
}

function generarRecomendaciones(datosPre: any, datosPost: any, conceptosMap: Map<string, string>) {
  const recomendacionesPre: Array<{ recomendacion: string; sugerencia: string }> = [];
  const recomendacionesPost: Array<{ recomendacion: string; sugerencia: string; tipo: string; evidencia?: string }> = [];

  // Recomendaciones PRE
  if (datosPre) {
    // Basadas en conceptos débiles
    datosPre.conceptos_debiles.slice(0, 3).forEach((concepto: any) => {
      recomendacionesPre.push({
        recomendacion: `Refuerza el concepto de ${concepto.concepto}.`,
        sugerencia: `El grupo muestra solo ${concepto.porcentaje_acierto}% de aciertos en este concepto. Considera activar conocimientos previos o usar ejemplos visuales antes de abordar el tema.`,
      });
    });

    // Basadas en alumnos en riesgo
    if (datosPre.alumnos_riesgo.length > 0) {
      const nombres = datosPre.alumnos_riesgo.slice(0, 3).map((a: any) => a.nombre).join(', ');
      recomendacionesPre.push({
        recomendacion: `Atiende a los alumnos con bajo diagnóstico durante actividades grupales.`,
        sugerencia: `Los alumnos ${nombres} mostraron preparación baja (<40%). Asigna roles que les permitan observar y luego responder preguntas guiadas.`,
      });
    }
  }

  // Recomendaciones POST
  if (datosPost) {
    // Tipo: Refuerzo
    datosPost.conceptos_logrados
      .filter((c: any) => c.semaforo === 'rojo' || c.semaforo === 'amarillo')
      .slice(0, 2)
      .forEach((concepto: any) => {
        recomendacionesPost.push({
          recomendacion: `Fortalece la comprensión de ${concepto.concepto}.`,
          sugerencia: `Incluye un mini-ejercicio de refuerzo sobre este concepto durante el calentamiento de la siguiente clase.`,
          tipo: 'refuerzo',
        });
      });

    // Tipo: Evaluación guía
    datosPost.conceptos_logrados
      .filter((c: any) => c.semaforo === 'verde')
      .slice(0, 1)
      .forEach((concepto: any) => {
        recomendacionesPost.push({
          recomendacion: `La explicación sobre ${concepto.concepto} fue efectiva.`,
          sugerencia: `El ${concepto.porcentaje_logro}% de alumnos lograron responder correctamente. Considera mantener este enfoque para conceptos similares.`,
          tipo: 'evaluacion_guia',
          evidencia: `${concepto.porcentaje_logro}% de aciertos`,
        });
      });
  }

  return {
    pre: recomendacionesPre.slice(0, 5),
    post: recomendacionesPost.slice(0, 5),
  };
}

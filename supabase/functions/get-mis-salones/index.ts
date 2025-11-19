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
            progreso_general: { porcentaje: 0, total_sesiones: 0, completadas: 0 },
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
            progreso_general: { porcentaje: 0, total_sesiones: 0, completadas: 0 },
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
            )
          `)
          .eq('id_profesor', profesor.id)
          .eq('id_grupo', grupo.id)
          .in('id_tema', Array.from(temasConGuia));

        // Group clases by tema and filter: only temas with at least one sesión
        const temasConSesiones = new Map<string, any[]>();
        (clases || []).forEach((clase: any) => {
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

        // Calculate overall progress for salón
        const totalSesionesSalon = temasData.reduce((sum, t) => sum + (t.guia_tema.total_sesiones || 0), 0);
        const sesionesCompletadasSalon = temasData.reduce((sum, t) => sum + t.progreso.completadas, 0);
        const progresoGeneral = totalSesionesSalon > 0
          ? Math.round((sesionesCompletadasSalon / totalSesionesSalon) * 100)
          : 0;

        return {
          grupo,
          temas: temasData,
          progreso_general: {
            porcentaje: progresoGeneral,
            total_sesiones: totalSesionesSalon,
            completadas: sesionesCompletadasSalon,
            programadas: temasData.reduce((sum, t) => sum + t.progreso.programadas, 0),
            pendientes: temasData.reduce((sum, t) => sum + t.progreso.pendientes, 0),
          },
        };
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


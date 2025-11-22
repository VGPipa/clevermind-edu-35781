import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';
import {
  getClassStage,
  isEvaluationStage,
  isPreparationStage,
} from '../_shared/classStateStages.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, user, profesor } = await authenticateProfesor(req, true);

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
          descripcion,
          id_plan_anual,
          plan_anual (
            grado,
            anio_escolar
          )
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

    const asignacionesConEstadisticas = await Promise.all(
      (asignaciones || [])
        .filter((a: any) => a.materias && a.grupos)
        .map(async (asignacion: any) => {
          // Get temas for this materia
          const { data: temas, error: temasError } = await supabase
            .from('temas')
            .select('*')
            .eq('id_materia', asignacion.id_materia)
            .order('bimestre', { ascending: true })
            .order('orden', { ascending: true });

          if (temasError) {
            console.error('Error obteniendo temas:', temasError);
          }

          // Get clases for this asignacion
          const { data: clases, error: clasesError } = await supabase
            .from('clases')
            .select('id, id_tema, estado, fecha_programada, fecha_ejecutada')
            .eq('id_grupo', asignacion.id_grupo)
            .eq('id_profesor', profesor.id);

          if (clasesError) {
            console.error('Error obteniendo clases:', clasesError);
          }

          // Organize temas by bimestre and calculate progress
          const bimestres = [
            { numero: 1, nombre: 'Bimestre I', periodo: 'Marzo - Mayo', temas: [] as any[] },
            { numero: 2, nombre: 'Bimestre II', periodo: 'Mayo - Julio', temas: [] as any[] },
            { numero: 3, nombre: 'Bimestre III', periodo: 'Agosto - Octubre', temas: [] as any[] },
            { numero: 4, nombre: 'Bimestre IV', periodo: 'Octubre - Diciembre', temas: [] as any[] },
          ];

          (temas || []).forEach((tema: any) => {
            const bimestreIndex = (tema.bimestre || 1) - 1;
            
            // Calculate progress for this tema
            const clasesDelTema = (clases || []).filter((c: any) => c.id_tema === tema.id);
            const clasesProgramadas = clasesDelTema.length;
            const clasesEjecutadas = clasesDelTema.filter((c: any) => ['ejecutada', 'completada'].includes(c.estado)).length;
            const clasesEnFlujo = clasesDelTema.filter((c: any) => isPreparationStage(c.estado) || isEvaluationStage(c.estado)).length;
            
            let estado = 'pendiente';
            if (clasesEjecutadas > 0 && clasesEjecutadas === clasesProgramadas) {
              estado = 'completado';
            } else if (clasesEnFlujo > 0 || clasesEjecutadas > 0) {
              estado = 'en_progreso';
            }

            const progreso = clasesProgramadas > 0 
              ? Math.round((clasesEjecutadas / clasesProgramadas) * 100) 
              : 0;

            bimestres[bimestreIndex].temas.push({
              id: tema.id,
              nombre: tema.nombre,
              descripcion: tema.descripcion,
              objetivos: tema.objetivos,
              duracion_estimada: tema.duracion_estimada,
              estado,
              clases_programadas: clasesProgramadas,
              clases_ejecutadas: clasesEjecutadas,
              progreso,
              es_modificado: tema.tema_base_id !== null,
            });
          });

          // Calculate statistics
          const totalTemas = temas?.length || 0;
          const temasCompletados = bimestres.reduce((acc, b) => 
            acc + b.temas.filter(t => t.estado === 'completado').length, 0
          );
          const temasEnProgreso = bimestres.reduce((acc, b) => 
            acc + b.temas.filter(t => t.estado === 'en_progreso').length, 0
          );
          const temasPendientes = totalTemas - temasCompletados - temasEnProgreso;

          const progresoGeneral = totalTemas > 0 
            ? Math.round((temasCompletados / totalTemas) * 100) 
            : 0;

          const clasesProgramadas = clases?.filter(c => getClassStage(c.estado) !== 'otros').length || 0;
          const clasesCompletadas = clases?.filter(c => c.estado === 'ejecutada').length || 0;
          const temasConClases = new Set(clases?.map(c => c.id_tema)).size;

          return {
            id: asignacion.id,
            materia: {
              id: asignacion.materias?.id || '',
              nombre: asignacion.materias?.nombre || '',
              horas_semanales: asignacion.materias?.horas_semanales || 0,
              total_temas: totalTemas,
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
              porcentaje_cobertura: totalTemas ? Math.round((temasConClases / totalTemas) * 100) : 0,
              total_temas: totalTemas,
              temas_completados: temasCompletados,
              temas_en_progreso: temasEnProgreso,
              temas_pendientes: temasPendientes,
            },
            planificacion: {
              progreso_general: progresoGeneral,
              bimestres,
            }
          };
        })
    );

    // Calcular estadísticas generales
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

    return createSuccessResponse(resultado);

  } catch (error) {
    console.error('Error en get-perfil-profesor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});

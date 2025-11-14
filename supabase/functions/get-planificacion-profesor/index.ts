import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, false);

    // Get asignaciones for 2025
    const { data: asignaciones, error: asignacionesError } = await supabase
      .from('asignaciones_profesor')
      .select(`
        id,
        anio_escolar,
        id_materia,
        id_grupo,
        materias (
          id,
          nombre,
          descripcion,
          horas_semanales,
          orden,
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
          seccion
        )
      `)
      .eq('id_profesor', profesor.id)
      .eq('anio_escolar', '2025');

    if (asignacionesError) {
      console.error('Error al obtener asignaciones:', asignacionesError);
      throw asignacionesError;
    }

    console.log('Asignaciones encontradas:', asignaciones?.length || 0);

    // For each materia, get temas organized by bimestre
    const materiasConTemas = await Promise.all(
      (asignaciones || []).map(async (asignacion: any) => {
        // Validate data exists
        if (!asignacion.materias) {
          console.warn('Asignación sin materia encontrada:', asignacion.id);
          return null;
        }

        const { data: temas, error: temasError } = await supabase
          .from('temas')
          .select('*')
          .eq('id_materia', asignacion.id_materia)
          .order('bimestre', { ascending: true })
          .order('orden', { ascending: true });

        if (temasError) {
          console.error('Error al obtener temas:', temasError);
          return null;
        }

        // Get clases asociadas to calculate progress
        const { data: clases, error: clasesError } = await supabase
          .from('clases')
          .select('id, id_tema, estado, fecha_programada, fecha_ejecutada')
          .eq('id_grupo', asignacion.id_grupo)
          .eq('id_profesor', profesor.id);

        if (clasesError) {
          console.error('Error al obtener clases:', clasesError);
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
          const clasesEjecutadas = clasesDelTema.filter((c: any) => c.estado === 'ejecutada').length;
          const clasesEnProgreso = clasesDelTema.filter((c: any) => c.estado === 'programada').length;
          
          let estado = 'pendiente';
          if (clasesEjecutadas > 0 && clasesEjecutadas === clasesProgramadas) {
            estado = 'completado';
          } else if (clasesEnProgreso > 0 || clasesEjecutadas > 0) {
            estado = 'en_progreso';
          }

          const progreso = clasesProgramadas > 0 
            ? Math.round((clasesEjecutadas / clasesProgramadas) * 100) 
            : 0;

          bimestres[bimestreIndex].temas.push({
            ...tema,
            estado,
            clases_programadas: clasesProgramadas,
            clases_ejecutadas: clasesEjecutadas,
            progreso,
            es_modificado: tema.tema_base_id !== null,
          });
        });

        // Calculate overall progress for the materia
        const totalTemas = temas?.length || 0;
        const temasCompletados = bimestres.reduce((acc, b) => 
          acc + b.temas.filter(t => t.estado === 'completado').length, 0
        );
        const progresoGeneral = totalTemas > 0 
          ? Math.round((temasCompletados / totalTemas) * 100) 
          : 0;

        return {
          id: asignacion.materias.id,
          nombre: asignacion.materias.nombre || 'Sin nombre',
          descripcion: asignacion.materias.descripcion || '',
          grado: asignacion.materias.plan_anual?.grado || asignacion.grupos?.grado || '1',
          grupo: asignacion.grupos?.nombre || 'Sin grupo',
          seccion: asignacion.grupos?.seccion || 'A',
          horas_semanales: asignacion.materias.horas_semanales || 0,
          progreso_general: progresoGeneral,
          bimestres,
        };
      })
    );

    const response = {
      anio_escolar: '2025',
      materias: materiasConTemas.filter(m => m !== null),
    };

    console.log('Respuesta generada con', response.materias.length, 'materias');

    return createSuccessResponse(response);

  } catch (error) {
    console.error('Error en get-planificacion-profesor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 400);
  }
});

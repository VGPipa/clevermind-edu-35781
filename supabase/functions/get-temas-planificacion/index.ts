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

    // Get asignaciones for current year
    const anioActual = new Date().getFullYear().toString();
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
      .eq('anio_escolar', anioActual);

    if (asignacionesError) {
      console.error('Error al obtener asignaciones:', asignacionesError);
      throw asignacionesError;
    }

    console.log('Asignaciones encontradas:', asignaciones?.length || 0);

    // Get all temas from assigned materias
    const materiaIds = (asignaciones || []).map(a => a.id_materia).filter(Boolean);
    
    if (materiaIds.length === 0) {
      return createSuccessResponse({ temas: [] });
    }

    const { data: temas, error: temasError } = await supabase
      .from('temas')
      .select(`
        id,
        nombre,
        descripcion,
        objetivos,
        duracion_estimada,
        bimestre,
        orden,
        id_materia,
        materias (
          id,
          nombre,
          horas_semanales,
          plan_anual (
            grado
          )
        )
      `)
      .in('id_materia', materiaIds)
      .order('bimestre', { ascending: true })
      .order('orden', { ascending: true });

    if (temasError) {
      console.error('Error al obtener temas:', temasError);
      throw temasError;
    }

    // Get guías maestras del profesor
    const temaIds = (temas || []).map(t => t.id);
    const { data: guiasTema } = await supabase
      .from('guias_tema')
      .select('id_tema, total_sesiones')
      .eq('id_profesor', profesor.id)
      .in('id_tema', temaIds.length > 0 ? temaIds : ['00000000-0000-0000-0000-000000000000']);

    const temasConGuia = new Map(guiasTema?.map(g => [g.id_tema, g]) || []);

    // Get clases (sesiones) creadas para estos temas
    const { data: clases, error: clasesError } = await supabase
      .from('clases')
      .select('id, id_tema, id_guia_tema, estado, numero_sesion')
      .eq('id_profesor', profesor.id)
      .in('id_tema', temaIds.length > 0 ? temaIds : ['00000000-0000-0000-0000-000000000000']);

    if (clasesError) {
      console.error('Error al obtener clases:', clasesError);
    }

    // Count sesiones per tema
    const sesionesPorTema = new Map<string, number>();
    (clases || []).forEach((clase: any) => {
      if (clase.id_tema) {
        const count = sesionesPorTema.get(clase.id_tema) || 0;
        sesionesPorTema.set(clase.id_tema, count + 1);
      }
    });

    // Build response with estatus
    const temasConEstatus = (temas || []).map((tema: any) => {
      const tieneGuia = temasConGuia.has(tema.id);
      const tieneSesiones = (sesionesPorTema.get(tema.id) || 0) > 0;
      
      let estatus: 'sin_guia' | 'con_guia_sin_sesiones' | 'con_sesiones';
      if (!tieneGuia) {
        estatus = 'sin_guia';
      } else if (tieneGuia && !tieneSesiones) {
        estatus = 'con_guia_sin_sesiones';
      } else {
        estatus = 'con_sesiones';
      }

      // Find asignacion for this tema's materia
      const asignacion = asignaciones?.find(a => a.id_materia === tema.id_materia);
      
      return {
        id: tema.id,
        nombre: tema.nombre,
        descripcion: tema.descripcion,
        objetivos: tema.objetivos,
        duracion_estimada: tema.duracion_estimada,
        bimestre: tema.bimestre,
        orden: tema.orden,
        materia: (() => {
          const materia = Array.isArray(tema.materias) ? tema.materias[0] : tema.materias;
          const planAnual = Array.isArray(materia?.plan_anual) ? materia?.plan_anual[0] : materia?.plan_anual;
          return {
            id: materia?.id,
            nombre: materia?.nombre,
            horas_semanales: materia?.horas_semanales,
            grado: planAnual?.grado,
          };
        })(),
        grupo: (() => {
          if (!asignacion?.grupos) return null;
          const grupo = Array.isArray(asignacion.grupos) ? asignacion.grupos[0] : asignacion.grupos;
          return {
            id: grupo?.id,
            nombre: grupo?.nombre,
            grado: grupo?.grado,
            seccion: grupo?.seccion,
          };
        })(),
        tiene_guia_maestra: tieneGuia,
        total_sesiones_guia: temasConGuia.get(tema.id)?.total_sesiones || null,
        sesiones_creadas: sesionesPorTema.get(tema.id) || 0,
        estatus,
      };
    });

    return createSuccessResponse({
      temas: temasConEstatus,
      total: temasConEstatus.length,
      sin_guia: temasConEstatus.filter(t => t.estatus === 'sin_guia').length,
      con_guia: temasConEstatus.filter(t => t.estatus !== 'sin_guia').length,
      con_sesiones: temasConEstatus.filter(t => t.estatus === 'con_sesiones').length,
    });

  } catch (error) {
    console.error('Error en get-temas-planificacion:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});


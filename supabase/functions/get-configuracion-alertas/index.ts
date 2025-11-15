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
    const { supabase, profesor } = await authenticateProfesor(req, true);

    // Get profesor's institution
    const { data: profesorData } = await supabase
      .from('profesores')
      .select('id_institucion')
      .eq('id', profesor.id)
      .single();

    if (!profesorData?.id_institucion) {
      return createErrorResponse('Profesor no tiene institución asignada', 404);
    }

    // Get alert configuration for the institution
    const { data: config, error: configError } = await supabase
      .from('configuracion_alertas')
      .select('*')
      .eq('id_institucion', profesorData.id_institucion)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching alert config:', configError);
      return createErrorResponse(configError.message, 500);
    }

    // Return default values if no configuration exists
    if (!config) {
      return createSuccessResponse({
        rango_dias_clases_pendientes: 60,
        dias_urgente: 2,
        dias_proxima: 5,
        dias_programada: 14,
        dias_lejana: 999,
        es_default: true,
      });
    }

    return createSuccessResponse({
      rango_dias_clases_pendientes: config.rango_dias_clases_pendientes,
      dias_urgente: config.dias_urgente,
      dias_proxima: config.dias_proxima,
      dias_programada: config.dias_programada,
      dias_lejana: config.dias_lejana,
      es_default: false,
    });
  } catch (error) {
    console.error('Error in get-configuracion-alertas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


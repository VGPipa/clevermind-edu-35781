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
    const { supabase, user } = await authenticateProfesor(req, true);

    // Verify user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('id_institucion')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole?.id_institucion) {
      return createErrorResponse('No autorizado - se requiere rol de administrador', 403);
    }

    const { action, ...data } = await req.json();

    if (action === 'get') {
      const { data: config, error } = await supabase
        .from('configuracion_alertas')
        .select('*')
        .eq('id_institucion', userRole.id_institucion)
        .maybeSingle();

      if (error) {
        console.error('Error fetching config:', error);
        return createErrorResponse(error.message, 500);
      }

      // Return default if not exists
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
        ...config,
        es_default: false,
      });
    }

    if (action === 'save') {
      // Check if config exists
      const { data: existing } = await supabase
        .from('configuracion_alertas')
        .select('id')
        .eq('id_institucion', userRole.id_institucion)
        .maybeSingle();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('configuracion_alertas')
          .update({
            rango_dias_clases_pendientes: data.rango_dias_clases_pendientes,
            dias_urgente: data.dias_urgente,
            dias_proxima: data.dias_proxima,
            dias_programada: data.dias_programada,
            dias_lejana: data.dias_lejana,
          })
          .eq('id', existing.id);

        if (error) {
          console.error('Error updating config:', error);
          return createErrorResponse(error.message, 500);
        }
      } else {
        // Insert
        const { error } = await supabase
          .from('configuracion_alertas')
          .insert({
            id_institucion: userRole.id_institucion,
            rango_dias_clases_pendientes: data.rango_dias_clases_pendientes,
            dias_urgente: data.dias_urgente,
            dias_proxima: data.dias_proxima,
            dias_programada: data.dias_programada,
            dias_lejana: data.dias_lejana,
          });

        if (error) {
          console.error('Error creating config:', error);
          return createErrorResponse(error.message, 500);
        }
      }

      return createSuccessResponse({ success: true, message: 'Configuración guardada exitosamente' });
    }

    return createErrorResponse('Acción inválida', 400);
  } catch (error) {
    console.error('Error in manage-configuracion-alertas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


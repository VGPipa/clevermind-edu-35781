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

    const { action, id, id_anio_escolar, ...data } = await req.json();

    if (action === 'create') {
      if (!id_anio_escolar) {
        return createErrorResponse('id_anio_escolar es requerido', 400);
      }

      // Verify the year belongs to the institution
      const { data: anio } = await supabase
        .from('anios_escolares')
        .select('id_institucion')
        .eq('id', id_anio_escolar)
        .single();

      if (!anio || anio.id_institucion !== userRole.id_institucion) {
        return createErrorResponse('Año escolar no encontrado o no autorizado', 404);
      }

      const { error } = await supabase
        .from('periodos_academicos')
        .insert({
          id_anio_escolar,
          numero: data.numero,
          nombre: data.nombre,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          activo: data.activo || false,
        });

      if (error) {
        console.error('Error creating period:', error);
        return createErrorResponse(error.message, 500);
      }

      return createSuccessResponse({ success: true, message: 'Periodo académico creado exitosamente' });
    }

    if (action === 'update') {
      if (!id) {
        return createErrorResponse('ID es requerido para actualizar', 400);
      }

      // Verify the period belongs to a year in the institution
      const { data: periodo } = await supabase
        .from('periodos_academicos')
        .select(`
          id,
          anios_escolares!inner(id_institucion)
        `)
        .eq('id', id)
        .single();

      if (!periodo || (periodo.anios_escolares as any).id_institucion !== userRole.id_institucion) {
        return createErrorResponse('Periodo académico no encontrado o no autorizado', 404);
      }

      const { error } = await supabase
        .from('periodos_academicos')
        .update({
          numero: data.numero,
          nombre: data.nombre,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          activo: data.activo,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating period:', error);
        return createErrorResponse(error.message, 500);
      }

      return createSuccessResponse({ success: true, message: 'Periodo académico actualizado exitosamente' });
    }

    if (action === 'delete') {
      if (!id) {
        return createErrorResponse('ID es requerido para eliminar', 400);
      }

      // Verify the period belongs to a year in the institution
      const { data: periodo } = await supabase
        .from('periodos_academicos')
        .select(`
          id,
          anios_escolares!inner(id_institucion)
        `)
        .eq('id', id)
        .single();

      if (!periodo || (periodo.anios_escolares as any).id_institucion !== userRole.id_institucion) {
        return createErrorResponse('Periodo académico no encontrado o no autorizado', 404);
      }

      const { error } = await supabase
        .from('periodos_academicos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting period:', error);
        return createErrorResponse(error.message, 500);
      }

      return createSuccessResponse({ success: true, message: 'Periodo académico eliminado exitosamente' });
    }

    return createErrorResponse('Acción inválida', 400);
  } catch (error) {
    console.error('Error in manage-periodo-academico:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


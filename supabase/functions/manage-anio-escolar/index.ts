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

    const { action, id, ...data } = await req.json();

    if (action === 'create') {
      const { error } = await supabase
        .from('anios_escolares')
        .insert({
          id_institucion: userRole.id_institucion,
          nombre: data.nombre,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          activo: data.activo || false,
        });

      if (error) {
        console.error('Error creating academic year:', error);
        return createErrorResponse(error.message, 500);
      }

      return createSuccessResponse({ success: true, message: 'Año escolar creado exitosamente' });
    }

    if (action === 'update') {
      if (!id) {
        return createErrorResponse('ID es requerido para actualizar', 400);
      }

      // Verify the year belongs to the institution
      const { data: existingYear } = await supabase
        .from('anios_escolares')
        .select('id_institucion')
        .eq('id', id)
        .single();

      if (!existingYear || existingYear.id_institucion !== userRole.id_institucion) {
        return createErrorResponse('Año escolar no encontrado o no autorizado', 404);
      }

      const { error } = await supabase
        .from('anios_escolares')
        .update({
          nombre: data.nombre,
          fecha_inicio: data.fecha_inicio,
          fecha_fin: data.fecha_fin,
          activo: data.activo,
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating academic year:', error);
        return createErrorResponse(error.message, 500);
      }

      return createSuccessResponse({ success: true, message: 'Año escolar actualizado exitosamente' });
    }

    if (action === 'delete') {
      if (!id) {
        return createErrorResponse('ID es requerido para eliminar', 400);
      }

      // Verify the year belongs to the institution
      const { data: existingYear } = await supabase
        .from('anios_escolares')
        .select('id_institucion')
        .eq('id', id)
        .single();

      if (!existingYear || existingYear.id_institucion !== userRole.id_institucion) {
        return createErrorResponse('Año escolar no encontrado o no autorizado', 404);
      }

      const { error } = await supabase
        .from('anios_escolares')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting academic year:', error);
        return createErrorResponse(error.message, 500);
      }

      return createSuccessResponse({ success: true, message: 'Año escolar eliminado exitosamente' });
    }

    return createErrorResponse('Acción inválida', 400);
  } catch (error) {
    console.error('Error in manage-anio-escolar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


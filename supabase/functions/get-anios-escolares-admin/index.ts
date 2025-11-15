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

    // Get all academic years for the institution
    const { data: anios, error: aniosError } = await supabase
      .from('anios_escolares')
      .select('*')
      .eq('id_institucion', userRole.id_institucion)
      .order('fecha_inicio', { ascending: false });

    if (aniosError) {
      console.error('Error fetching academic years:', aniosError);
      return createErrorResponse(aniosError.message, 500);
    }

    // Get periods for each year
    const aniosConPeriodos = await Promise.all(
      (anios || []).map(async (anio: any) => {
        const { data: periodos } = await supabase
          .from('periodos_academicos')
          .select('*')
          .eq('id_anio_escolar', anio.id)
          .order('numero', { ascending: true });

        return {
          ...anio,
          periodos: periodos || [],
        };
      })
    );

    return createSuccessResponse({
      anios_escolares: aniosConPeriodos,
      id_institucion: userRole.id_institucion,
    });
  } catch (error) {
    console.error('Error in get-anios-escolares-admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


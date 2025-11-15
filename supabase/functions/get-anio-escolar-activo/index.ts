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

    // Get active academic year for the institution
    const { data: anioActivo, error: anioError } = await supabase
      .from('anios_escolares')
      .select('*')
      .eq('id_institucion', profesorData.id_institucion)
      .eq('activo', true)
      .maybeSingle();

    if (anioError) {
      console.error('Error fetching active year:', anioError);
      return createErrorResponse(anioError.message, 500);
    }

    // Get active periods for the active year
    let periodosActivos: any[] = [];
    if (anioActivo) {
      const { data: periodos, error: periodosError } = await supabase
        .from('periodos_academicos')
        .select('*')
        .eq('id_anio_escolar', anioActivo.id)
        .eq('activo', true)
        .order('numero', { ascending: true });

      if (periodosError) {
        console.error('Error fetching periods:', periodosError);
      } else {
        periodosActivos = periodos || [];
      }
    }

    return createSuccessResponse({
      anio_escolar: anioActivo,
      periodos_academicos: periodosActivos,
      tiene_anio_activo: !!anioActivo,
    });
  } catch (error) {
    console.error('Error in get-anio-escolar-activo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


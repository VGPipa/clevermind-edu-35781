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

    const { id_clase, id_version } = await req.json();

    if (!id_clase || !id_version) {
      return createErrorResponse('id_clase e id_version son requeridos', 400);
    }

    console.log('Approving guide for class:', id_clase, 'version:', id_version);

    // Verify profesor owns this class
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('id, id_profesor, id_guia_version_actual')
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    // Verify version exists and belongs to this class
    const { data: version, error: versionError } = await supabase
      .from('guias_clase_versiones')
      .select('id, id_clase, estado, version_numero')
      .eq('id', id_version)
      .eq('id_clase', id_clase)
      .single();

    if (versionError || !version) {
      return createErrorResponse('Versión de guía no encontrada', 404);
    }

    // Update version to approved
    const { error: updateVersionError } = await supabase
      .from('guias_clase_versiones')
      .update({
        estado: 'aprobada',
        aprobada_por: profesor.id,
        fecha_aprobacion: new Date().toISOString(),
      })
      .eq('id', id_version);

    if (updateVersionError) {
      console.error('Error updating version:', updateVersionError);
      return createErrorResponse(updateVersionError.message, 500);
    }

    // Update clase to reference this version and change state
    const { error: updateClaseError } = await supabase
      .from('clases')
      .update({
        id_guia_version_actual: id_version,
        estado: 'guia_aprobada'
      })
      .eq('id', id_clase);

    if (updateClaseError) {
      console.error('Error updating clase:', updateClaseError);
      return createErrorResponse(updateClaseError.message, 500);
    }

    // Check if quiz pre already exists
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id, estado')
      .eq('id_clase', id_clase)
      .eq('tipo_evaluacion', 'pre')
      .maybeSingle();

    // If quiz pre doesn't exist, it will be generated when profesor requests it
    // (not automatically, as per requirements: profesor decides when to send it)

    return createSuccessResponse({
      success: true,
      message: 'Guía aprobada exitosamente',
      version_aprobada: id_version,
      clase_estado: 'guia_aprobada',
      tiene_quiz_pre: !!existingQuiz,
      quiz_pre_id: existingQuiz?.id || null,
    });
  } catch (error) {
    console.error('Error in aprobar-guia:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


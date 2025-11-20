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

    // Parse body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return createErrorResponse('Cuerpo de solicitud inválido', 400);
    }

    const { 
      id_guia_tema,
      objetivos_generales,
      estructura_sesiones,
      contenido,
      metodologias,
      contexto_grupo
    } = body;

    if (!id_guia_tema) {
      return createErrorResponse('id_guia_tema es requerido', 400);
    }

    console.log('Actualizando guía tema:', id_guia_tema);

    // Verificar que el profesor sea dueño de la guía
    const { data: guiaTema, error: guiaError } = await supabase
      .from('guias_tema')
      .select('*')
      .eq('id', id_guia_tema)
      .eq('id_profesor', profesor.id)
      .single();

    if (guiaError || !guiaTema) {
      return createErrorResponse('Guía maestra no encontrada o no autorizada', 404);
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (objetivos_generales !== undefined) {
      updateData.objetivos_generales = objetivos_generales;
    }
    if (estructura_sesiones !== undefined) {
      updateData.estructura_sesiones = estructura_sesiones;
    }
    if (contenido !== undefined) {
      updateData.contenido = contenido;
    }
    if (metodologias !== undefined) {
      updateData.metodologias = metodologias;
    }
    if (contexto_grupo !== undefined) {
      updateData.contexto_grupo = contexto_grupo;
    }

    // Actualizar guía maestra
    const { data: guiaActualizada, error: updateError } = await supabase
      .from('guias_tema')
      .update(updateData)
      .eq('id', id_guia_tema)
      .select()
      .single();

    if (updateError) {
      console.error('Error actualizando guía:', updateError);
      throw updateError;
    }

    console.log('Guía maestra actualizada:', guiaActualizada.id);

    return createSuccessResponse({ 
      success: true, 
      guia_tema: guiaActualizada,
      mensaje: 'Guía maestra actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error en actualizar-guia-tema:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});

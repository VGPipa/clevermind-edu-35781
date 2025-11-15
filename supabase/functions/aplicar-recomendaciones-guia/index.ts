import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';
import { callAI, parseAIJSON } from '../_shared/ai.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, true);

    const {
      id_clase,
      id_recomendaciones_aplicar = [], // Array of recommendation IDs to apply
      modificaciones_manuales = null, // Optional manual modifications to guide
      crear_version_final = false // Whether to create final version
    } = await req.json();

    if (!id_clase) {
      return createErrorResponse('id_clase es requerido', 400);
    }

    console.log('Applying recommendations for class:', id_clase);

    // Verify profesor owns this class
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select('id, id_profesor, estado, id_guia_version_actual')
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    // Get current guide version
    if (!clase.id_guia_version_actual) {
      return createErrorResponse('No hay guía generada para esta clase', 404);
    }

    const { data: currentVersion, error: versionError } = await supabase
      .from('guias_clase_versiones')
      .select('*')
      .eq('id', clase.id_guia_version_actual)
      .single();

    if (versionError || !currentVersion) {
      return createErrorResponse('Versión de guía no encontrada', 404);
    }

    // Get recommendations to apply
    let recomendacionesAplicadas: any[] = [];
    if (id_recomendaciones_aplicar.length > 0) {
      const { data: recomendaciones, error: recError } = await supabase
        .from('recomendaciones')
        .select('*')
        .eq('id_clase', id_clase)
        .in('id', id_recomendaciones_aplicar)
        .eq('aplicada', false);

      if (recError) {
        return createErrorResponse(recError.message, 500);
      }

      recomendacionesAplicadas = recomendaciones || [];
    }

    // Get next version number
    const { data: existingVersions } = await supabase
      .from('guias_clase_versiones')
      .select('version_numero')
      .eq('id_clase', id_clase)
      .order('version_numero', { ascending: false })
      .limit(1);

    const nextVersion = existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_numero + 1
      : currentVersion.version_numero + 1;

    // Prepare new version data
    let nuevaVersionData: any = {
      id_clase,
      version_numero: nextVersion,
      objetivos: currentVersion.objetivos,
      estructura: currentVersion.estructura,
      preguntas_socraticas: currentVersion.preguntas_socraticas,
      contenido: currentVersion.contenido,
      recursos: currentVersion.recursos,
      generada_ia: currentVersion.generada_ia,
      estado: modificaciones_manuales || recomendacionesAplicadas.length > 0 ? 'borrador' : currentVersion.estado,
    };

    // If there are manual modifications, apply them
    if (modificaciones_manuales) {
      if (modificaciones_manuales.objetivos) {
        nuevaVersionData.objetivos = modificaciones_manuales.objetivos;
      }
      if (modificaciones_manuales.estructura) {
        nuevaVersionData.estructura = modificaciones_manuales.estructura;
      }
      if (modificaciones_manuales.preguntas_socraticas) {
        nuevaVersionData.preguntas_socraticas = modificaciones_manuales.preguntas_socraticas;
      }
    }

    // If there are recommendations to apply, use AI to incorporate them
    if (recomendacionesAplicadas.length > 0) {
      const systemPrompt = `Eres un asistente experto en educación. 
Tu tarea es actualizar una guía de clase incorporando recomendaciones específicas basadas en los resultados de un quiz previo.
Mantén la estructura y calidad de la guía original mientras incorporas las mejoras sugeridas.`;

      const userPrompt = `Actualiza la siguiente guía de clase incorporando estas recomendaciones:

GUÍA ACTUAL:
Objetivos:
${currentVersion.objetivos}

Estructura:
${JSON.stringify(currentVersion.estructura, null, 2)}

Preguntas Socráticas:
${JSON.stringify(currentVersion.preguntas_socraticas, null, 2)}

RECOMENDACIONES A APLICAR:
${recomendacionesAplicadas.map((r: any) => r.contenido).join('\n\n')}

${modificaciones_manuales ? `\nMODIFICACIONES MANUALES DEL PROFESOR:\n${JSON.stringify(modificaciones_manuales, null, 2)}` : ''}

Genera la versión actualizada en formato JSON:
{
  "objetivos": "texto con objetivos actualizados",
  "estructura": [...],
  "preguntas_socraticas": [...]
}`;

      const aiResponse = await callAI({
        systemPrompt,
        userPrompt,
        responseFormat: 'json_object',
        temperature: 0.7,
        maxTokens: 2500,
      });

      const updatedGuide = parseAIJSON<{
        objetivos: string;
        estructura: any[];
        preguntas_socraticas: any[];
      }>(aiResponse.content);

      nuevaVersionData.objetivos = updatedGuide.objetivos;
      nuevaVersionData.estructura = updatedGuide.estructura;
      nuevaVersionData.preguntas_socraticas = updatedGuide.preguntas_socraticas;
      nuevaVersionData.generada_ia = true;
    }

    // If creating final version, mark it as such
    if (crear_version_final) {
      nuevaVersionData.estado = 'final';
      nuevaVersionData.es_version_final = true;
    }

    // Create new version
    const { data: newVersion, error: createError } = await supabase
      .from('guias_clase_versiones')
      .insert(nuevaVersionData)
      .select()
      .single();

    if (createError) {
      console.error('Error creating new version:', createError);
      return createErrorResponse(createError.message, 500);
    }

    // Mark recommendations as applied
    if (recomendacionesAplicadas.length > 0) {
      const { error: updateRecError } = await supabase
        .from('recomendaciones')
        .update({
          aplicada: true,
          aplicada_a_version: newVersion.id
        })
        .in('id', id_recomendaciones_aplicar);

      if (updateRecError) {
        console.error('Error updating recommendations:', updateRecError);
        // Don't fail, just log
      }
    }

    // Update clase to reference new version
    const nuevoEstadoClase = crear_version_final ? 'guia_final' : 'modificando_guia';
    const { error: updateClaseError } = await supabase
      .from('clases')
      .update({
        id_guia_version_actual: newVersion.id,
        estado: nuevoEstadoClase as any
      })
      .eq('id', id_clase);

    if (updateClaseError) {
      console.error('Error updating clase:', updateClaseError);
      return createErrorResponse(updateClaseError.message, 500);
    }

    // If final version, quiz post can be generated (but not automatically)
    // The profesor will generate it when ready

    return createSuccessResponse({
      success: true,
      message: crear_version_final 
        ? 'Versión final de la guía creada exitosamente' 
        : 'Nueva versión de la guía creada con las recomendaciones aplicadas',
      version_id: newVersion.id,
      version_numero: nextVersion,
      es_version_final: crear_version_final,
      clase_estado: nuevoEstadoClase,
      recomendaciones_aplicadas: recomendacionesAplicadas.length,
    });
  } catch (error) {
    console.error('Error in aplicar-recomendaciones-guia:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});


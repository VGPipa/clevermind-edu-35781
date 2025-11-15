import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { callAI, parseAIJSON } from '../_shared/ai.ts';
import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, true);

    const { 
      id_clase,
      opciones_metodologia = [], // Array of selected methodology options
      contexto_especifico = '' // Additional context from professor
    } = await req.json();

    console.log('Generating guide for class:', id_clase);

    // Verify profesor owns this class
    const { data: clase, error: claseError } = await supabase
      .from('clases')
      .select(`
        *,
        temas!inner(nombre, descripcion, objetivos),
        grupos!inner(nombre, grado, perfil)
      `)
      .eq('id', id_clase)
      .eq('id_profesor', profesor.id)
      .single();

    if (claseError || !clase) {
      return createErrorResponse('Clase no encontrada o no autorizada', 404);
    }

    // Get existing versions to determine next version number
    const { data: existingVersions } = await supabase
      .from('guias_clase_versiones')
      .select('version_numero')
      .eq('id_clase', id_clase)
      .order('version_numero', { ascending: false })
      .limit(1);

    const nextVersion = existingVersions && existingVersions.length > 0
      ? existingVersions[0].version_numero + 1
      : 1;

    // Get recommendations for this class
    const { data: recommendations } = await supabase
      .from('recomendaciones')
      .select('contenido, tipo')
      .eq('id_clase', id_clase)
      .eq('aplicada', false);

    // Build methodology text from selected options
    const metodologiaTexto = opciones_metodologia.length > 0
      ? opciones_metodologia.join(', ')
      : clase.metodologia || 'No especificada';

    // Combine contexto from class and additional contexto_especifico
    const contextoCompleto = [
      clase.contexto,
      contexto_especifico
    ].filter(Boolean).join('\n\n') || 'No especificado';

    // Build AI prompt with all context
    const systemPrompt = `Eres un asistente experto en educación y pensamiento crítico. 
Tu tarea es generar guías de clase estructuradas y efectivas que desarrollen habilidades de pensamiento crítico en los estudiantes.
Usa las metodologías especificadas y adapta el contenido al nivel del estudiante.
Considera el contexto específico proporcionado por el profesor para personalizar la guía.`;

    const userPrompt = `Genera una guía de clase con la siguiente información:

Tema: ${clase.temas.nombre}
Descripción del tema: ${clase.temas.descripcion || 'No especificada'}
Objetivos curriculares del tema: ${clase.temas.objetivos || 'No especificados'}
Grado: ${clase.grupos.grado}
Grupo de edad: ${clase.grupo_edad}
Duración de la clase: ${clase.duracion_minutos} minutos
Metodologías seleccionadas: ${metodologiaTexto}
Contexto específico del profesor: ${contextoCompleto}
${recommendations && recommendations.length > 0 ? `\nRecomendaciones de clases anteriores:\n${recommendations.map(r => r.contenido).join('\n')}` : ''}

La guía debe incluir:
1. Objetivos de aprendizaje específicos (3-4 objetivos medibles y alineados con el tema)
2. Estructura de la clase con actividades y tiempos (dividir los ${clase.duracion_minutos} minutos de manera equilibrada)
3. Preguntas socráticas para fomentar el pensamiento crítico (4-6 preguntas que promuevan análisis y reflexión)

Responde en formato JSON con esta estructura:
{
  "objetivos": ["objetivo 1", "objetivo 2", ...],
  "estructura": [
    {"tiempo": 10, "actividad": "Nombre de la actividad", "descripcion": "Detalles de la actividad"},
    ...
  ],
  "preguntas_socraticas": ["pregunta 1", "pregunta 2", ...]
}`;

    // Call AI using helper
    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.7,
      maxTokens: 2000,
    });

    const guideContent = parseAIJSON<{
      objetivos: string[];
      estructura: Array<{ tiempo: number; actividad: string; descripcion: string }>;
      preguntas_socraticas: string[];
    }>(aiResponse.content);

    // Get current version number for this class
    const { data: currentVersion } = await supabase
      .from('guias_clase_versiones')
      .select('version_numero')
      .eq('id_clase', id_clase)
      .order('version_numero', { ascending: false })
      .limit(1)
      .maybeSingle();

    const versionNumero = currentVersion ? currentVersion.version_numero + 1 : 1;

    // Create new version in guias_clase_versiones
    const { data: newVersion, error: versionError } = await supabase
      .from('guias_clase_versiones')
      .insert({
        id_clase,
        version_numero: versionNumero,
        objetivos: guideContent.objetivos.join('\n'),
        estructura: guideContent.estructura,
        preguntas_socraticas: guideContent.preguntas_socraticas,
        contenido: {
          tema: clase.temas.nombre,
          grado: clase.grupos.grado,
          duracion: clase.duracion_minutos,
          metodologias: opciones_metodologia,
          contexto: contextoCompleto,
        },
        estado: 'borrador',
        generada_ia: true,
      })
      .select()
      .single();

    if (versionError) {
      console.error('Error saving guide version:', versionError);
      return createErrorResponse(versionError.message, 500);
    }

    // Update clase to reference this version and change state
    const { error: updateError } = await supabase
      .from('clases')
      .update({
        id_guia_version_actual: newVersion.id,
        estado: 'editando_guia'
      })
      .eq('id', id_clase);

    if (updateError) {
      console.error('Error updating clase:', updateError);
      return createErrorResponse(updateError.message, 500);
    }

    return createSuccessResponse({
      guide: {
        objetivos: guideContent.objetivos,
        estructura: guideContent.estructura,
        preguntas_socraticas: guideContent.preguntas_socraticas,
      },
      version_numero: versionNumero,
      version_id: newVersion.id,
    });
  } catch (error) {
    console.error('Error in generar-guia-clase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(errorMessage, 500);
  }
});
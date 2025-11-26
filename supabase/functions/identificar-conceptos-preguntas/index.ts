import {
  authenticateProfesor,
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';
import { callAI, parseAIJSON } from '../_shared/ai.ts';

interface PreguntaInput {
  id: string;
  texto_pregunta: string;
  texto_contexto?: string | null;
}

interface ConceptoIdentificado {
  id_pregunta: string;
  concepto: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { supabase, profesor } = await authenticateProfesor(req, false);

    const { preguntas } = await req.json();

    if (!preguntas || !Array.isArray(preguntas) || preguntas.length === 0) {
      return createErrorResponse('Se requiere un array de preguntas', 400);
    }

    // Validar estructura de preguntas
    for (const pregunta of preguntas) {
      if (!pregunta.id || !pregunta.texto_pregunta) {
        return createErrorResponse('Cada pregunta debe tener id y texto_pregunta', 400);
      }
    }

    const systemPrompt = `Eres un experto en análisis pedagógico. Tu tarea es identificar el concepto principal que se está evaluando en cada pregunta de un quiz educativo.

Para cada pregunta, identifica UN SOLO concepto principal (máximo 3-4 palabras). El concepto debe ser específico y pedagógicamente relevante.

Ejemplos:
- "¿Cuál es la fórmula del área de un círculo?" → "Área del círculo"
- "Explica qué es la fotosíntesis" → "Fotosíntesis"
- "Resuelve: 2x + 5 = 15" → "Ecuaciones lineales"
- "¿Qué proceso permite a las plantas producir su alimento?" → "Fotosíntesis"

IMPORTANTE:
- El concepto debe ser conciso (máximo 4 palabras)
- Debe ser específico al contenido de la pregunta
- Si la pregunta es muy general, identifica el concepto más específico posible
- Responde SOLO con un JSON array válido, sin texto adicional`;

    const userPrompt = `Identifica el concepto principal de cada una de las siguientes preguntas:

${preguntas.map((p: PreguntaInput, index: number) => {
  let texto = `Pregunta ${index + 1} (ID: ${p.id}):\n${p.texto_pregunta}`;
  if (p.texto_contexto) {
    texto += `\nContexto: ${p.texto_contexto}`;
  }
  return texto;
}).join('\n\n')}

Responde SOLO con un JSON válido en este formato exacto:
{
  "conceptos": [
    {"id_pregunta": "uuid de la pregunta 1", "concepto": "concepto identificado 1"},
    {"id_pregunta": "uuid de la pregunta 2", "concepto": "concepto identificado 2"}
  ]
}`;

    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      responseFormat: 'json_object',
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Intentar parsear la respuesta
    let conceptos: ConceptoIdentificado[];
    
    try {
      const parsed = parseAIJSON<{ conceptos?: ConceptoIdentificado[] }>(aiResponse.content);
      
      // La IA debe devolver un objeto con la propiedad "conceptos"
      if (parsed.conceptos && Array.isArray(parsed.conceptos)) {
        conceptos = parsed.conceptos;
      } else if (Array.isArray(parsed)) {
        // Fallback: si devuelve array directamente
        conceptos = parsed;
      } else {
        // Intentar extraer el array del JSON string
        const jsonMatch = aiResponse.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          conceptos = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Formato de respuesta de IA no reconocido');
        }
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
      console.error('AI response content:', aiResponse.content);
      
      // Fallback: intentar extraer conceptos manualmente
      conceptos = preguntas.map((p: PreguntaInput) => ({
        id_pregunta: p.id,
        concepto: 'Concepto no identificado', // Fallback
      }));
    }

    // Validar que todos los conceptos estén presentes
    const conceptosMap = new Map<string, string>();
    for (const concepto of conceptos) {
      if (concepto.id_pregunta && concepto.concepto) {
        conceptosMap.set(concepto.id_pregunta, concepto.concepto.trim());
      }
    }

    // Asegurar que todas las preguntas tengan un concepto
    const resultado: ConceptoIdentificado[] = preguntas.map((p: PreguntaInput) => ({
      id_pregunta: p.id,
      concepto: conceptosMap.get(p.id) || 'Concepto no identificado',
    }));

    return createSuccessResponse({
      conceptos: resultado,
      total: resultado.length,
    });

  } catch (error) {
    console.error('Error en identificar-conceptos-preguntas:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return createErrorResponse(errorMessage, 500);
  }
});


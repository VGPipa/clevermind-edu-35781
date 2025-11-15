import { callAI } from '../_shared/ai.ts';
import {
  handleCors,
  createErrorResponse,
  createSuccessResponse,
} from '../_shared/auth.ts';

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return handleCors();
  }

  try {
    const { materia, grado, tema, duracion, objetivos, contextoAlumnos } = await req.json();
    
    console.log('Generando clase con parámetros:', { materia, grado, tema, duracion, objetivos });

    const systemPrompt = `Eres un experto pedagogo chileno especializado en crear guías de clase detalladas y efectivas. 
Tu tarea es generar una planificación completa de clase que incluya:

1. Inicio (10-15% del tiempo): Motivación y activación de conocimientos previos
2. Desarrollo (60-70% del tiempo): Actividades principales de aprendizaje
3. Cierre (15-20% del tiempo): Síntesis y evaluación

La guía debe ser práctica, alineada con el currículum chileno, e incluir estrategias diferenciadas cuando sea necesario.

Usa un formato estructurado con secciones claras y formato HTML simple para mejor legibilidad.`;

    const userPrompt = `Genera una guía de clase completa con la siguiente información:

**Materia:** ${materia}
**Grado:** ${grado}
**Tema:** ${tema}
**Duración:** ${duracion} minutos
**Objetivos de aprendizaje:** ${objetivos}
${contextoAlumnos ? `**Contexto de los alumnos:** ${contextoAlumnos}` : ''}

Por favor estructura la guía con:
- Objetivos específicos de la clase
- Materiales necesarios
- Desarrollo detallado (inicio, desarrollo, cierre)
- Actividades diferenciadas según niveles
- Estrategias de evaluación
- Preguntas clave para guiar el aprendizaje

Usa formato HTML simple con <strong>, <p>, <ul>, <li> para organizar la información.`;

    // Use AI helper for consistent error handling
    const aiResponse = await callAI({
      systemPrompt,
      userPrompt,
      model: 'google/gemini-2.5-flash',
      temperature: 0.7,
      maxTokens: 3000,
    });

    console.log('Guía generada exitosamente');

    return createSuccessResponse({
      materia,
      grado,
      tema,
      duracion,
      contenido: aiResponse.content,
    });

  } catch (error) {
    console.error('Error en generar-clase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al generar la clase';
    return createErrorResponse(errorMessage, 500);
  }
});

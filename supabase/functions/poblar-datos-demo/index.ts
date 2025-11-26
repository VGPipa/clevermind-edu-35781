import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';
import { corsHeaders } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🚀 Iniciando población de datos demo...');

    // 1. Limpiar datos demo anteriores (solo respuestas y calificaciones)
    console.log('🧹 Limpiando datos demo anteriores...');
    
    // Obtener quizzes del profesor
    const { data: allQuizzes, error: quizzesError } = await supabase
      .from('quizzes')
      .select('id, id_clase, tipo, titulo')
      .order('created_at', { ascending: true });

    if (quizzesError) throw quizzesError;
    
    // Filtrar solo quizzes demo
    const quizzes = allQuizzes?.filter(q => q.titulo.includes('[DEMO]')) || [];
    if (!quizzes || quizzes.length === 0) {
      throw new Error('No se encontraron quizzes demo');
    }

    console.log(`📋 Encontrados ${quizzes.length} quizzes demo`);

    // Obtener IDs de respuestas existentes
    const quizIds = quizzes.map(q => q.id);
    const { data: respuestasExistentes } = await supabase
      .from('respuestas_alumno')
      .select('id')
      .in('id_quiz', quizIds);

    if (respuestasExistentes && respuestasExistentes.length > 0) {
      const respuestaIds = respuestasExistentes.map(r => r.id);
      
      // Eliminar calificaciones
      await supabase.from('calificaciones').delete().in('id_respuesta_alumno', respuestaIds);
      // Eliminar respuestas detalle
      await supabase.from('respuestas_detalle').delete().in('id_respuesta_alumno', respuestaIds);
      // Eliminar respuestas alumno
      await supabase.from('respuestas_alumno').delete().in('id', respuestaIds);
      console.log('✅ Datos anteriores limpiados');
    }

    // Eliminar preguntas anteriores
    await supabase.from('preguntas').delete().in('id_quiz', quizIds);

    // 2. Definir preguntas PRE (5 preguntas)
    const preguntasPre = [
      {
        texto_pregunta: '¿Cuántos objetos hay en la imagen?',
        concepto: 'Conteo de objetos',
        opciones: [{ a: '5', b: '6', c: '7', d: '8' }],
        respuesta_correcta: 'c',
        justificacion: 'Al contar cada objeto individualmente, encontramos 7 elementos en total.',
        porcentaje_error: 8
      },
      {
        texto_pregunta: '¿Qué grupo tiene más elementos?',
        concepto: 'Comparación de cantidades',
        opciones: [{ a: 'Grupo A', b: 'Grupo B', c: 'Son iguales', d: 'No se puede saber' }],
        respuesta_correcta: 'a',
        justificacion: 'El Grupo A tiene 9 elementos mientras que el Grupo B tiene 6.',
        porcentaje_error: 25
      },
      {
        texto_pregunta: '¿Qué número va después del 15?',
        concepto: 'Orden numérico',
        opciones: [{ a: '14', b: '16', c: '17', d: '18' }],
        respuesta_correcta: 'b',
        justificacion: 'En la secuencia numérica, después del 15 viene el 16.',
        porcentaje_error: 45
      },
      {
        texto_pregunta: 'Si tienes 8 manzanas, ¿con qué número lo representas?',
        concepto: 'Representación numérica',
        opciones: [{ a: '7', b: '8', c: '9', d: '10' }],
        respuesta_correcta: 'b',
        justificacion: 'El número 8 representa ocho elementos.',
        porcentaje_error: 35
      },
      {
        texto_pregunta: '¿Qué número falta en la secuencia: 2, 4, __, 8?',
        concepto: 'Secuencias numéricas',
        opciones: [{ a: '5', b: '6', c: '7', d: '3' }],
        respuesta_correcta: 'b',
        justificacion: 'La secuencia aumenta de 2 en 2: 2, 4, 6, 8.',
        porcentaje_error: 18
      }
    ];

    // 3. Definir preguntas POST (10 preguntas - incluye las 5 anteriores + 5 nuevas)
    const preguntasPost = [
      ...preguntasPre,
      {
        texto_pregunta: 'Si tienes 5 caramelos y te dan 3 más, ¿cuántos tienes ahora?',
        concepto: 'Sumas básicas',
        opciones: [{ a: '7', b: '8', c: '9', d: '10' }],
        respuesta_correcta: 'b',
        justificacion: '5 + 3 = 8 caramelos en total.',
        porcentaje_error: 38
      },
      {
        texto_pregunta: 'Tienes 9 lápices y regalas 4, ¿cuántos te quedan?',
        concepto: 'Restas básicas',
        opciones: [{ a: '3', b: '4', c: '5', d: '6' }],
        respuesta_correcta: 'c',
        justificacion: '9 - 4 = 5 lápices quedan.',
        porcentaje_error: 42
      },
      {
        texto_pregunta: 'María tiene 6 galletas y Juan tiene 4. ¿Cuántas galletas tienen entre los dos?',
        concepto: 'Problemas de palabra',
        opciones: [{ a: '8', b: '9', c: '10', d: '11' }],
        respuesta_correcta: 'c',
        justificacion: '6 + 4 = 10 galletas en total.',
        porcentaje_error: 55
      },
      {
        texto_pregunta: 'El número 12 se puede escribir como:',
        concepto: 'Descomposición numérica',
        opciones: [{ a: '10 + 2', b: '10 + 1', c: '11 + 2', d: '9 + 2' }],
        respuesta_correcta: 'a',
        justificacion: '12 es igual a 10 + 2.',
        porcentaje_error: 15
      },
      {
        texto_pregunta: 'En el número 25, ¿cuál es el valor del dígito 2?',
        concepto: 'Valor posicional',
        opciones: [{ a: '2', b: '20', c: '25', d: '5' }],
        respuesta_correcta: 'b',
        justificacion: 'El 2 está en las decenas, por lo que vale 20.',
        porcentaje_error: 22
      }
    ];

    // 4. Insertar preguntas en cada quiz
    console.log('📝 Insertando preguntas...');
    let preguntasInsertadas = 0;

    for (const quiz of quizzes) {
      const preguntas = quiz.tipo === 'previo' ? preguntasPre : preguntasPost;
      
      for (let i = 0; i < preguntas.length; i++) {
        const p = preguntas[i];
        const { error: pregError } = await supabase.from('preguntas').insert({
          id_quiz: quiz.id,
          texto_pregunta: p.texto_pregunta,
          tipo: 'opcion_multiple',
          opciones: p.opciones,
          respuesta_correcta: p.respuesta_correcta,
          justificacion: p.justificacion,
          orden: i + 1
        });

        if (pregError) {
          console.error('❌ Error insertando pregunta:', pregError);
          throw pregError;
        }
        preguntasInsertadas++;
      }
    }

    console.log(`✅ ${preguntasInsertadas} preguntas insertadas`);

    // 5. Obtener preguntas insertadas con sus conceptos
    const { data: preguntasConIds, error: pregIdError } = await supabase
      .from('preguntas')
      .select('id, id_quiz, texto_pregunta, respuesta_correcta, orden')
      .in('id_quiz', quizIds)
      .order('id_quiz', { ascending: true })
      .order('orden', { ascending: true });

    if (pregIdError) throw pregIdError;

    // Mapear preguntas con sus conceptos y porcentajes de error
    const preguntasMap = new Map();
    for (const quiz of quizzes) {
      const preguntas = quiz.tipo === 'previo' ? preguntasPre : preguntasPost;
      const preguntasQuiz = preguntasConIds?.filter(p => p.id_quiz === quiz.id) || [];
      
      preguntasQuiz.forEach((pq, idx) => {
        preguntasMap.set(pq.id, {
          ...pq,
          concepto: preguntas[idx]?.concepto || 'Desconocido',
          porcentaje_error: preguntas[idx]?.porcentaje_error || 20
        });
      });
    }

    // 6. Obtener alumnos del grupo
    console.log('👥 Obteniendo alumnos...');
    const { data: clase } = await supabase
      .from('clases')
      .select('id_grupo')
      .eq('id', quizzes[0].id_clase)
      .single();

    if (!clase) throw new Error('No se encontró la clase');

    const { data: alumnosGrupo, error: alumnosError } = await supabase
      .from('alumnos_grupo')
      .select('id_alumno')
      .eq('id_grupo', clase.id_grupo);

    if (alumnosError) throw alumnosError;
    if (!alumnosGrupo || alumnosGrupo.length === 0) {
      throw new Error('No hay alumnos en el grupo');
    }

    const alumnoIds = alumnosGrupo.map(ag => ag.id_alumno);
    console.log(`✅ ${alumnoIds.length} alumnos encontrados`);

    // 7. Crear respuestas para cada alumno
    console.log('📊 Creando respuestas de alumnos...');
    let respuestasCreadas = 0;

    for (const quiz of quizzes) {
      const preguntasQuiz = preguntasConIds?.filter(p => p.id_quiz === quiz.id) || [];

      for (const alumnoId of alumnoIds) {
        // Crear respuesta_alumno
        const { data: respAlumno, error: respError } = await supabase
          .from('respuestas_alumno')
          .insert({
            id_quiz: quiz.id,
            id_alumno: alumnoId,
            estado: 'completado',
            fecha_inicio: new Date().toISOString(),
            fecha_envio: new Date().toISOString()
          })
          .select('id')
          .single();

        if (respError) {
          console.error('❌ Error creando respuesta:', respError);
          throw respError;
        }

        // Crear respuestas_detalle para cada pregunta
        let correctas = 0;
        for (const pregunta of preguntasQuiz) {
          const preguntaInfo = preguntasMap.get(pregunta.id);
          if (!preguntaInfo) continue;

          // Determinar si es correcta basado en el porcentaje de error
          const esCorrecta = Math.random() * 100 > preguntaInfo.porcentaje_error;
          if (esCorrecta) correctas++;

          await supabase.from('respuestas_detalle').insert({
            id_respuesta_alumno: respAlumno.id,
            id_pregunta: pregunta.id,
            respuesta_alumno: esCorrecta ? pregunta.respuesta_correcta : 'a',
            es_correcta: esCorrecta,
            tiempo_segundos: Math.floor(Math.random() * 60) + 30
          });
        }

        // Crear calificación
        const porcentaje = (correctas / preguntasQuiz.length) * 100;
        const nota = (porcentaje / 100) * 7; // Escala 1-7

        await supabase.from('calificaciones').insert({
          id_respuesta_alumno: respAlumno.id,
          porcentaje_aciertos: porcentaje,
          nota_numerica: nota
        });

        respuestasCreadas++;
      }
    }

    console.log(`✅ ${respuestasCreadas} respuestas creadas con éxito`);

    // 8. Verificar resultados
    const { data: stats } = await supabase
      .from('preguntas')
      .select('id_quiz')
      .in('id_quiz', quizIds);

    const preguntasPorQuiz = stats?.length || 0;

    console.log('🎉 Población completada exitosamente');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Datos demo poblados exitosamente',
        estadisticas: {
          quizzes: quizzes.length,
          preguntas: preguntasInsertadas,
          alumnos: alumnoIds.length,
          respuestas: respuestasCreadas
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error en poblar-datos-demo:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

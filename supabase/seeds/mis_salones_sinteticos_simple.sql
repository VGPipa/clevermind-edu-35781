-- Script completo para poblar datos sintéticos con respuestas detalladas
-- Incluye: Quizzes, Preguntas, Respuestas_alumno, Respuestas_detalle y Calificaciones calculadas

DO $$
DECLARE
  v_profesor_id UUID;
  v_clase_record RECORD;
  v_alumno_record RECORD;
  v_pregunta_record RECORD;
  v_quiz_pre_id UUID;
  v_quiz_post_id UUID;
  v_respuesta_pre_id UUID;
  v_respuesta_post_id UUID;
  v_estado TEXT;
  v_estado_post TEXT;
  v_seed_tag TEXT := '[DEMO]';
  v_clase_count INT := 0;
  
  -- Variables para generación de preguntas
  v_respuesta_correcta TEXT;
  v_opciones_incorrectas TEXT[];
  v_respuesta_alumno TEXT;
  
  -- Variables para cálculo de desempeño
  v_nivel_alumno NUMERIC;
  v_prob_acierto_pre NUMERIC;
  v_prob_acierto_post NUMERIC;
  v_mejora NUMERIC;
  v_es_correcta BOOLEAN;
  
  -- Variables para cálculo de calificaciones
  v_aciertos_pre INT;
  v_aciertos_post INT;
  v_porcentaje_pre NUMERIC;
  v_porcentaje_post NUMERIC;
  v_nota_pre NUMERIC;
  v_nota_post NUMERIC;
  
  -- Variables para tiempos
  v_tiempo_segundos INT;
BEGIN
  -- Obtener el primer profesor
  SELECT id INTO v_profesor_id FROM profesores LIMIT 1;
  
  IF v_profesor_id IS NULL THEN
    RAISE EXCEPTION 'No hay profesores en la base de datos';
  END IF;
  
  RAISE NOTICE 'Usando profesor: %', v_profesor_id;
  
  -- ========================================
  -- PASO 1: LIMPIEZA COMPLETA
  -- ========================================
  RAISE NOTICE 'Limpiando datos anteriores...';
  
  DELETE FROM calificaciones 
  WHERE id_respuesta_alumno IN (
    SELECT ra.id FROM respuestas_alumno ra
    JOIN quizzes q ON q.id = ra.id_quiz
    WHERE q.titulo LIKE v_seed_tag || '%'
  );
  
  DELETE FROM respuestas_detalle 
  WHERE id_respuesta_alumno IN (
    SELECT ra.id FROM respuestas_alumno ra
    JOIN quizzes q ON q.id = ra.id_quiz
    WHERE q.titulo LIKE v_seed_tag || '%'
  );
  
  DELETE FROM respuestas_alumno 
  WHERE id_quiz IN (
    SELECT id FROM quizzes WHERE titulo LIKE v_seed_tag || '%'
  );
  
  DELETE FROM preguntas 
  WHERE id_quiz IN (
    SELECT id FROM quizzes WHERE titulo LIKE v_seed_tag || '%'
  );
  
  DELETE FROM recomendaciones 
  WHERE contenido LIKE v_seed_tag || '%';
  
  DELETE FROM quizzes WHERE titulo LIKE v_seed_tag || '%';
  
  RAISE NOTICE 'Datos anteriores eliminados';
  
  -- ========================================
  -- PASO 2-6: PROCESAMIENTO POR CLASE
  -- ========================================
  
  -- Iterar sobre las clases más recientes del profesor (máximo 4)
  FOR v_clase_record IN (
    SELECT c.* 
    FROM clases c
    WHERE c.id_profesor = v_profesor_id
    ORDER BY c.created_at DESC
    LIMIT 4
  )
  LOOP
    v_clase_count := v_clase_count + 1;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Procesando clase % de 4: %', v_clase_count, v_clase_record.id;
    
    -- ========================================
    -- PASO 2: CREAR QUIZZES
    -- ========================================
    
    -- Quiz Previo
    INSERT INTO quizzes (
      id_clase, tipo, titulo, instrucciones,
      tiempo_limite, estado, fecha_disponible, fecha_limite
    ) VALUES (
      v_clase_record.id,
      'previo',
      v_seed_tag || ' Quiz Pre - Clase ' || v_clase_count,
      'Evaluación diagnóstica antes de la sesión',
      7,  -- 7 minutos
      'publicado',
      NOW() - INTERVAL '7 days',
      NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_quiz_pre_id;
    
    -- Quiz Post
    INSERT INTO quizzes (
      id_clase, tipo, titulo, instrucciones,
      tiempo_limite, estado, fecha_disponible, fecha_limite
    ) VALUES (
      v_clase_record.id,
      'post',
      v_seed_tag || ' Quiz Post - Clase ' || v_clase_count,
      'Evaluación sumativa después de la sesión',
      15,  -- 15 minutos
      'publicado',
      NOW() - INTERVAL '3 days',
      NOW() + INTERVAL '10 days'
    ) RETURNING id INTO v_quiz_post_id;
    
    RAISE NOTICE 'Quizzes creados: pre=%, post=%', v_quiz_pre_id, v_quiz_post_id;
    
    -- ========================================
    -- PASO 3: CREAR PREGUNTAS
    -- ========================================
    
    -- Preguntas para Quiz Previo (3 preguntas)
    FOR i IN 1..3 LOOP
      v_respuesta_correcta := (ARRAY['a', 'b', 'c', 'd'])[1 + floor(random() * 4)::int];
      
      INSERT INTO preguntas (
        id_quiz, tipo, texto_pregunta, opciones,
        respuesta_correcta, justificacion, orden
      ) VALUES (
        v_quiz_pre_id,
        'opcion_multiple',
        v_seed_tag || ' Pregunta ' || i || ' - Concepto fundamental del tema',
        jsonb_build_array(
          jsonb_build_object('id', 'a', 'texto', 'Opción A'),
          jsonb_build_object('id', 'b', 'texto', 'Opción B'),
          jsonb_build_object('id', 'c', 'texto', 'Opción C'),
          jsonb_build_object('id', 'd', 'texto', 'Opción D')
        ),
        v_respuesta_correcta,
        v_seed_tag || ' Justificación de la respuesta correcta',
        i
      );
    END LOOP;
    
    -- Preguntas para Quiz Post (10 preguntas)
    FOR i IN 1..10 LOOP
      v_respuesta_correcta := (ARRAY['a', 'b', 'c', 'd'])[1 + floor(random() * 4)::int];
      
      INSERT INTO preguntas (
        id_quiz, tipo, texto_pregunta, opciones,
        respuesta_correcta, justificacion, orden
      ) VALUES (
        v_quiz_post_id,
        'opcion_multiple',
        v_seed_tag || ' Pregunta ' || i || ' - Aplicación práctica del conocimiento',
        jsonb_build_array(
          jsonb_build_object('id', 'a', 'texto', 'Opción A'),
          jsonb_build_object('id', 'b', 'texto', 'Opción B'),
          jsonb_build_object('id', 'c', 'texto', 'Opción C'),
          jsonb_build_object('id', 'd', 'texto', 'Opción D')
        ),
        v_respuesta_correcta,
        v_seed_tag || ' Justificación de la respuesta correcta',
        i
      );
    END LOOP;
    
    RAISE NOTICE '13 preguntas creadas (3 previo + 10 post)';
    
    -- ========================================
    -- PASO 4-6: RESPUESTAS Y CALIFICACIONES POR ALUMNO
    -- ========================================
    
    FOR v_alumno_record IN (
      SELECT a.* 
      FROM alumnos a
      JOIN alumnos_grupo ag ON ag.id_alumno = a.id
      WHERE ag.id_grupo = v_clase_record.id_grupo
      ORDER BY a.nombre, a.apellido
    )
    LOOP
      -- ========================================
      -- DETERMINAR NIVEL DE DESEMPEÑO DEL ALUMNO
      -- ========================================
      
      -- Hash del ID para nivel consistente (0.0 - 1.0)
      v_nivel_alumno := (hashtext(v_alumno_record.id::text) % 100) / 100.0;
      
      -- Probabilidad de acierto en Quiz Previo (conocimiento previo)
      v_prob_acierto_pre := CASE
        WHEN v_nivel_alumno < 0.33 THEN 0.30 + random() * 0.20  -- Bajo: 30-50%
        WHEN v_nivel_alumno < 0.83 THEN 0.50 + random() * 0.20  -- Medio: 50-70%
        ELSE 0.70 + random() * 0.20                              -- Alto: 70-90%
      END;
      
      -- Probabilidad de acierto en Quiz Post (con mejora de 20-30%)
      v_mejora := 0.20 + random() * 0.10;
      v_prob_acierto_post := LEAST(0.95, v_prob_acierto_pre + v_mejora);
      
      -- ========================================
      -- QUIZ PREVIO
      -- ========================================
      
      -- Estado: 75% completados, 25% en progreso
      v_estado := CASE WHEN random() < 0.75 THEN 'completado' ELSE 'en_progreso' END;
      
      INSERT INTO respuestas_alumno (
        id_alumno, id_quiz, estado,
        fecha_inicio, fecha_envio
      ) VALUES (
        v_alumno_record.id,
        v_quiz_pre_id,
        v_estado,
        NOW() - INTERVAL '6 days' - (random() * INTERVAL '1 day'),
        CASE WHEN v_estado = 'completado' 
          THEN NOW() - INTERVAL '6 days' - (random() * INTERVAL '1 day')
          ELSE NULL 
        END
      ) RETURNING id INTO v_respuesta_pre_id;
      
      -- Generar respuestas detalladas si completó
      IF v_estado = 'completado' THEN
        v_aciertos_pre := 0;
        
        FOR v_pregunta_record IN (
          SELECT * FROM preguntas 
          WHERE id_quiz = v_quiz_pre_id 
          ORDER BY orden
        ) LOOP
          -- Determinar si acierta según probabilidad
          v_es_correcta := random() < v_prob_acierto_pre;
          
          -- Generar respuesta del alumno
          IF v_es_correcta THEN
            v_respuesta_alumno := v_pregunta_record.respuesta_correcta;
          ELSE
            -- Seleccionar opción incorrecta aleatoria
            v_opciones_incorrectas := ARRAY['a', 'b', 'c', 'd'];
            v_opciones_incorrectas := array_remove(v_opciones_incorrectas, v_pregunta_record.respuesta_correcta);
            v_respuesta_alumno := v_opciones_incorrectas[1 + floor(random() * 3)::int];
          END IF;
          
          -- Tiempo aleatorio: ~140 seg ± 30% (7 min / 3 preguntas)
          v_tiempo_segundos := GREATEST(10, ROUND(140 + (random() - 0.5) * 140 * 0.6));
          
          -- Insertar respuesta detallada
          INSERT INTO respuestas_detalle (
            id_respuesta_alumno,
            id_pregunta,
            respuesta_alumno,
            es_correcta,
            tiempo_segundos
          ) VALUES (
            v_respuesta_pre_id,
            v_pregunta_record.id,
            v_respuesta_alumno,
            v_es_correcta,
            v_tiempo_segundos
          );
          
          -- Contar aciertos
          IF v_es_correcta THEN
            v_aciertos_pre := v_aciertos_pre + 1;
          END IF;
        END LOOP;
        
        -- CALCULAR CALIFICACIÓN DESDE RESPUESTAS DETALLADAS
        v_porcentaje_pre := (v_aciertos_pre::NUMERIC / 3) * 100;  -- 3 preguntas
        v_nota_pre := ROUND((v_porcentaje_pre / 100.0) * 20, 2);  -- Escala 0-20
        
        INSERT INTO calificaciones (
          id_respuesta_alumno,
          nota_numerica,
          porcentaje_aciertos,
          retroalimentacion
        ) VALUES (
          v_respuesta_pre_id,
          v_nota_pre,
          v_porcentaje_pre,
          jsonb_build_object(
            'mensaje', 'Calificación calculada: ' || v_aciertos_pre || '/3 correctas',
            'aciertos', v_aciertos_pre,
            'errores', 3 - v_aciertos_pre,
            'fortalezas', ARRAY['Evaluación diagnóstica completada'],
            'areas_mejora', ARRAY['Reforzar conceptos antes de la clase']
          )
        );
      END IF;
      
      -- ========================================
      -- QUIZ POST
      -- ========================================
      
      -- Estado: 90% completados, 10% en progreso
      v_estado_post := CASE WHEN random() < 0.90 THEN 'completado' ELSE 'en_progreso' END;
      
      INSERT INTO respuestas_alumno (
        id_alumno, id_quiz, estado,
        fecha_inicio, fecha_envio
      ) VALUES (
        v_alumno_record.id,
        v_quiz_post_id,
        v_estado_post,
        NOW() - INTERVAL '2 days' - (random() * INTERVAL '1 day'),
        CASE WHEN v_estado_post = 'completado' 
          THEN NOW() - INTERVAL '2 days' - (random() * INTERVAL '1 day')
          ELSE NULL 
        END
      ) RETURNING id INTO v_respuesta_post_id;
      
      -- Generar respuestas detalladas si completó
      IF v_estado_post = 'completado' THEN
        v_aciertos_post := 0;
        
        FOR v_pregunta_record IN (
          SELECT * FROM preguntas 
          WHERE id_quiz = v_quiz_post_id 
          ORDER BY orden
        ) LOOP
          -- Determinar si acierta según probabilidad mejorada
          v_es_correcta := random() < v_prob_acierto_post;
          
          -- Generar respuesta del alumno
          IF v_es_correcta THEN
            v_respuesta_alumno := v_pregunta_record.respuesta_correcta;
          ELSE
            -- Seleccionar opción incorrecta aleatoria
            v_opciones_incorrectas := ARRAY['a', 'b', 'c', 'd'];
            v_opciones_incorrectas := array_remove(v_opciones_incorrectas, v_pregunta_record.respuesta_correcta);
            v_respuesta_alumno := v_opciones_incorrectas[1 + floor(random() * 3)::int];
          END IF;
          
          -- Tiempo aleatorio: ~90 seg ± 30% (15 min / 10 preguntas)
          v_tiempo_segundos := GREATEST(10, ROUND(90 + (random() - 0.5) * 90 * 0.6));
          
          -- Insertar respuesta detallada
          INSERT INTO respuestas_detalle (
            id_respuesta_alumno,
            id_pregunta,
            respuesta_alumno,
            es_correcta,
            tiempo_segundos
          ) VALUES (
            v_respuesta_post_id,
            v_pregunta_record.id,
            v_respuesta_alumno,
            v_es_correcta,
            v_tiempo_segundos
          );
          
          -- Contar aciertos
          IF v_es_correcta THEN
            v_aciertos_post := v_aciertos_post + 1;
          END IF;
        END LOOP;
        
        -- CALCULAR CALIFICACIÓN DESDE RESPUESTAS DETALLADAS
        v_porcentaje_post := (v_aciertos_post::NUMERIC / 10) * 100;  -- 10 preguntas
        v_nota_post := ROUND((v_porcentaje_post / 100.0) * 20, 2);   -- Escala 0-20
        
        INSERT INTO calificaciones (
          id_respuesta_alumno,
          nota_numerica,
          porcentaje_aciertos,
          retroalimentacion
        ) VALUES (
          v_respuesta_post_id,
          v_nota_post,
          v_porcentaje_post,
          jsonb_build_object(
            'mensaje', 'Calificación calculada: ' || v_aciertos_post || '/10 correctas',
            'aciertos', v_aciertos_post,
            'errores', 10 - v_aciertos_post,
            'mejora_porcentual', CASE 
              WHEN v_estado = 'completado' THEN ROUND(v_porcentaje_post - v_porcentaje_pre, 2)
              ELSE NULL
            END,
            'fortalezas', ARRAY['Mejora notable respecto al quiz previo', 'Buena comprensión de conceptos'],
            'areas_mejora', ARRAY['Continuar practicando ejercicios complejos']
          )
        );
      END IF;
      
    END LOOP;
    
    -- ========================================
    -- PASO 7: CREAR RECOMENDACIONES
    -- ========================================
    
    -- Recomendación basada en quiz previo
    INSERT INTO recomendaciones (
      id_clase, contenido, aplicada
    ) VALUES (
      v_clase_record.id,
      v_seed_tag || ' Reforzar conceptos básicos identificados en evaluación diagnóstica',
      false
    );
    
    -- Recomendación basada en clase anterior (si existe)
    IF v_clase_count > 1 THEN
      INSERT INTO recomendaciones (
        id_clase, id_clase_anterior, contenido, aplicada
      )
      SELECT 
        v_clase_record.id,
        c_ant.id,
        v_seed_tag || ' Revisar ejercicios prácticos de la sesión anterior',
        false
      FROM clases c_ant
      WHERE c_ant.id_profesor = v_profesor_id
        AND c_ant.id_tema = v_clase_record.id_tema
        AND c_ant.id != v_clase_record.id
      ORDER BY c_ant.created_at DESC
      LIMIT 1;
    END IF;
    
    RAISE NOTICE 'Clase % completada', v_clase_count;
    
  END LOOP;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Proceso completado. % clases procesadas', v_clase_count;
  RAISE NOTICE 'Datos sintéticos generados exitosamente';
  RAISE NOTICE '- Quizzes: % (previo + post)', v_clase_count * 2;
  RAISE NOTICE '- Preguntas: % total', v_clase_count * 13;
  RAISE NOTICE '- Respuestas con calificaciones calculadas desde respuestas_detalle';
  
END $$;

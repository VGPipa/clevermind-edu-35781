-- Script simplificado para poblar datos sintéticos en "Mis Salones"
-- Solo usa tablas y columnas existentes, sin retroalimentaciones

DO $$
DECLARE
  v_profesor_id UUID;
  v_clase_record RECORD;
  v_alumno_record RECORD;
  v_quiz_pre_id UUID;
  v_quiz_post_id UUID;
  v_respuesta_id UUID;
  v_nota NUMERIC;
  v_porcentaje NUMERIC;
  v_estado TEXT;
  v_seed_tag TEXT := '[DEMO]';
  v_clase_count INT := 0;
BEGIN
  -- Obtener el primer profesor
  SELECT id INTO v_profesor_id FROM profesores LIMIT 1;
  
  IF v_profesor_id IS NULL THEN
    RAISE EXCEPTION 'No hay profesores en la base de datos';
  END IF;
  
  RAISE NOTICE 'Usando profesor: %', v_profesor_id;
  
  -- Limpiar datos de demo anteriores
  DELETE FROM calificaciones 
  WHERE id_respuesta_alumno IN (
    SELECT ra.id FROM respuestas_alumno ra
    JOIN quizzes q ON q.id = ra.id_quiz
    WHERE q.titulo LIKE v_seed_tag || '%'
  );
  
  DELETE FROM respuestas_alumno 
  WHERE id_quiz IN (
    SELECT id FROM quizzes WHERE titulo LIKE v_seed_tag || '%'
  );
  
  DELETE FROM recomendaciones 
  WHERE contenido LIKE v_seed_tag || '%';
  
  DELETE FROM quizzes WHERE titulo LIKE v_seed_tag || '%';
  
  RAISE NOTICE 'Datos de demo anteriores eliminados';
  
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
    RAISE NOTICE 'Procesando clase: % (% de 4)', v_clase_record.id, v_clase_count;
    
    -- Crear Quiz Previo
    INSERT INTO quizzes (
      id_clase,
      tipo,
      titulo,
      instrucciones,
      tiempo_limite,
      estado,
      fecha_disponible,
      fecha_limite
    ) VALUES (
      v_clase_record.id,
      'previo',
      v_seed_tag || ' Quiz Pre - Clase ' || v_clase_count,
      'Evaluación diagnóstica antes de la sesión',
      30,
      'publicado',
      NOW() - INTERVAL '7 days',
      NOW() + INTERVAL '7 days'
    ) RETURNING id INTO v_quiz_pre_id;
    
    -- Crear Quiz Post
    INSERT INTO quizzes (
      id_clase,
      tipo,
      titulo,
      instrucciones,
      tiempo_limite,
      estado,
      fecha_disponible,
      fecha_limite
    ) VALUES (
      v_clase_record.id,
      'post',
      v_seed_tag || ' Quiz Post - Clase ' || v_clase_count,
      'Evaluación sumativa después de la sesión',
      30,
      'publicado',
      NOW() - INTERVAL '3 days',
      NOW() + INTERVAL '10 days'
    ) RETURNING id INTO v_quiz_post_id;
    
    RAISE NOTICE 'Quizzes creados: pre=%, post=%', v_quiz_pre_id, v_quiz_post_id;
    
    -- Crear respuestas para alumnos del grupo
    FOR v_alumno_record IN (
      SELECT a.* 
      FROM alumnos a
      JOIN alumnos_grupo ag ON ag.id_alumno = a.id
      WHERE ag.id_grupo = v_clase_record.id_grupo
      ORDER BY a.nombre, a.apellido
    )
    LOOP
      -- Respuesta Quiz Previo (75% completados, 25% en progreso)
      v_estado := CASE WHEN random() < 0.75 THEN 'completado' ELSE 'en_progreso' END;
      
      INSERT INTO respuestas_alumno (
        id_alumno,
        id_quiz,
        estado,
        fecha_inicio,
        fecha_envio
      ) VALUES (
        v_alumno_record.id,
        v_quiz_pre_id,
        v_estado,
        NOW() - INTERVAL '6 days' - (random() * INTERVAL '1 day'),
        CASE WHEN v_estado = 'completado' 
          THEN NOW() - INTERVAL '6 days' - (random() * INTERVAL '1 day')
          ELSE NULL 
        END
      ) RETURNING id INTO v_respuesta_id;
      
      -- Calificación si completado (escala peruana 0-20)
      IF v_estado = 'completado' THEN
        -- Generar porcentaje con distribución normal centrada en 60%
        v_porcentaje := GREATEST(20, LEAST(100, 60 + (random() - 0.5) * 50));
        -- Derivar nota en escala 0-20
        v_nota := ROUND((v_porcentaje / 100.0) * 20, 2);
        
        INSERT INTO calificaciones (
          id_respuesta_alumno,
          nota_numerica,
          porcentaje_aciertos,
          retroalimentacion
        ) VALUES (
          v_respuesta_id,
          v_nota,
          v_porcentaje,
          jsonb_build_object(
            'mensaje', 'Retroalimentación automática del quiz previo',
            'fortalezas', ARRAY['Buen desempeño en conceptos básicos'],
            'areas_mejora', ARRAY['Reforzar aplicación práctica']
          )
        );
      END IF;
      
      -- Respuesta Quiz Post (90% completados, 10% en progreso)
      v_estado := CASE WHEN random() < 0.90 THEN 'completado' ELSE 'en_progreso' END;
      
      INSERT INTO respuestas_alumno (
        id_alumno,
        id_quiz,
        estado,
        fecha_inicio,
        fecha_envio
      ) VALUES (
        v_alumno_record.id,
        v_quiz_post_id,
        v_estado,
        NOW() - INTERVAL '2 days' - (random() * INTERVAL '1 day'),
        CASE WHEN v_estado = 'completado' 
          THEN NOW() - INTERVAL '2 days' - (random() * INTERVAL '1 day')
          ELSE NULL 
        END
      ) RETURNING id INTO v_respuesta_id;
      
      -- Calificación si completado (escala peruana 0-20, mejor que pre)
      IF v_estado = 'completado' THEN
        -- Generar porcentaje con mejora: distribución centrada en 70%
        v_porcentaje := GREATEST(30, LEAST(100, 70 + (random() - 0.5) * 40));
        -- Derivar nota en escala 0-20
        v_nota := ROUND((v_porcentaje / 100.0) * 20, 2);
        
        INSERT INTO calificaciones (
          id_respuesta_alumno,
          nota_numerica,
          porcentaje_aciertos,
          retroalimentacion
        ) VALUES (
          v_respuesta_id,
          v_nota,
          v_porcentaje,
          jsonb_build_object(
            'mensaje', 'Retroalimentación automática del quiz post',
            'fortalezas', ARRAY['Mejora notable respecto al quiz previo', 'Buena comprensión de conceptos'],
            'areas_mejora', ARRAY['Continuar practicando ejercicios complejos']
          )
        );
      END IF;
    END LOOP;
    
    -- Crear recomendación basada en quiz previo (sin tipo ni id_quiz_pre)
    INSERT INTO recomendaciones (
      id_clase,
      contenido,
      aplicada
    ) VALUES (
      v_clase_record.id,
      v_seed_tag || ' Reforzar conceptos básicos identificados en evaluación diagnóstica',
      false
    );
    
    -- Crear recomendación basada en clase anterior (si existe)
    IF v_clase_count > 1 THEN
      INSERT INTO recomendaciones (
        id_clase,
        id_clase_anterior,
        contenido,
        aplicada
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
    
  END LOOP;
  
  RAISE NOTICE 'Proceso completado. % clases procesadas', v_clase_count;
  RAISE NOTICE 'Datos sintéticos generados exitosamente';
  
END $$;

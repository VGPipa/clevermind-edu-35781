-- Seed de datos sintéticos para Mis Salones (quizzes, respuestas, recomendaciones, retroalimentaciones)
-- Ejecutar en Supabase SQL Editor o psql conectado a la base.
-- El script reutiliza clases reales del primer profesor disponible y marca los registros con el prefijo [DEMO].

DO $$
DECLARE
  profesor_id uuid;
  clase RECORD;
  alumno RECORD;
  quiz_pre_id uuid;
  quiz_post_id uuid;
  respuesta_id uuid;
  pregunta_id uuid;
  nota numeric;
  porcentaje numeric;
  completado boolean;
  seed_tag text := 'mis_salones_demo';
  total_alumnos integer;
  respuestas_correctas integer;
  es_correcta boolean;
  concepto_idx integer;
  -- Distribución de rendimiento por concepto PRE (% incorrectas)
  pre_conceptos text[] := ARRAY['Conteo de objetos', 'Comparación de cantidades', 'Orden numérico', 'Representación numérica', 'Secuencias numéricas'];
  pre_incorrectas numeric[] := ARRAY[0.08, 0.25, 0.45, 0.35, 0.18];
  -- Distribución de rendimiento por concepto POST (% incorrectas)
  post_conceptos text[] := ARRAY['Conteo de objetos', 'Comparación de cantidades', 'Orden numérico', 'Representación numérica', 'Secuencias numéricas', 'Sumas básicas', 'Restas básicas', 'Problemas de palabra', 'Descomposición numérica', 'Valor posicional'];
  post_incorrectas numeric[] := ARRAY[0.05, 0.12, 0.08, 0.20, 0.10, 0.38, 0.42, 0.55, 0.15, 0.22];
BEGIN
  SELECT id INTO profesor_id
  FROM profesores
  ORDER BY created_at
  LIMIT 1;

  IF profesor_id IS NULL THEN
    RAISE NOTICE 'No se encontró profesor. Aborta seed.';
    RETURN;
  END IF;

  -- Limpia datos demo previos
  DELETE FROM calificaciones c
  USING respuestas_alumno ra, quizzes q
  WHERE c.id_respuesta_alumno = ra.id
    AND ra.id_quiz = q.id
    AND q.titulo LIKE '[DEMO]%';

  DELETE FROM respuestas_detalle rd
  USING respuestas_alumno ra, quizzes q
  WHERE rd.id_respuesta_alumno = ra.id
    AND ra.id_quiz = q.id
    AND q.titulo LIKE '[DEMO]%';

  DELETE FROM respuestas_alumno ra
  USING quizzes q
  WHERE ra.id_quiz = q.id
    AND q.titulo LIKE '[DEMO]%';

  DELETE FROM recomendaciones
  WHERE contenido LIKE '%mis_salones_demo%';

  DELETE FROM quizzes
  WHERE titulo LIKE '[DEMO]%';

  FOR clase IN
    SELECT
      c.*,
      g.nombre AS grupo_nombre,
      g.grado AS grupo_grado,
      g.seccion AS grupo_seccion
    FROM clases c
    JOIN grupos g ON g.id = c.id_grupo
    WHERE c.id_profesor = profesor_id
    ORDER BY COALESCE(c.fecha_programada, c.created_at) DESC
    LIMIT 4
  LOOP
    -- Quiz previo
    INSERT INTO quizzes (
      id,
      id_clase,
      tipo,
      estado,
      titulo,
      instrucciones,
      fecha_disponible,
      fecha_limite,
      tiempo_limite,
      tiempo_limite_minutos,
      max_preguntas,
      tipo_evaluacion,
      created_at,
      fecha_envio
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      'previo',
      'publicado',
      '[DEMO] Quiz Pre ' || COALESCE(clase.numero_sesion::text, '1'),
      'Evalúa conocimientos previos de la sesión ' || COALESCE(clase.numero_sesion::text, '1'),
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '4 days',
      20,
      15,
      5,
      'diagnostico',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '4 days'
    ) RETURNING id INTO quiz_pre_id;

    -- Crear 5 preguntas para el quiz PRE (Matemática - Números hasta 20)
    FOR concepto_idx IN 1..5 LOOP
      INSERT INTO preguntas (
        id,
        id_quiz,
        tipo,
        texto_pregunta,
        texto_contexto,
        opciones,
        respuesta_correcta,
        justificacion,
        orden
      ) VALUES (
        uuid_generate_v4(),
        quiz_pre_id,
        'opcion_multiple',
        CASE concepto_idx
          WHEN 1 THEN '¿Cuántas manzanas hay en la imagen?'
          WHEN 2 THEN '¿Cuál número es mayor: 8 o 14?'
          WHEN 3 THEN 'Ordena de menor a mayor: 17, 9, 13'
          WHEN 4 THEN '¿Qué número representa ●●●●● ●●●●● ●●●?'
          WHEN 5 THEN 'Completa la secuencia: 5, 10, ___, 20'
        END,
        CASE concepto_idx
          WHEN 1 THEN 'Matemática - Resuelve problemas de cantidad. Concepto: ' || pre_conceptos[concepto_idx]
          ELSE 'Matemática - Resuelve problemas de cantidad. Concepto: ' || pre_conceptos[concepto_idx]
        END,
        CASE concepto_idx
          WHEN 1 THEN '[{"valor": "A", "texto": "12"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "18"}, {"valor": "D", "texto": "20"}]'::jsonb
          WHEN 2 THEN '[{"valor": "A", "texto": "8"}, {"valor": "B", "texto": "14"}, {"valor": "C", "texto": "Son iguales"}, {"valor": "D", "texto": "No se puede saber"}]'::jsonb
          WHEN 3 THEN '[{"valor": "A", "texto": "9, 13, 17"}, {"valor": "B", "texto": "17, 13, 9"}, {"valor": "C", "texto": "13, 9, 17"}, {"valor": "D", "texto": "9, 17, 13"}]'::jsonb
          WHEN 4 THEN '[{"valor": "A", "texto": "13"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "17"}, {"valor": "D", "texto": "20"}]'::jsonb
          WHEN 5 THEN '[{"valor": "A", "texto": "12"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "17"}, {"valor": "D", "texto": "18"}]'::jsonb
        END,
        CASE concepto_idx
          WHEN 1 THEN 'B'
          WHEN 2 THEN 'B'
          WHEN 3 THEN 'A'
          WHEN 4 THEN 'B'
          WHEN 5 THEN 'B'
        END,
        CASE concepto_idx
          WHEN 1 THEN 'El conteo correcto muestra 15 manzanas. Es importante contar uno por uno sin repetir ni omitir objetos.'
          WHEN 2 THEN '14 es mayor que 8. Cuando comparamos números, el que está más a la derecha en la recta numérica es mayor.'
          WHEN 3 THEN 'El orden correcto de menor a mayor es 9, 13, 17. Ordenamos números ubicándolos en la recta numérica.'
          WHEN 4 THEN '15 puntos representan el número 15. Cada punto o símbolo representa una unidad.'
          WHEN 5 THEN 'La secuencia avanza de 5 en 5, por lo que 10 + 5 = 15.'
        END,
        concepto_idx
      );
    END LOOP;

    -- Quiz post
    INSERT INTO quizzes (
      id,
      id_clase,
      tipo,
      estado,
      titulo,
      instrucciones,
      fecha_disponible,
      fecha_limite,
      tiempo_limite,
      tiempo_limite_minutos,
      max_preguntas,
      tipo_evaluacion,
      created_at,
      fecha_envio
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      'post',
      'publicado',
      '[DEMO] Quiz Post ' || COALESCE(clase.numero_sesion::text, '1'),
      'Confirma el nivel de comprensión posterior a la sesión',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '1 days',
      30,
      25,
      10,
      'sumativo',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '1 days'
    ) RETURNING id INTO quiz_post_id;

    -- Crear 10 preguntas para el quiz POST (Matemática - Números hasta 20, más avanzado)
    FOR concepto_idx IN 1..10 LOOP
      INSERT INTO preguntas (
        id,
        id_quiz,
        tipo,
        texto_pregunta,
        texto_contexto,
        opciones,
        respuesta_correcta,
        justificacion,
        orden
      ) VALUES (
        uuid_generate_v4(),
        quiz_post_id,
        'opcion_multiple',
        CASE concepto_idx
          WHEN 1 THEN 'Cuenta los triángulos en la figura'
          WHEN 2 THEN '¿Cuántos más hay en el grupo A (12 objetos) que en el grupo B (7 objetos)?'
          WHEN 3 THEN '¿Qué número viene antes del 17?'
          WHEN 4 THEN 'Escribe el número que corresponde a: 1 decena y 5 unidades'
          WHEN 5 THEN 'Encuentra el número que falta: 8, 10, 12, ___, 16'
          WHEN 6 THEN '¿Cuánto es 9 + 7?'
          WHEN 7 THEN '¿Cuánto es 18 - 5?'
          WHEN 8 THEN 'María tiene 8 caramelos y le dan 6 más. ¿Cuántos tiene en total?'
          WHEN 9 THEN '¿Cómo se forma el número 14?'
          WHEN 10 THEN 'En el número 17, ¿cuántas decenas hay?'
        END,
        'Matemática - Resuelve problemas de cantidad. Concepto: ' || post_conceptos[concepto_idx],
        CASE concepto_idx
          WHEN 1 THEN '[{"valor": "A", "texto": "8"}, {"valor": "B", "texto": "10"}, {"valor": "C", "texto": "12"}, {"valor": "D", "texto": "14"}]'::jsonb
          WHEN 2 THEN '[{"valor": "A", "texto": "3"}, {"valor": "B", "texto": "5"}, {"valor": "C", "texto": "7"}, {"valor": "D", "texto": "19"}]'::jsonb
          WHEN 3 THEN '[{"valor": "A", "texto": "15"}, {"valor": "B", "texto": "16"}, {"valor": "C", "texto": "18"}, {"valor": "D", "texto": "19"}]'::jsonb
          WHEN 4 THEN '[{"valor": "A", "texto": "6"}, {"valor": "B", "texto": "14"}, {"valor": "C", "texto": "15"}, {"valor": "D", "texto": "51"}]'::jsonb
          WHEN 5 THEN '[{"valor": "A", "texto": "13"}, {"valor": "B", "texto": "14"}, {"valor": "C", "texto": "15"}, {"valor": "D", "texto": "17"}]'::jsonb
          WHEN 6 THEN '[{"valor": "A", "texto": "14"}, {"valor": "B", "texto": "15"}, {"valor": "C", "texto": "16"}, {"valor": "D", "texto": "17"}]'::jsonb
          WHEN 7 THEN '[{"valor": "A", "texto": "11"}, {"valor": "B", "texto": "12"}, {"valor": "C", "texto": "13"}, {"valor": "D", "texto": "23"}]'::jsonb
          WHEN 8 THEN '[{"valor": "A", "texto": "2"}, {"valor": "B", "texto": "12"}, {"valor": "C", "texto": "14"}, {"valor": "D", "texto": "16"}]'::jsonb
          WHEN 9 THEN '[{"valor": "A", "texto": "10 + 4"}, {"valor": "B", "texto": "5 + 5"}, {"valor": "C", "texto": "8 + 8"}, {"valor": "D", "texto": "7 + 5"}]'::jsonb
          WHEN 10 THEN '[{"valor": "A", "texto": "0"}, {"valor": "B", "texto": "1"}, {"valor": "C", "texto": "7"}, {"valor": "D", "texto": "17"}]'::jsonb
        END,
        CASE concepto_idx
          WHEN 1 THEN 'C'
          WHEN 2 THEN 'B'
          WHEN 3 THEN 'B'
          WHEN 4 THEN 'C'
          WHEN 5 THEN 'B'
          WHEN 6 THEN 'C'
          WHEN 7 THEN 'C'
          WHEN 8 THEN 'C'
          WHEN 9 THEN 'A'
          WHEN 10 THEN 'B'
        END,
        CASE concepto_idx
          WHEN 1 THEN 'Hay 12 triángulos en la figura. El conteo sistemático ayuda a no omitir ninguno.'
          WHEN 2 THEN 'Restamos para comparar: 12 - 7 = 5. Hay 5 objetos más en el grupo A.'
          WHEN 3 THEN 'El número anterior al 17 es 16. Los números se ordenan de menor a mayor en la recta numérica.'
          WHEN 4 THEN '1 decena (10) más 5 unidades es 15. El sistema decimal agrupa de 10 en 10.'
          WHEN 5 THEN 'La secuencia avanza de 2 en 2: 12 + 2 = 14.'
          WHEN 6 THEN '9 + 7 = 16. Podemos sumar descomponiendo: 9 + 1 + 6 = 10 + 6 = 16.'
          WHEN 7 THEN '18 - 5 = 13. Restamos contando hacia atrás desde 18.'
          WHEN 8 THEN '8 + 6 = 14 caramelos en total. Sumamos las cantidades para resolver el problema.'
          WHEN 9 THEN '14 se forma con 10 + 4. También podría ser 7 + 7, pero 10 + 4 muestra el valor posicional.'
          WHEN 10 THEN '17 tiene 1 decena (el 1 en la posición de las decenas representa 10).'
        END,
        concepto_idx
      );
    END LOOP;

    -- Respuestas y calificaciones por alumno del salón
    FOR alumno IN
      SELECT a.id, a.nombre, a.apellido
      FROM alumnos a
      JOIN alumnos_grupo ag ON ag.id_alumno = a.id
      WHERE ag.id_grupo = clase.id_grupo
    LOOP
      -- Quiz previo
      completado := random() > 0.25;
      INSERT INTO respuestas_alumno (
        id,
        id_quiz,
        id_alumno,
        estado,
        fecha_inicio,
        fecha_envio,
        created_at
      ) VALUES (
        uuid_generate_v4(),
        quiz_pre_id,
        alumno.id,
        CASE WHEN completado THEN 'completado'::estado_respuesta ELSE 'en_progreso'::estado_respuesta END,
        NOW() - INTERVAL '4 days',
        CASE WHEN completado THEN NOW() - INTERVAL '4 days' + INTERVAL '10 minutes' ELSE NULL END,
        NOW() - INTERVAL '4 days'
      ) RETURNING id INTO respuesta_id;

      IF completado THEN
        respuestas_correctas := 0;
        
        -- Crear respuestas detalladas para cada pregunta del PRE
        FOR concepto_idx IN 1..5 LOOP
          SELECT id INTO pregunta_id
          FROM preguntas
          WHERE id_quiz = quiz_pre_id AND orden = concepto_idx;
          
          -- Determinar si la respuesta es correcta según la distribución
          es_correcta := random() > pre_incorrectas[concepto_idx];
          
          IF es_correcta THEN
            respuestas_correctas := respuestas_correctas + 1;
          END IF;
          
          INSERT INTO respuestas_detalle (
            id,
            id_respuesta_alumno,
            id_pregunta,
            respuesta_alumno,
            es_correcta,
            tiempo_segundos
          ) VALUES (
            uuid_generate_v4(),
            respuesta_id,
            pregunta_id,
            CASE WHEN es_correcta THEN 
              (SELECT respuesta_correcta FROM preguntas WHERE id = pregunta_id)
            ELSE 
              CASE (random() * 3)::integer
                WHEN 0 THEN 'A'
                WHEN 1 THEN 'B'
                WHEN 2 THEN 'C'
                ELSE 'D'
              END
            END,
            es_correcta,
            (60 + random() * 120)::integer
          );
        END LOOP;
        
        -- Calcular porcentaje y nota basado en respuestas reales
        porcentaje := ROUND((respuestas_correctas::numeric / 5.0) * 100, 0);
        nota := ROUND((porcentaje / 100.0) * 20, 1);
        
        INSERT INTO calificaciones (
          id,
          id_respuesta_alumno,
          nota_numerica,
          porcentaje_aciertos,
          retroalimentacion
        ) VALUES (
          uuid_generate_v4(),
          respuesta_id,
          nota,
          porcentaje,
          jsonb_build_object(
            'seed_tag', seed_tag,
            'fortaleza', 'Explica conceptos base con claridad',
            'a_mejorar', 'Profundizar ejemplos cotidianos'
          )
        );
      END IF;

      -- Quiz post
      completado := random() > 0.1;
      INSERT INTO respuestas_alumno (
        id,
        id_quiz,
        id_alumno,
        estado,
        fecha_inicio,
        fecha_envio,
        created_at
      ) VALUES (
        uuid_generate_v4(),
        quiz_post_id,
        alumno.id,
        CASE WHEN completado THEN 'completado'::estado_respuesta ELSE 'en_progreso'::estado_respuesta END,
        NOW() - INTERVAL '1 days',
        CASE WHEN completado THEN NOW() - INTERVAL '1 days' + INTERVAL '12 minutes' ELSE NULL END,
        NOW() - INTERVAL '1 days'
      ) RETURNING id INTO respuesta_id;

      IF completado THEN
        respuestas_correctas := 0;
        
        -- Crear respuestas detalladas para cada pregunta del POST
        FOR concepto_idx IN 1..10 LOOP
          SELECT id INTO pregunta_id
          FROM preguntas
          WHERE id_quiz = quiz_post_id AND orden = concepto_idx;
          
          -- Determinar si la respuesta es correcta según la distribución
          es_correcta := random() > post_incorrectas[concepto_idx];
          
          IF es_correcta THEN
            respuestas_correctas := respuestas_correctas + 1;
          END IF;
          
          INSERT INTO respuestas_detalle (
            id,
            id_respuesta_alumno,
            id_pregunta,
            respuesta_alumno,
            es_correcta,
            tiempo_segundos
          ) VALUES (
            uuid_generate_v4(),
            respuesta_id,
            pregunta_id,
            CASE WHEN es_correcta THEN 
              (SELECT respuesta_correcta FROM preguntas WHERE id = pregunta_id)
            ELSE 
              CASE (random() * 3)::integer
                WHEN 0 THEN 'A'
                WHEN 1 THEN 'B'
                WHEN 2 THEN 'C'
                ELSE 'D'
              END
            END,
            es_correcta,
            (90 + random() * 180)::integer
          );
        END LOOP;
        
        -- Calcular porcentaje y nota basado en respuestas reales
        porcentaje := ROUND((respuestas_correctas::numeric / 10.0) * 100, 0);
        nota := ROUND((porcentaje / 100.0) * 20, 1);
        
        INSERT INTO calificaciones (
          id,
          id_respuesta_alumno,
          nota_numerica,
          porcentaje_aciertos,
          retroalimentacion
        ) VALUES (
          uuid_generate_v4(),
          respuesta_id,
          nota,
          porcentaje,
          jsonb_build_object(
            'seed_tag', seed_tag,
            'fortaleza', 'Resolución colaborativa',
            'a_mejorar', 'Uso del vocabulario clave'
          )
        );
      END IF;
    END LOOP;

    -- Recomendación a partir del quiz previo
    INSERT INTO recomendaciones (
      id,
      id_clase,
      id_clase_anterior,
      aplicada,
      contenido,
      created_at
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      NULL,
      FALSE,
      '[mis_salones_demo] Refuerza la activación de saberes previos con material visual. Incorporar ejemplos de la vida cotidiana antes de iniciar la práctica para mejorar la participación inicial.',
      NOW()
    );

    -- Recomendación ligada a clase anterior
    INSERT INTO recomendaciones (
      id,
      id_clase,
      id_clase_anterior,
      aplicada,
      contenido,
      created_at
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      NULL,
      random() > 0.5,
      '[mis_salones_demo] Planifica estaciones de trabajo para abordar diferentes ritmos. Crear 3 estaciones (lectura guiada, desafío lógico, reflexión) permite acompañar a alumnos en riesgo.',
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Seed demo de Mis Salones completado.';
END $$ LANGUAGE plpgsql;


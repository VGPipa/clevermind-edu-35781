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
  nota numeric;
  porcentaje numeric;
  completado boolean;
  seed_tag text := 'mis_salones_demo';
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
  WHERE contenido ->> 'seed_tag' = seed_tag;

  DELETE FROM retroalimentaciones
  WHERE contenido ->> 'seed_tag' = seed_tag;

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
      10,
      'diagnostico',
      NOW() - INTERVAL '5 days',
      NOW() - INTERVAL '4 days'
    ) RETURNING id INTO quiz_pre_id;

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
      25,
      20,
      12,
      'sumativo',
      NOW() - INTERVAL '2 days',
      NOW() - INTERVAL '1 days'
    ) RETURNING id INTO quiz_post_id;

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
        CASE WHEN completado THEN 'completado' ELSE 'en_progreso' END,
        NOW() - INTERVAL '4 days',
        CASE WHEN completado THEN NOW() - INTERVAL '4 days' + INTERVAL '10 minutes' ELSE NULL END,
        NOW() - INTERVAL '4 days'
      ) RETURNING id INTO respuesta_id;

      IF completado THEN
        nota := ROUND( (10 + random() * 4)::numeric, 1);
        porcentaje := ROUND( (45 + random() * 30)::numeric, 0);
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
        CASE WHEN completado THEN 'completado' ELSE 'en_progreso' END,
        NOW() - INTERVAL '1 days',
        CASE WHEN completado THEN NOW() - INTERVAL '1 days' + INTERVAL '12 minutes' ELSE NULL END,
        NOW() - INTERVAL '1 days'
      ) RETURNING id INTO respuesta_id;

      IF completado THEN
        nota := ROUND( (12 + random() * 7)::numeric, 1);
        porcentaje := ROUND( (60 + random() * 35)::numeric, 0);
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
      id_quiz_pre,
      tipo,
      aplicada,
      contenido,
      created_at
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      NULL,
      quiz_pre_id,
      'quiz_pre',
      FALSE,
      jsonb_build_object(
        'seed_tag', seed_tag,
        'resumen', 'Refuerza la activación de saberes previos con material visual',
        'accion', 'Incorporar ejemplos de la vida cotidiana antes de iniciar la práctica',
        'impacto', 'Mejora la participación inicial'
      ),
      NOW()
    );

    -- Recomendación ligada a clase anterior
    INSERT INTO recomendaciones (
      id,
      id_clase,
      id_clase_anterior,
      id_quiz_pre,
      tipo,
      aplicada,
      contenido,
      created_at
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      NULL,
      NULL,
      'clase_anterior',
      random() > 0.5,
      jsonb_build_object(
        'seed_tag', seed_tag,
        'resumen', 'Planifica estaciones de trabajo para abordar diferentes ritmos',
        'accion', 'Crear 3 estaciones (lectura guiada, desafío lógico, reflexión)',
        'impacto', 'Permite acompañar a alumnos en riesgo'
      ),
      NOW()
    );

    -- Retroalimentaciones para los alumnos con menor nota en el quiz post
    INSERT INTO retroalimentaciones (
      id,
      id_clase,
      id_quiz,
      tipo,
      id_alumno,
      contenido,
      generada_ia,
      enviada,
      fecha_envio,
      created_at
    )
    SELECT
      uuid_generate_v4(),
      clase.id,
      quiz_post_id,
      'alumno',
      ra.id_alumno,
      jsonb_build_object(
        'seed_tag', seed_tag,
        'resumen', 'Reforzar vocabulario clave y solicitar ejemplos propios',
        'mensaje', 'Practica explicar el concepto con tus palabras y tráelo a la próxima sesión'
      ),
      TRUE,
      TRUE,
      NOW(),
      NOW()
    FROM respuestas_alumno ra
    JOIN calificaciones c ON c.id_respuesta_alumno = ra.id
    WHERE ra.id_quiz = quiz_post_id
    ORDER BY c.nota_numerica ASC NULLS LAST
    LIMIT 3;

    -- Retroalimentación grupal
    INSERT INTO retroalimentaciones (
      id,
      id_clase,
      id_quiz,
      tipo,
      id_alumno,
      contenido,
      generada_ia,
      enviada,
      fecha_envio,
      created_at
    ) VALUES (
      uuid_generate_v4(),
      clase.id,
      quiz_post_id,
      'profesor_grupal',
      NULL,
      jsonb_build_object(
        'seed_tag', seed_tag,
        'fortalezas', 'Alta colaboración y escucha activa',
        'oportunidades', 'Recordar evidenciar procedimientos por escrito'
      ),
      TRUE,
      FALSE,
      NULL,
      NOW()
    );
  END LOOP;

  RAISE NOTICE 'Seed demo de Mis Salones completado.';
END $$ LANGUAGE plpgsql;


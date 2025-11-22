-- Script SQL simple para crear una clase sintética
-- Ejecutar en Supabase SQL Editor
-- Crea una clase en estado 'borrador' sin guía de sesión

INSERT INTO clases (
  id_tema,
  id_grupo,
  id_profesor,
  numero_sesion,
  fecha_programada,
  duracion_minutos,
  estado,
  contexto
)
SELECT 
  t.id as id_tema,
  g.id as id_grupo,
  p.id as id_profesor,
  1 as numero_sesion,
  (CURRENT_DATE + INTERVAL '7 days')::date as fecha_programada,
  90 as duracion_minutos,
  'borrador' as estado,
  'Contexto preliminar de prueba' as contexto
FROM temas t
CROSS JOIN grupos g
CROSS JOIN profesores p
LIMIT 1
RETURNING *;



-- Limpiar quizzes duplicados POST, manteniendo solo el más reciente por clase
WITH ranked_quizzes AS (
  SELECT 
    id,
    id_clase,
    tipo_evaluacion,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY id_clase, tipo_evaluacion 
      ORDER BY created_at DESC
    ) as rn
  FROM quizzes
  WHERE tipo_evaluacion IN ('pre', 'post')
)
DELETE FROM quizzes
WHERE id IN (
  SELECT id 
  FROM ranked_quizzes 
  WHERE rn > 1
);
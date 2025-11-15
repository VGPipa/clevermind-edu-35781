-- Eliminar foreign keys duplicados de asignaciones_profesor
-- Los foreign keys automáticos de Supabase son suficientes y evitan conflictos

ALTER TABLE asignaciones_profesor 
DROP CONSTRAINT IF EXISTS fk_asignaciones_profesor_profesor;

ALTER TABLE asignaciones_profesor 
DROP CONSTRAINT IF EXISTS fk_asignaciones_profesor_materia;

ALTER TABLE asignaciones_profesor 
DROP CONSTRAINT IF EXISTS fk_asignaciones_profesor_grupo;
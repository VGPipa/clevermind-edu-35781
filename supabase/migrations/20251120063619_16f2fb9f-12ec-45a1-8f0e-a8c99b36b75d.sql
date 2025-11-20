-- Permitir que user_id sea NULL en la tabla alumnos para datos sintéticos
ALTER TABLE alumnos ALTER COLUMN user_id DROP NOT NULL;
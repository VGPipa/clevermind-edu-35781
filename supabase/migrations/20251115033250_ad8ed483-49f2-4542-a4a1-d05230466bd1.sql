-- Agregar constraint UNIQUE para prevenir asignaciones duplicadas
ALTER TABLE asignaciones_profesor 
ADD CONSTRAINT unique_asignacion_profesor 
UNIQUE (id_profesor, id_materia, id_grupo, anio_escolar);

-- Agregar índices para mejorar performance en búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_id_profesor 
ON asignaciones_profesor(id_profesor);

CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_id_materia 
ON asignaciones_profesor(id_materia);

CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_anio_escolar 
ON asignaciones_profesor(anio_escolar);

CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_id_grupo 
ON asignaciones_profesor(id_grupo);

-- Índice compuesto para consultas que filtran por profesor y año
CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_profesor_anio 
ON asignaciones_profesor(id_profesor, anio_escolar);

-- Índice compuesto para consultas que filtran por materia y año
CREATE INDEX IF NOT EXISTS idx_asignaciones_profesor_materia_anio 
ON asignaciones_profesor(id_materia, anio_escolar);

-- Comentarios para documentar la estructura
COMMENT ON CONSTRAINT unique_asignacion_profesor ON asignaciones_profesor 
IS 'Previene asignaciones duplicadas del mismo profesor, materia y grupo en el mismo año escolar';
-- Agregar columnas nombre y apellido a la tabla alumnos
ALTER TABLE alumnos 
ADD COLUMN nombre text,
ADD COLUMN apellido text;
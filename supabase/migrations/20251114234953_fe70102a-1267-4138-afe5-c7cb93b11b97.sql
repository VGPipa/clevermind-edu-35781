-- Agregar foreign keys a la tabla asignaciones_profesor
ALTER TABLE public.asignaciones_profesor
ADD CONSTRAINT fk_asignaciones_profesor_profesor
FOREIGN KEY (id_profesor) REFERENCES public.profesores(id) ON DELETE CASCADE;

ALTER TABLE public.asignaciones_profesor
ADD CONSTRAINT fk_asignaciones_profesor_materia
FOREIGN KEY (id_materia) REFERENCES public.materias(id) ON DELETE CASCADE;

ALTER TABLE public.asignaciones_profesor
ADD CONSTRAINT fk_asignaciones_profesor_grupo
FOREIGN KEY (id_grupo) REFERENCES public.grupos(id) ON DELETE CASCADE;
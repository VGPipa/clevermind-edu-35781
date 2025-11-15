-- Migration: Tabla de retroalimentaciones y actualización de recomendaciones
-- Create enum for retroalimentacion types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_retroalimentacion') THEN
    CREATE TYPE public.tipo_retroalimentacion AS ENUM (
      'alumno',
      'profesor_individual',
      'profesor_grupal',
      'padre'
    );
  END IF;
END $$;

-- Create retroalimentaciones table
CREATE TABLE IF NOT EXISTS public.retroalimentaciones (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  id_clase uuid NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  id_quiz uuid REFERENCES public.quizzes(id) ON DELETE SET NULL,
  tipo public.tipo_retroalimentacion NOT NULL,
  id_alumno uuid REFERENCES public.alumnos(id) ON DELETE CASCADE,
  contenido jsonb NOT NULL DEFAULT '{}'::jsonb,
  generada_ia boolean DEFAULT true,
  fecha_generacion timestamp with time zone DEFAULT now(),
  enviada boolean DEFAULT false,
  fecha_envio timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  -- Constraint: id_alumno is required only for individual types
  CONSTRAINT check_alumno_required 
    CHECK (
      (tipo IN ('alumno', 'profesor_individual', 'padre') AND id_alumno IS NOT NULL) OR
      (tipo = 'profesor_grupal' AND id_alumno IS NULL)
    )
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_clase 
ON public.retroalimentaciones(id_clase);

CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_quiz 
ON public.retroalimentaciones(id_quiz);

CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_tipo 
ON public.retroalimentaciones(tipo);

CREATE INDEX IF NOT EXISTS idx_retroalimentaciones_alumno 
ON public.retroalimentaciones(id_alumno) 
WHERE id_alumno IS NOT NULL;

-- Create trigger for updated_at on retroalimentaciones
DROP TRIGGER IF EXISTS update_retroalimentaciones_updated_at ON public.retroalimentaciones;
CREATE TRIGGER update_retroalimentaciones_updated_at
  BEFORE UPDATE ON public.retroalimentaciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on retroalimentaciones
ALTER TABLE public.retroalimentaciones ENABLE ROW LEVEL SECURITY;

-- Profesores can view retroalimentaciones for their classes
CREATE POLICY "Profesores can view retroalimentaciones"
  ON public.retroalimentaciones
  FOR SELECT
  USING (
    id_clase IN (
      SELECT clases.id FROM clases
      WHERE clases.id_profesor IN (
        SELECT profesores.id FROM profesores
        WHERE profesores.user_id = auth.uid()
      )
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Alumnos can view their own retroalimentaciones
CREATE POLICY "Alumnos can view their retroalimentaciones"
  ON public.retroalimentaciones
  FOR SELECT
  USING (
    id_alumno IN (
      SELECT alumnos.id FROM alumnos
      WHERE alumnos.user_id = auth.uid()
    )
  );

-- Profesores can manage retroalimentaciones
CREATE POLICY "Profesores can manage retroalimentaciones"
  ON public.retroalimentaciones
  FOR ALL
  USING (
    id_clase IN (
      SELECT clases.id FROM clases
      WHERE clases.id_profesor IN (
        SELECT profesores.id FROM profesores
        WHERE profesores.user_id = auth.uid()
      )
    ) OR has_role(auth.uid(), 'admin'::app_role)
  );

-- Update recomendaciones table
ALTER TABLE public.recomendaciones
ADD COLUMN IF NOT EXISTS tipo text CHECK (tipo IN ('quiz_pre', 'clase_anterior')) DEFAULT 'clase_anterior',
ADD COLUMN IF NOT EXISTS id_quiz_pre uuid REFERENCES public.quizzes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS aplicada_a_version uuid REFERENCES public.guias_clase_versiones(id) ON DELETE SET NULL;

-- Create index for recomendaciones by tipo
CREATE INDEX IF NOT EXISTS idx_recomendaciones_tipo 
ON public.recomendaciones(tipo);

CREATE INDEX IF NOT EXISTS idx_recomendaciones_quiz_pre 
ON public.recomendaciones(id_quiz_pre) 
WHERE id_quiz_pre IS NOT NULL;

-- Update quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS tiempo_limite_minutos INTEGER,
ADD COLUMN IF NOT EXISTS max_preguntas INTEGER,
ADD COLUMN IF NOT EXISTS fecha_envio timestamp with time zone;

-- Update estado_quiz enum to include 'aprobado'
DO $$ 
BEGIN
  -- Check if 'aprobado' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'aprobado' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'estado_quiz')
  ) THEN
    -- Add 'aprobado' to the enum
    ALTER TYPE public.estado_quiz ADD VALUE 'aprobado';
  END IF;
END $$;

-- Create index for quizzes by fecha_envio
CREATE INDEX IF NOT EXISTS idx_quizzes_fecha_envio 
ON public.quizzes(fecha_envio) 
WHERE fecha_envio IS NOT NULL;


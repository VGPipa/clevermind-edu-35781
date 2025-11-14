-- Add missing fields to clases table
ALTER TABLE public.clases
ADD COLUMN IF NOT EXISTS duracion_minutos integer,
ADD COLUMN IF NOT EXISTS grupo_edad text,
ADD COLUMN IF NOT EXISTS metodologia text,
ADD COLUMN IF NOT EXISTS contexto text,
ADD COLUMN IF NOT EXISTS areas_transversales text[];

-- Update estado_clase enum if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_clase') THEN
    CREATE TYPE estado_clase AS ENUM ('borrador', 'preparada', 'en_progreso', 'completada');
  END IF;
END $$;

-- Modify guias_clase to include ai_generated flag
ALTER TABLE public.guias_clase
ADD COLUMN IF NOT EXISTS objetivos text,
ADD COLUMN IF NOT EXISTS estructura jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preguntas_socraticas jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS generada_ia boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Create trigger for updated_at on guias_clase
DROP TRIGGER IF EXISTS update_guias_clase_updated_at ON public.guias_clase;
CREATE TRIGGER update_guias_clase_updated_at
  BEFORE UPDATE ON public.guias_clase
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add tipo field to quizzes if not exists
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS tipo_evaluacion text CHECK (tipo_evaluacion IN ('pre', 'post'));

-- Create recommendations table
CREATE TABLE IF NOT EXISTS public.recomendaciones (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  id_clase uuid NOT NULL,
  id_clase_anterior uuid,
  contenido text NOT NULL,
  aplicada boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on recomendaciones
ALTER TABLE public.recomendaciones ENABLE ROW LEVEL SECURITY;

-- Profesores can view their recommendations
CREATE POLICY "Profesores can view their recomendaciones"
  ON public.recomendaciones
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

-- Profesores can manage their recommendations
CREATE POLICY "Profesores can manage recomendaciones"
  ON public.recomendaciones
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

-- Create class results table
CREATE TABLE IF NOT EXISTS public.resultados_clase (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  id_clase uuid NOT NULL,
  id_evaluacion uuid,
  cantidad_estudiantes integer,
  promedio_puntaje numeric,
  tasa_completacion numeric,
  nivel_comprension numeric,
  tasa_participacion numeric,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on resultados_clase
ALTER TABLE public.resultados_clase ENABLE ROW LEVEL SECURITY;

-- Profesores can view their class results
CREATE POLICY "Profesores can view their resultados_clase"
  ON public.resultados_clase
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

-- System can insert results
CREATE POLICY "System can insert resultados_clase"
  ON public.resultados_clase
  FOR INSERT
  WITH CHECK (true);
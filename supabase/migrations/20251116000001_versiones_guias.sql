-- Migration: Sistema de versiones para guias_clase
-- Create enum for guia version states
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'estado_version_guia') THEN
    CREATE TYPE public.estado_version_guia AS ENUM ('borrador', 'aprobada', 'final');
  END IF;
END $$;

-- Create guias_clase_versiones table
CREATE TABLE IF NOT EXISTS public.guias_clase_versiones (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  id_clase uuid NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  version_numero INTEGER NOT NULL,
  contenido jsonb NOT NULL DEFAULT '{}'::jsonb,
  objetivos text,
  estructura jsonb DEFAULT '[]'::jsonb,
  preguntas_socraticas jsonb DEFAULT '[]'::jsonb,
  recursos jsonb DEFAULT '{}'::jsonb,
  estado public.estado_version_guia DEFAULT 'borrador',
  aprobada_por uuid REFERENCES public.profesores(id),
  fecha_aprobacion timestamp with time zone,
  es_version_final boolean DEFAULT false,
  generada_ia boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT unique_version_per_clase UNIQUE (id_clase, version_numero)
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_guias_versiones_clase 
ON public.guias_clase_versiones(id_clase, version_numero);

CREATE INDEX IF NOT EXISTS idx_guias_versiones_estado 
ON public.guias_clase_versiones(id_clase, estado);

-- Add id_guia_version_actual to clases table
ALTER TABLE public.clases
ADD COLUMN IF NOT EXISTS id_guia_version_actual uuid REFERENCES public.guias_clase_versiones(id);

-- Create trigger for updated_at on guias_clase_versiones
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_guias_versiones_updated_at ON public.guias_clase_versiones;
CREATE TRIGGER update_guias_versiones_updated_at
  BEFORE UPDATE ON public.guias_clase_versiones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on guias_clase_versiones
ALTER TABLE public.guias_clase_versiones ENABLE ROW LEVEL SECURITY;

-- Profesores can view their guia versions
CREATE POLICY "Profesores can view their guia versions"
  ON public.guias_clase_versiones
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

-- Profesores can manage their guia versions
CREATE POLICY "Profesores can manage their guia versions"
  ON public.guias_clase_versiones
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

-- Migrate existing guias_clase data to first version
DO $$
DECLARE
  guia_record RECORD;
  nueva_version_id uuid;
BEGIN
  FOR guia_record IN 
    SELECT id, id_clase, contenido, objetivos, estructura, preguntas_socraticas, recursos, generada_ia, fecha_generacion
    FROM public.guias_clase
  LOOP
    -- Create first version
    INSERT INTO public.guias_clase_versiones (
      id_clase,
      version_numero,
      contenido,
      objetivos,
      estructura,
      preguntas_socraticas,
      recursos,
      estado,
      es_version_final,
      generada_ia,
      created_at
    ) VALUES (
      guia_record.id_clase,
      1,
      COALESCE(guia_record.contenido, '{}'::jsonb),
      guia_record.objetivos,
      COALESCE(guia_record.estructura, '[]'::jsonb),
      COALESCE(guia_record.preguntas_socraticas, '[]'::jsonb),
      COALESCE(guia_record.recursos, '{}'::jsonb),
      'aprobada', -- Assume existing guides are approved
      true, -- Assume existing guides are final
      COALESCE(guia_record.generada_ia, true),
      COALESCE(guia_record.fecha_generacion, now())
    ) RETURNING id INTO nueva_version_id;
    
    -- Update clase to reference this version
    UPDATE public.clases
    SET id_guia_version_actual = nueva_version_id
    WHERE id = guia_record.id_clase;
  END LOOP;
END $$;


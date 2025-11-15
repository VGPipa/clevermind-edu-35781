-- Create guias_clase_versiones table to support versioning
CREATE TABLE IF NOT EXISTS public.guias_clase_versiones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  id_clase UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  version_numero INTEGER NOT NULL DEFAULT 1,
  objetivos TEXT,
  estructura JSONB,
  preguntas_socraticas JSONB,
  contenido JSONB NOT NULL DEFAULT '{}'::jsonb,
  estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'aprobada', 'rechazada')),
  generada_ia BOOLEAN DEFAULT false,
  aprobada_por UUID REFERENCES public.profesores(id),
  fecha_aprobacion TIMESTAMP WITH TIME ZONE,
  es_version_final BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(id_clase, version_numero)
);

-- Add index for efficient queries
CREATE INDEX idx_guias_clase_versiones_id_clase ON public.guias_clase_versiones(id_clase);
CREATE INDEX idx_guias_clase_versiones_estado ON public.guias_clase_versiones(estado);

-- Enable RLS
ALTER TABLE public.guias_clase_versiones ENABLE ROW LEVEL SECURITY;

-- Add column to clases to reference current version
ALTER TABLE public.clases 
ADD COLUMN IF NOT EXISTS id_guia_version_actual UUID REFERENCES public.guias_clase_versiones(id);

-- Add numero_sesion column to clases if not exists
ALTER TABLE public.clases 
ADD COLUMN IF NOT EXISTS numero_sesion INTEGER;

-- Create index for session queries
CREATE INDEX IF NOT EXISTS idx_clases_numero_sesion ON public.clases(id_profesor, id_tema, id_grupo, numero_sesion);

-- RLS Policies for guias_clase_versiones
-- Professors can view versions of their own classes
CREATE POLICY "Profesores pueden ver versiones de sus propias clases" 
ON public.guias_clase_versiones 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clases c
    INNER JOIN public.profesores p ON c.id_profesor = p.id
    WHERE c.id = guias_clase_versiones.id_clase
    AND p.user_id = auth.uid()
  )
);

-- Professors can insert versions for their own classes
CREATE POLICY "Profesores pueden crear versiones de sus propias clases" 
ON public.guias_clase_versiones 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clases c
    INNER JOIN public.profesores p ON c.id_profesor = p.id
    WHERE c.id = guias_clase_versiones.id_clase
    AND p.user_id = auth.uid()
  )
);

-- Professors can update versions of their own classes
CREATE POLICY "Profesores pueden actualizar versiones de sus propias clases" 
ON public.guias_clase_versiones 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clases c
    INNER JOIN public.profesores p ON c.id_profesor = p.id
    WHERE c.id = guias_clase_versiones.id_clase
    AND p.user_id = auth.uid()
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_guias_clase_versiones_updated_at
BEFORE UPDATE ON public.guias_clase_versiones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing guias_clase to versiones
INSERT INTO public.guias_clase_versiones (
  id_clase,
  version_numero,
  objetivos,
  estructura,
  preguntas_socraticas,
  contenido,
  generada_ia,
  estado,
  created_at,
  updated_at
)
SELECT 
  id_clase,
  1 as version_numero,
  objetivos,
  estructura,
  preguntas_socraticas,
  contenido,
  generada_ia,
  'aprobada' as estado,
  fecha_generacion,
  updated_at
FROM public.guias_clase
ON CONFLICT (id_clase, version_numero) DO NOTHING;

-- Update clases to reference the migrated versions
UPDATE public.clases c
SET id_guia_version_actual = gv.id
FROM public.guias_clase_versiones gv
WHERE gv.id_clase = c.id 
  AND gv.version_numero = 1
  AND c.id_guia_version_actual IS NULL;
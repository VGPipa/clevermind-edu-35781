-- Migration: Add numero_sesion to clases and update estado_clase enum
-- Add numero_sesion field to clases table
ALTER TABLE public.clases
ADD COLUMN IF NOT EXISTS numero_sesion INTEGER;

-- Create index for efficient queries by tema and sesion
CREATE INDEX IF NOT EXISTS idx_clases_tema_sesion 
ON public.clases(id_tema, numero_sesion);

-- Create unique constraint to prevent duplicate sesiones for same tema+grupo+profesor
CREATE UNIQUE INDEX IF NOT EXISTS idx_clases_tema_grupo_sesion_unique
ON public.clases(id_tema, id_grupo, id_profesor, numero_sesion)
WHERE numero_sesion IS NOT NULL;

-- Drop existing estado_clase enum if it exists (we'll recreate it with all values)
-- First, we need to alter the column to use text temporarily
DO $$ 
BEGIN
  -- Check if estado_clase column exists and is using the enum
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'clases' 
    AND column_name = 'estado'
  ) THEN
    -- Change column type to text temporarily
    ALTER TABLE public.clases ALTER COLUMN estado TYPE text;
  END IF;
  
  -- Drop the old enum type
  DROP TYPE IF EXISTS public.estado_clase CASCADE;
END $$;

-- Create new estado_clase enum with all required states
CREATE TYPE public.estado_clase AS ENUM (
  'borrador',
  'generando_clase',
  'editando_guia',
  'guia_aprobada',
  'quiz_pre_enviado',
  'analizando_quiz_pre',
  'modificando_guia',
  'guia_final',
  'clase_programada',
  'en_clase',
  'quiz_post_enviado',
  'analizando_resultados',
  'completada',
  'preparada',
  'en_progreso',
  'programada',
  'ejecutada',
  'cancelada'
);

-- Change estado column back to enum type
ALTER TABLE public.clases 
ALTER COLUMN estado TYPE public.estado_clase 
USING estado::public.estado_clase;

-- Set default for numero_sesion to 1 for existing records
UPDATE public.clases 
SET numero_sesion = 1 
WHERE numero_sesion IS NULL;


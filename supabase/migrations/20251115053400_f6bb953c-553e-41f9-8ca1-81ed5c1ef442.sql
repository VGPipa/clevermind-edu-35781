-- Drop existing enum constraint and recreate with all necessary states
-- First, temporarily remove the enum constraint
ALTER TABLE public.clases ALTER COLUMN estado TYPE TEXT;

-- Drop the old enum type
DROP TYPE IF EXISTS public.estado_clase CASCADE;

-- Create new comprehensive enum with all workflow states
CREATE TYPE public.estado_clase AS ENUM (
  -- Initial creation states
  'borrador',              -- Class created, no guide yet
  'generando_clase',       -- AI generating initial class structure
  
  -- Guide editing states
  'editando_guia',         -- Professor editing the generated guide
  'guia_aprobada',         -- Guide approved by professor
  
  -- Pre-quiz states
  'quiz_pre_generando',    -- Generating pre-quiz
  'quiz_pre_enviado',      -- Pre-quiz sent to students
  'analizando_quiz_pre',   -- Analyzing pre-quiz results
  
  -- Guide modification based on pre-quiz
  'modificando_guia',      -- Modifying guide based on pre-quiz analysis
  'guia_final',            -- Final guide ready after modifications
  
  -- Class execution states  
  'clase_programada',      -- Class is scheduled and ready
  'en_clase',              -- Class is currently happening
  
  -- Post-quiz states
  'quiz_post_generando',   -- Generating post-quiz
  'quiz_post_enviado',     -- Post-quiz sent to students
  'analizando_resultados', -- Analyzing final results
  
  -- Final states
  'completada',            -- Class fully completed with all evaluations
  
  -- Legacy states for compatibility
  'programada',            -- Legacy: scheduled
  'ejecutada',             -- Legacy: executed  
  'cancelada'              -- Cancelled class
);

-- Apply the new enum type to the column
ALTER TABLE public.clases ALTER COLUMN estado TYPE public.estado_clase USING estado::text::public.estado_clase;

-- Set default value
ALTER TABLE public.clases ALTER COLUMN estado SET DEFAULT 'borrador'::public.estado_clase;

-- Update existing records with old states to new equivalents
UPDATE public.clases 
SET estado = 'clase_programada'::public.estado_clase 
WHERE estado = 'programada'::public.estado_clase;

UPDATE public.clases 
SET estado = 'completada'::public.estado_clase 
WHERE estado = 'ejecutada'::public.estado_clase;

-- Create index for better performance on estado queries
CREATE INDEX IF NOT EXISTS idx_clases_estado ON public.clases(estado);

-- Add comment documenting the workflow
COMMENT ON TYPE public.estado_clase IS 'Estados del flujo completo de una clase:
1. borrador -> generando_clase
2. editando_guia -> guia_aprobada
3. quiz_pre_generando -> quiz_pre_enviado -> analizando_quiz_pre
4. modificando_guia -> guia_final
5. clase_programada -> en_clase
6. quiz_post_generando -> quiz_post_enviado -> analizando_resultados
7. completada (final)';
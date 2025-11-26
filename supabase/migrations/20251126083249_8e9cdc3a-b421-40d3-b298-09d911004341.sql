-- Add es_tema_temporal column to temas table
-- This allows marking themes created on-the-fly for extraordinary classes
ALTER TABLE public.temas 
ADD COLUMN es_tema_temporal boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.temas.es_tema_temporal IS 'Indicates if this theme was created temporarily for an extraordinary class without pre-defined curriculum';
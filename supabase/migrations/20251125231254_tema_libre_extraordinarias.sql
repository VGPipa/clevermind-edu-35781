-- Permitir id_guia_tema nullable para clases extraordinarias sin guía
ALTER TABLE public.clases ALTER COLUMN id_guia_tema DROP NOT NULL;

-- Agregar campo para tema libre
ALTER TABLE public.clases ADD COLUMN IF NOT EXISTS tema_libre TEXT;

-- Agregar flag en temas para identificar temporales
ALTER TABLE public.temas ADD COLUMN IF NOT EXISTS es_tema_temporal BOOLEAN DEFAULT FALSE;


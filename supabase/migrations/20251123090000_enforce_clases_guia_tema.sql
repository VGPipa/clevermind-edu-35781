-- Backfill id_guia_tema para clases existentes tomando la guía del mismo tema/profesor
UPDATE public.clases AS c
SET
  id_guia_tema = gt.id,
  total_sesiones_tema = COALESCE(c.total_sesiones_tema, gt.total_sesiones)
FROM public.guias_tema AS gt
WHERE
  c.id_tema = gt.id_tema
  AND c.id_profesor = gt.id_profesor
  AND c.id_guia_tema IS NULL;

-- Validar que no queden clases sin id_guia_tema antes de aplicar la restricción
DO $$
DECLARE
  remaining integer;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM public.clases
  WHERE id_guia_tema IS NULL;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Aún existen % clases sin id_guia_tema. Complete los datos antes de continuar.', remaining;
  END IF;
END $$;

-- Asegurar la relación obligatoria entre clases y guías maestras
ALTER TABLE public.clases
  ALTER COLUMN id_guia_tema SET NOT NULL;


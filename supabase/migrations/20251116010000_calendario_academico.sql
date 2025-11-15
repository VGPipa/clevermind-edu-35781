-- Migration: Calendario Académico - Años Escolares y Periodos Académicos
-- Create table for academic years
CREATE TABLE IF NOT EXISTS public.anios_escolares (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_fechas_validas CHECK (fecha_fin > fecha_inicio)
);

-- Create table for academic periods (bimestres/trimestres)
CREATE TABLE IF NOT EXISTS public.periodos_academicos (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  id_anio_escolar UUID REFERENCES public.anios_escolares(id) ON DELETE CASCADE NOT NULL,
  numero INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_fechas_periodo_validas CHECK (fecha_fin > fecha_inicio),
  CONSTRAINT unique_periodo_anio UNIQUE (id_anio_escolar, numero)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_anios_escolares_institucion 
ON public.anios_escolares(id_institucion);

CREATE INDEX IF NOT EXISTS idx_anios_escolares_activo 
ON public.anios_escolares(id_institucion, activo) 
WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_periodos_academicos_anio 
ON public.periodos_academicos(id_anio_escolar);

CREATE INDEX IF NOT EXISTS idx_periodos_academicos_activo 
ON public.periodos_academicos(id_anio_escolar, activo) 
WHERE activo = true;

-- Create trigger for updated_at on anios_escolares
CREATE OR REPLACE FUNCTION public.update_anio_escolar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_anios_escolares_updated_at ON public.anios_escolares;
CREATE TRIGGER update_anios_escolares_updated_at
  BEFORE UPDATE ON public.anios_escolares
  FOR EACH ROW
  EXECUTE FUNCTION public.update_anio_escolar_updated_at();

-- Create trigger for updated_at on periodos_academicos
DROP TRIGGER IF EXISTS update_periodos_academicos_updated_at ON public.periodos_academicos;
CREATE TRIGGER update_periodos_academicos_updated_at
  BEFORE UPDATE ON public.periodos_academicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to ensure only one active year per institution
CREATE OR REPLACE FUNCTION public.ensure_single_active_anio_escolar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.activo = true THEN
    -- Deactivate all other years for this institution
    UPDATE public.anios_escolares
    SET activo = false
    WHERE id_institucion = NEW.id_institucion
      AND id != NEW.id
      AND activo = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_single_active_anio_escolar ON public.anios_escolares;
CREATE TRIGGER trigger_single_active_anio_escolar
  BEFORE INSERT OR UPDATE ON public.anios_escolares
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_active_anio_escolar();

-- Enable RLS on anios_escolares
ALTER TABLE public.anios_escolares ENABLE ROW LEVEL SECURITY;

-- Admins can view all years in their institution
CREATE POLICY "Admins can view anios_escolares"
  ON public.anios_escolares
  FOR SELECT
  USING (
    id_institucion IN (
      SELECT id_institucion FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Admins can manage years in their institution
CREATE POLICY "Admins can manage anios_escolares"
  ON public.anios_escolares
  FOR ALL
  USING (
    id_institucion IN (
      SELECT id_institucion FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Enable RLS on periodos_academicos
ALTER TABLE public.periodos_academicos ENABLE ROW LEVEL SECURITY;

-- Admins can view periods for years in their institution
CREATE POLICY "Admins can view periodos_academicos"
  ON public.periodos_academicos
  FOR SELECT
  USING (
    id_anio_escolar IN (
      SELECT id FROM public.anios_escolares
      WHERE id_institucion IN (
        SELECT id_institucion FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'::app_role
      )
    )
  );

-- Admins can manage periods for years in their institution
CREATE POLICY "Admins can manage periodos_academicos"
  ON public.periodos_academicos
  FOR ALL
  USING (
    id_anio_escolar IN (
      SELECT id FROM public.anios_escolares
      WHERE id_institucion IN (
        SELECT id_institucion FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'::app_role
      )
    )
  );

-- Add columns to clases table
ALTER TABLE public.clases
ADD COLUMN IF NOT EXISTS id_anio_escolar UUID REFERENCES public.anios_escolares(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS id_periodo_academico UUID REFERENCES public.periodos_academicos(id) ON DELETE SET NULL;

-- Create indexes for clases
CREATE INDEX IF NOT EXISTS idx_clases_anio_escolar 
ON public.clases(id_anio_escolar) 
WHERE id_anio_escolar IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clases_periodo_academico 
ON public.clases(id_periodo_academico) 
WHERE id_periodo_academico IS NOT NULL;


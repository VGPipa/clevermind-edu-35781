-- Migration: Configuración de Alertas
-- Create table for alert configuration
CREATE TABLE IF NOT EXISTS public.configuracion_alertas (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE NOT NULL,
  rango_dias_clases_pendientes INTEGER DEFAULT 60 NOT NULL,
  dias_urgente INTEGER DEFAULT 2 NOT NULL,
  dias_proxima INTEGER DEFAULT 5 NOT NULL,
  dias_programada INTEGER DEFAULT 14 NOT NULL,
  dias_lejana INTEGER DEFAULT 999 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_config_per_institucion UNIQUE (id_institucion),
  CONSTRAINT check_rangos_positivos CHECK (
    rango_dias_clases_pendientes > 0 AND
    dias_urgente > 0 AND
    dias_proxima > 0 AND
    dias_programada > 0 AND
    dias_lejana > 0
  ),
  CONSTRAINT check_rangos_orden CHECK (
    dias_urgente <= dias_proxima AND
    dias_proxima <= dias_programada AND
    dias_programada <= dias_lejana
  )
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_configuracion_alertas_institucion 
ON public.configuracion_alertas(id_institucion);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_configuracion_alertas_updated_at ON public.configuracion_alertas;
CREATE TRIGGER update_configuracion_alertas_updated_at
  BEFORE UPDATE ON public.configuracion_alertas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on configuracion_alertas
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;

-- Admins can view configuration for their institution
CREATE POLICY "Admins can view configuracion_alertas"
  ON public.configuracion_alertas
  FOR SELECT
  USING (
    id_institucion IN (
      SELECT id_institucion FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Admins can manage configuration for their institution
CREATE POLICY "Admins can manage configuracion_alertas"
  ON public.configuracion_alertas
  FOR ALL
  USING (
    id_institucion IN (
      SELECT id_institucion FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Profesores can view configuration for their institution (read-only)
CREATE POLICY "Profesores can view configuracion_alertas"
  ON public.configuracion_alertas
  FOR SELECT
  USING (
    id_institucion IN (
      SELECT id_institucion FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'profesor'::app_role
    )
  );


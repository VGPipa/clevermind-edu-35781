-- Create anios_escolares table
CREATE TABLE public.anios_escolares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_institucion UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  anio_escolar TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id_institucion, anio_escolar)
);

-- Enable RLS
ALTER TABLE public.anios_escolares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for anios_escolares
CREATE POLICY "Admins can manage anios escolares"
ON public.anios_escolares
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their institution's anios escolares"
ON public.anios_escolares
FOR SELECT
USING (id_institucion = get_user_institucion(auth.uid()));

-- Create periodos_academicos table
CREATE TABLE public.periodos_academicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_anio_escolar UUID NOT NULL REFERENCES public.anios_escolares(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  numero INTEGER NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  activo BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id_anio_escolar, numero)
);

-- Enable RLS
ALTER TABLE public.periodos_academicos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for periodos_academicos
CREATE POLICY "Admins can manage periodos academicos"
ON public.periodos_academicos
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view periodos academicos"
ON public.periodos_academicos
FOR SELECT
USING (
  id_anio_escolar IN (
    SELECT id FROM public.anios_escolares
    WHERE id_institucion = get_user_institucion(auth.uid())
  )
);

-- Create configuracion_alertas table
CREATE TABLE public.configuracion_alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_institucion UUID NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  rango_dias_clases_pendientes INTEGER DEFAULT 60,
  dias_urgente INTEGER DEFAULT 2,
  dias_proxima INTEGER DEFAULT 5,
  dias_programada INTEGER DEFAULT 14,
  dias_lejana INTEGER DEFAULT 999,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(id_institucion)
);

-- Enable RLS
ALTER TABLE public.configuracion_alertas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for configuracion_alertas
CREATE POLICY "Admins can manage configuracion alertas"
ON public.configuracion_alertas
FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their institution's configuracion alertas"
ON public.configuracion_alertas
FOR SELECT
USING (id_institucion = get_user_institucion(auth.uid()));
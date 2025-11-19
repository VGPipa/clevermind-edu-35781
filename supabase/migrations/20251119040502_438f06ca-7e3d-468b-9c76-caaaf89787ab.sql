-- Crear tabla guias_tema para almacenar guías maestras por tema
CREATE TABLE IF NOT EXISTS public.guias_tema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_tema UUID NOT NULL REFERENCES public.temas(id) ON DELETE CASCADE,
  id_profesor UUID NOT NULL REFERENCES public.profesores(id) ON DELETE CASCADE,
  contenido JSONB NOT NULL DEFAULT '{}'::jsonb,
  estructura_sesiones JSONB DEFAULT '[]'::jsonb,
  metodologias TEXT[],
  contexto_grupo TEXT,
  total_sesiones INTEGER NOT NULL,
  objetivos_generales TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.guias_tema ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para guias_tema
CREATE POLICY "Profesores pueden ver sus guías maestras"
  ON public.guias_tema
  FOR SELECT
  USING (
    id_profesor IN (
      SELECT id FROM public.profesores WHERE user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Profesores pueden crear guías maestras"
  ON public.guias_tema
  FOR INSERT
  WITH CHECK (
    id_profesor IN (
      SELECT id FROM public.profesores WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Profesores pueden actualizar sus guías maestras"
  ON public.guias_tema
  FOR UPDATE
  USING (
    id_profesor IN (
      SELECT id FROM public.profesores WHERE user_id = auth.uid()
    )
  );

-- Modificar tabla clases
ALTER TABLE public.clases 
  ADD COLUMN IF NOT EXISTS total_sesiones_tema INTEGER,
  ADD COLUMN IF NOT EXISTS id_guia_tema UUID REFERENCES public.guias_tema(id) ON DELETE SET NULL;

-- Trigger para updated_at
CREATE TRIGGER update_guias_tema_updated_at
  BEFORE UPDATE ON public.guias_tema
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_guias_tema_profesor ON public.guias_tema(id_profesor);
CREATE INDEX IF NOT EXISTS idx_guias_tema_tema ON public.guias_tema(id_tema);
CREATE INDEX IF NOT EXISTS idx_clases_guia_tema ON public.clases(id_guia_tema);
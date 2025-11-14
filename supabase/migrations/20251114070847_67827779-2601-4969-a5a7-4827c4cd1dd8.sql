-- Add new fields to support plan base and modifications
ALTER TABLE plan_anual ADD COLUMN IF NOT EXISTS plan_base BOOLEAN DEFAULT false;

-- Add fields to temas for tracking base themes and bimester organization
ALTER TABLE temas ADD COLUMN IF NOT EXISTS tema_base_id UUID REFERENCES temas(id);
ALTER TABLE temas ADD COLUMN IF NOT EXISTS bimestre INTEGER CHECK (bimestre >= 1 AND bimestre <= 4);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_temas_bimestre ON temas(bimestre);
CREATE INDEX IF NOT EXISTS idx_temas_tema_base_id ON temas(tema_base_id);
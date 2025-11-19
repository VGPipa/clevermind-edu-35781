import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen } from "lucide-react";

interface IniciarTemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tema: {
    id: string;
    nombre: string;
    descripcion?: string;
    duracion_estimada?: number;
    materias: {
      horas_semanales: number;
    };
  };
  onSuccess: () => void;
}

const METODOLOGIAS = [
  "Aprendizaje Basado en Proyectos",
  "Aprendizaje Cooperativo",
  "Clase Invertida (Flipped Classroom)",
  "Gamificación",
  "Aprendizaje por Descubrimiento",
  "Pensamiento Crítico y Debate",
  "Uso de TIC y Herramientas Digitales"
];

export function IniciarTemaDialog({ open, onOpenChange, tema, onSuccess }: IniciarTemaDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [totalSesiones, setTotalSesiones] = useState(
    tema.duracion_estimada ? Math.ceil(tema.duracion_estimada / (tema.materias.horas_semanales / 2)) : 8
  );
  const [contextoGrupo, setContextoGrupo] = useState("");
  const [metodologias, setMetodologias] = useState<string[]>([]);

  const handleSubmit = async () => {
    if (!totalSesiones || totalSesiones < 1) {
      toast({
        title: "Error",
        description: "Debes especificar al menos 1 sesión",
        variant: "destructive"
      });
      return;
    }

    if (metodologias.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una metodología",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('iniciar-tema', {
        body: {
          id_tema: tema.id,
          total_sesiones: totalSesiones,
          contexto_grupo: contextoGrupo,
          metodologias
        }
      });

      if (error) throw error;

      toast({
        title: "¡Guía maestra generada!",
        description: `Se ha creado la guía maestra para "${tema.nombre}" con ${totalSesiones} sesiones programadas.`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error iniciando tema:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo generar la guía maestra",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Iniciar Tema: {tema.nombre}
          </DialogTitle>
          <DialogDescription>
            Configura el tema para generar la guía maestra con IA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="total_sesiones">Total de Sesiones</Label>
            <Input
              id="total_sesiones"
              type="number"
              min="1"
              value={totalSesiones}
              onChange={(e) => setTotalSesiones(parseInt(e.target.value))}
              disabled={loading}
            />
            <p className="text-sm text-muted-foreground">
              Sugerido: {Math.ceil((tema.duracion_estimada || 0) / (tema.materias.horas_semanales / 2))} sesiones 
              ({tema.duracion_estimada} hrs ÷ {tema.materias.horas_semanales / 2} hrs/sesión)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contexto">Contexto del Grupo</Label>
            <Textarea
              id="contexto"
              placeholder="Describe las características del grupo: nivel, intereses, necesidades especiales, etc."
              value={contextoGrupo}
              onChange={(e) => setContextoGrupo(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Metodologías Preferidas</Label>
            <div className="space-y-2">
              {METODOLOGIAS.map((metodologia) => (
                <div key={metodologia} className="flex items-center space-x-2">
                  <Checkbox
                    id={metodologia}
                    checked={metodologias.includes(metodologia)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMetodologias([...metodologias, metodologia]);
                      } else {
                        setMetodologias(metodologias.filter(m => m !== metodologia));
                      }
                    }}
                    disabled={loading}
                  />
                  <label
                    htmlFor={metodologia}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {metodologia}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Generando Guía Maestra...' : 'Generar Guía Maestra'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
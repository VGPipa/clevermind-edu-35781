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
import { EditarGuiaTemaDialog } from "./EditarGuiaTemaDialog";

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
  
  // Calcular sesiones sugeridas: duracion_estimada (semanas) × horas_semanales = total horas
  // Asumiendo ~2 horas por sesión como estándar
  const calcularSesionesSugeridas = () => {
    if (!tema.duracion_estimada || !tema.materias.horas_semanales) return 8;
    const totalHoras = tema.duracion_estimada * tema.materias.horas_semanales;
    const horasPorSesion = 2; // Estándar de 2 horas por sesión
    return Math.ceil(totalHoras / horasPorSesion);
  };
  
  const [totalSesiones, setTotalSesiones] = useState(calcularSesionesSugeridas());
  const [contextoGrupo, setContextoGrupo] = useState("");
  const [metodologias, setMetodologias] = useState<string[]>([]);
  const [guiaCreada, setGuiaCreada] = useState<any>(null);
  const [mostrarEdicion, setMostrarEdicion] = useState(false);

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

      // Si ya existe una guía, mostrar mensaje y abrir edición
      if (data.guia_existente) {
        toast({
          title: "Guía maestra existente",
          description: data.mensaje || "Ya existe una guía maestra para este tema.",
        });
        setGuiaCreada(data.guia_tema);
        setMostrarEdicion(true);
        return;
      }

      // Si se creó exitosamente, mostrar preview/edición
      if (data.guia_tema) {
        toast({
          title: "¡Datos preliminares generados!",
          description: `Se han generado los datos preliminares para "${tema.nombre}" con ${totalSesiones} sesiones.`,
        });
        setGuiaCreada(data.guia_tema);
        setMostrarEdicion(true);
      } else {
        onOpenChange(false);
        onSuccess();
      }
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
            Configura el tema para generar datos preliminares de sesiones con IA. Estos datos se usarán como referencia al generar la guía de clase específica.
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
              {tema.duracion_estimada && tema.materias.horas_semanales ? (
                <>
                  Sugerido: {calcularSesionesSugeridas()} sesiones 
                  ({(tema.duracion_estimada * tema.materias.horas_semanales)} horas totales ÷ 2 horas/sesión)
                </>
              ) : (
                'Ingresa el número de sesiones para este tema'
              )}
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
              {loading ? 'Generando Datos Preliminares...' : 'Generar Datos Preliminares'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Diálogo de edición */}
      {guiaCreada && (
        <EditarGuiaTemaDialog
          open={mostrarEdicion}
          onOpenChange={(open) => {
            setMostrarEdicion(open);
            if (!open) {
              // Si se cierra el diálogo de edición, cerrar también el de iniciar tema
              onOpenChange(false);
              onSuccess();
            }
          }}
          guiaTema={guiaCreada}
          temaNombre={tema.nombre}
        />
      )}
    </Dialog>
  );
}
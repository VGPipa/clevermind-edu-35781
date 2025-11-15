import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock, Circle, Calendar, Target, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TemaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tema: {
    id: string;
    nombre: string;
    descripcion: string;
    objetivos: string;
    duracion_estimada: number;
    estado: 'completado' | 'en_progreso' | 'pendiente';
    clases_programadas: number;
    clases_ejecutadas: number;
    progreso: number;
    es_modificado: boolean;
  } | null;
}

export function TemaDetailModal({ isOpen, onClose, tema }: TemaDetailModalProps) {
  const navigate = useNavigate();

  if (!tema) return null;

  const handleProgramarClase = () => {
    navigate(`/profesor/generar-clase?temaId=${tema.id}`);
    onClose();
  };

  const getEstadoIcon = () => {
    switch (tema.estado) {
      case 'completado':
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case 'en_progreso':
        return <Clock className="h-6 w-6 text-primary" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  // Safely parse objetivos - handle both JSON arrays and plain text
  const objetivosArray = (() => {
    if (!tema.objetivos) return [];
    
    // If it's already an array, return it
    if (Array.isArray(tema.objetivos)) return tema.objetivos;
    
    // If it's a string, try to parse as JSON
    if (typeof tema.objetivos === 'string') {
      try {
        const parsed = JSON.parse(tema.objetivos);
        return Array.isArray(parsed) ? parsed : [tema.objetivos];
      } catch {
        // If parsing fails, treat as plain text and split by newlines or return as single item
        const lines = tema.objetivos.split('\n').filter(line => line.trim());
        return lines.length > 0 ? lines : [tema.objetivos];
      }
    }
    
    return [];
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            {getEstadoIcon()}
            <div className="flex-1">
              <DialogTitle className="text-xl mb-2">{tema.nombre}</DialogTitle>
              <DialogDescription>{tema.descripcion}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Progreso del Tema</span>
              <span className="text-lg font-bold text-primary">{tema.progreso}%</span>
            </div>
            <Progress value={tema.progreso} className="h-3" />
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{tema.clases_ejecutadas} de {tema.clases_programadas} clases completadas</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{tema.duracion_estimada} semanas estimadas</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Competencias y Capacidades */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Competencias y Capacidades (MINEDU)</h3>
            </div>
            <div className="space-y-2">
              {Array.isArray(objetivosArray) && objetivosArray.length > 0 ? (
                objetivosArray.map((objetivo: string, index: number) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{objetivo}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{tema.objetivos}</p>
              )}
            </div>
          </div>

          {tema.es_modificado && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Tema Modificado</h3>
                </div>
                <Badge variant="outline">Este tema ha sido personalizado por ti</Badge>
                <p className="text-sm text-muted-foreground">
                  Puedes compararlo con el plan base en la vista de planificación.
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleProgramarClase}>
              Programar Nueva Clase
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

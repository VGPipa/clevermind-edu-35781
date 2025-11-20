import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle2, Edit, Eye, FileText, MessageSquare } from "lucide-react";
import { AlertaBadge } from "./AlertaBadge";
import { cn } from "@/lib/utils";

interface SesionCardProps {
  sesion: {
    id: string;
    numero_sesion?: number;
    fecha_programada?: string;
    fecha_ejecutada?: string;
    estado: string;
    duracion_minutos?: number;
    tema?: {
      nombre: string;
    };
    grupo?: {
      nombre: string;
      grado: string;
      seccion: string;
    };
    tiene_guia?: boolean;
  };
  temaNombre?: string;
  onVerDetalle?: () => void;
  onEditar?: () => void;
  onGestionarQuizzes?: () => void;
  onVerRetroalimentaciones?: () => void;
}

export function SesionCard({ 
  sesion, 
  temaNombre,
  onVerDetalle,
  onEditar,
  onGestionarQuizzes,
  onVerRetroalimentaciones
}: SesionCardProps) {
  const getEstadoBadge = () => {
    if (!sesion.tiene_guia) {
      return <Badge variant="secondary">Por generar guía</Badge>;
    }
    switch (sesion.estado) {
      case 'completada':
      case 'ejecutada':
        return <Badge variant="default" className="bg-green-600">Completada</Badge>;
      case 'guia_final':
        return <Badge variant="default" className="bg-blue-600">Guía Final</Badge>;
      case 'guia_aprobada':
        return <Badge variant="default" className="bg-purple-600">Guía Aprobada</Badge>;
      case 'editando_guia':
        return <Badge variant="secondary">Editando</Badge>;
      default:
        return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  const calcularDiasRestantes = () => {
    if (!sesion.fecha_programada) return null;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaProgramada = new Date(sesion.fecha_programada);
    fechaProgramada.setHours(0, 0, 0, 0);
    const diff = Math.ceil((fechaProgramada.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getNivelAlerta = (dias: number | null): 'urgente' | 'proxima' | 'programada' | 'lejana' | null => {
    if (dias === null) return null;
    if (dias < 0) return null; // Ya pasó
    if (dias <= 2) return 'urgente';
    if (dias <= 7) return 'proxima';
    if (dias <= 30) return 'programada';
    return 'lejana';
  };

  const diasRestantes = calcularDiasRestantes();
  const nivelAlerta = getNivelAlerta(diasRestantes);

  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              {sesion.numero_sesion && (
                <Badge variant="outline">Sesión {sesion.numero_sesion}</Badge>
              )}
              {getEstadoBadge()}
              {nivelAlerta && diasRestantes !== null && (
                <AlertaBadge nivel={nivelAlerta} diasRestantes={diasRestantes} />
              )}
            </div>
            
            {temaNombre && (
              <p className="text-sm font-medium">{temaNombre}</p>
            )}
            
            {sesion.grupo && (
              <p className="text-xs text-muted-foreground">
                {sesion.grupo.nombre} - {sesion.grupo.grado}° {sesion.grupo.seccion}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {sesion.fecha_programada && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(sesion.fecha_programada).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}</span>
                </div>
              )}
              {sesion.duracion_minutos && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{sesion.duracion_minutos} min</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            {onVerDetalle && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onVerDetalle}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {onEditar && sesion.tiene_guia && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onEditar}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {(onGestionarQuizzes || onVerRetroalimentaciones) && (
          <div className="flex gap-2 mt-3 pt-3 border-t">
            {onGestionarQuizzes && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={onGestionarQuizzes}
              >
                <FileText className="h-3 w-3 mr-1" />
                Quizzes
              </Button>
            )}
            {onVerRetroalimentaciones && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={onVerRetroalimentaciones}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Retroalimentación
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


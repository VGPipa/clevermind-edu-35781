import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, Eye, Edit, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
    grupos?: {
      nombre: string;
      grado: string;
      seccion: string;
    };
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
    switch (sesion.estado) {
      case 'completada':
      case 'ejecutada':
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completada
          </Badge>
        );
      case 'guia_aprobada':
      case 'guia_final':
        return (
          <Badge className="bg-blue-500 text-white">
            <FileText className="h-3 w-3 mr-1" />
            Guía Aprobada
          </Badge>
        );
      case 'editando_guia':
        return (
          <Badge className="bg-orange-500 text-white">
            <Edit className="h-3 w-3 mr-1" />
            Editando
          </Badge>
        );
      case 'quiz_pre_enviado':
      case 'quiz_post_enviado':
        return (
          <Badge className="bg-purple-500 text-white">
            <FileText className="h-3 w-3 mr-1" />
            Quiz Enviado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {sesion.estado}
          </Badge>
        );
    }
  };

  const fechaMostrar = sesion.fecha_ejecutada || sesion.fecha_programada;
  const fechaDate = fechaMostrar ? new Date(fechaMostrar) : null;
  const diasRestantes = fechaDate 
    ? Math.ceil((fechaDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  const getNivelAlerta = (): 'urgente' | 'proxima' | 'programada' | 'lejana' | null => {
    if (diasRestantes === null) return null;
    if (diasRestantes <= 2) return 'urgente';
    if (diasRestantes <= 5) return 'proxima';
    if (diasRestantes <= 14) return 'programada';
    return 'lejana';
  };
  
  const nivelAlerta = getNivelAlerta();

  return (
    <Card className="hover:shadow-sm transition-all duration-200">
      <CardContent className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">
                Sesión {sesion.numero_sesion || 'N/A'}
              </span>
              {getEstadoBadge()}
              {nivelAlerta && diasRestantes !== null && (
                <AlertaBadge nivel={nivelAlerta} diasRestantes={diasRestantes} />
              )}
            </div>
            
            {temaNombre && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {temaNombre}
              </p>
            )}

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {fechaDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(fechaDate, "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
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
                className="h-7 px-2"
                onClick={onVerDetalle}
              >
                <Eye className="h-3 w-3" />
              </Button>
            )}
            {onEditar && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onClick={onEditar}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Acciones adicionales según estado */}
        {(sesion.estado === 'guia_aprobada' || sesion.estado === 'guia_final') && (
          <div className="flex gap-2 mt-2 pt-2 border-t">
            {onGestionarQuizzes && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={onGestionarQuizzes}
              >
                Gestionar Quizzes
              </Button>
            )}
            {onVerRetroalimentaciones && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-xs"
                onClick={onVerRetroalimentaciones}
              >
                Retroalimentaciones
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


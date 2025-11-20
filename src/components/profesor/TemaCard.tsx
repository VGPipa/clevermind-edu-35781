import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Calendar, BookOpen, Eye, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemaCardProps {
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
    tiene_guia_maestra?: boolean;
    estatus?: 'sin_guia' | 'con_guia_sin_sesiones' | 'con_sesiones';
    sesiones_creadas?: number;
    total_sesiones_guia?: number | null;
  };
  onProgramarClase: (temaId: string) => void;
  onVerDetalle: (temaId: string) => void;
  onIniciarTema?: (tema: any) => void;
  onVerGuia?: (temaId: string) => void;
  onGestionarTema?: (temaId: string) => void;
  onVerEnSalones?: (temaId: string) => void;
}

export function TemaCard({
  tema,
  onProgramarClase,
  onVerDetalle,
  onIniciarTema,
  onVerGuia,
  onGestionarTema,
  onVerEnSalones,
}: TemaCardProps) {
  const getEstadoIcon = () => {
    switch (tema.estado) {
      case 'completado':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'en_progreso':
        return <Clock className="h-5 w-5 text-primary" />;
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getEstadoBadge = () => {
    switch (tema.estado) {
      case 'completado':
        return <Badge variant="default" className="bg-success">Completado</Badge>;
      case 'en_progreso':
        return <Badge variant="default">En Progreso</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const renderEstatusBadge = () => {
    switch (tema.estatus) {
      case 'sin_guia':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300">
            Sin Guía
          </Badge>
        );
      case 'con_guia_sin_sesiones':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            Con Guía
          </Badge>
        );
      case 'con_sesiones':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
            Con Sesiones
          </Badge>
        );
      default:
        return null;
    }
  };

  const renderAcciones = () => {
    if (tema.estatus === 'sin_guia' || !tema.tiene_guia_maestra) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onIniciarTema?.(tema);
          }}
        >
          <BookOpen className="h-4 w-4 mr-1" />
          Iniciar Tema
        </Button>
      );
    }

    if (tema.estatus === 'con_guia_sin_sesiones') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onVerGuia?.(tema.id);
            }}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Ver Guía
          </Button>
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onProgramarClase(tema.id);
            }}
          >
            Programar Sesión
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onVerGuia?.(tema.id);
            }}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver Guía
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              (onGestionarTema || onProgramarClase)(tema.id);
            }}
          >
            <ArrowRight className="h-4 w-4 mr-1" />
            Gestionar
          </Button>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onVerEnSalones?.(tema.id);
          }}
        >
          Ver en Mis Salones
        </Button>
      </div>
    );
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-300 cursor-pointer",
        tema.estado === 'completado' && "border-success/30 bg-success/5"
      )}
      onClick={() => onVerDetalle(tema.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {getEstadoIcon()}
              <CardTitle className="text-base font-semibold">{tema.nombre}</CardTitle>
            </div>
            <CardDescription className="text-sm line-clamp-2">{tema.descripcion}</CardDescription>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getEstadoBadge()}
            {renderEstatusBadge()}
            {tema.tiene_guia_maestra && tema.total_sesiones_guia && (
              <Badge variant="outline" className="text-xs bg-purple-500 text-white border-purple-500">
                <BookOpen className="h-3 w-3 mr-1" />
                {tema.total_sesiones_guia} sesiones
              </Badge>
            )}
            {tema.es_modificado && (
              <Badge variant="outline" className="text-xs">Modificado</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-medium">{tema.progreso}%</span>
        </div>
        <Progress value={tema.progreso} className="h-2" />
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{tema.duracion_estimada} semanas</span>
          </div>
          <span>
            {tema.clases_ejecutadas}/{tema.clases_programadas} clases
          </span>
        </div>

        {tema.sesiones_creadas !== undefined && (
          <div className="text-xs text-muted-foreground text-right">
            {tema.sesiones_creadas} clases creadas
          </div>
        )}

        {renderAcciones()}
      </CardContent>
    </Card>
  );
}

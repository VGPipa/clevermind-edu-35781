import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Calendar } from "lucide-react";
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
  };
  onProgramarClase: (temaId: string) => void;
  onVerDetalle: (temaId: string) => void;
}

export function TemaCard({ tema, onProgramarClase, onVerDetalle }: TemaCardProps) {
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

        <Button 
          size="sm" 
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onProgramarClase(tema.id);
          }}
        >
          Programar Clase
        </Button>
      </CardContent>
    </Card>
  );
}

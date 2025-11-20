import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, CheckCircle2, Clock, Circle, Eye, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TemaListCardProps {
  tema: {
    id: string;
    nombre: string;
    descripcion?: string;
    duracion_estimada: number;
    bimestre: number;
    materia: {
      id: string;
      nombre: string;
      grado?: string;
    };
    tiene_guia_maestra: boolean;
    total_sesiones_guia?: number | null;
    sesiones_creadas: number;
    estatus: 'sin_guia' | 'con_guia_sin_sesiones' | 'con_sesiones';
  };
  onIniciarTema?: () => void;
  onVerGuia?: () => void;
  onProgramarSesion?: () => void;
  onVerDetalle?: () => void;
  onVerEnSalones?: () => void;
}

export function TemaListCard({ 
  tema, 
  onIniciarTema, 
  onVerGuia, 
  onProgramarSesion,
  onVerDetalle,
  onVerEnSalones 
}: TemaListCardProps) {
  const getEstatusBadge = () => {
    switch (tema.estatus) {
      case 'sin_guia':
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-300">
            <Circle className="h-3 w-3 mr-1" />
            Sin Guía
          </Badge>
        );
      case 'con_guia_sin_sesiones':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
            <BookOpen className="h-3 w-3 mr-1" />
            Con Guía
          </Badge>
        );
      case 'con_sesiones':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700 border-green-300">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Con Sesiones
          </Badge>
        );
    }
  };

  const getBimestreBadge = () => {
    const bimestres = ['I', 'II', 'III', 'IV'];
    return (
      <Badge variant="outline" className="text-xs">
        Bimestre {bimestres[tema.bimestre - 1] || tema.bimestre}
      </Badge>
    );
  };

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-all duration-300",
        tema.estatus === 'con_sesiones' && "border-green-200"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base font-semibold line-clamp-1 truncate">{tema.nombre}</CardTitle>
              {getBimestreBadge()}
            </div>
            <CardDescription className="text-sm line-clamp-2">
              {tema.descripcion || 'Sin descripción'}
            </CardDescription>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="truncate">{tema.materia.nombre}</span>
              {tema.materia.grado && (
                <>
                  <span className="flex-shrink-0">•</span>
                  <span className="flex-shrink-0">{tema.materia.grado}°</span>
                </>
              )}
              <span className="flex-shrink-0">•</span>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="h-3 w-3" />
                <span>{tema.duracion_estimada} semanas</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end flex-shrink-0">
            {getEstatusBadge()}
            {tema.tiene_guia_maestra && tema.total_sesiones_guia && (
              <Badge variant="outline" className="text-xs bg-purple-500 text-white border-purple-500">
                <BookOpen className="h-3 w-3 mr-1" />
                {tema.total_sesiones_guia} sesiones
              </Badge>
            )}
            {tema.sesiones_creadas > 0 && (
              <Badge variant="outline" className="text-xs">
                {tema.sesiones_creadas} creadas
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {tema.estatus === 'sin_guia' && (
          <Button 
            size="sm" 
            variant="outline"
            className="w-full"
            onClick={onIniciarTema}
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Iniciar Tema
          </Button>
        )}

        {tema.estatus === 'con_guia_sin_sesiones' && (
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline"
              className="flex-1"
              onClick={onVerGuia}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver Guía
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={onProgramarSesion}
            >
              <Plus className="h-4 w-4 mr-1" />
              Programar Primera Sesión
            </Button>
          </div>
        )}

        {tema.estatus === 'con_sesiones' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1"
                onClick={onVerGuia}
              >
                <Eye className="h-4 w-4 mr-1" />
                Ver Guía
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1"
                onClick={onVerDetalle}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Gestionar
              </Button>
            </div>
            <Button 
              size="sm" 
              variant="secondary"
              className="w-full"
              onClick={onVerEnSalones}
            >
              Ver en Mis Salones
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


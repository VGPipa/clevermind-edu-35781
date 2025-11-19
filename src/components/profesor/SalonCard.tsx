import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Users, Calendar, CheckCircle2, Clock, ChevronDown, ChevronUp, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { SesionCard } from "./SesionCard";

interface SalonCardProps {
  salon: {
    grupo: {
      id: string;
      nombre: string;
      grado: string;
      seccion: string;
      cantidad_alumnos?: number;
    };
    temas: Array<{
      tema: {
        id: string;
        nombre: string;
        materia: {
          id: string;
          nombre: string;
        };
      };
      sesiones: Array<any>;
      progreso: {
        completadas: number;
        programadas: number;
        pendientes: number;
        total: number;
        porcentaje: number;
      };
    }>;
    progreso_general: {
      porcentaje: number;
      total_sesiones: number;
      completadas: number;
      programadas: number;
      pendientes: number;
    };
  };
  onProgramarSesion?: (temaId: string, grupoId: string) => void;
  onVerSesion?: (sesionId: string) => void;
}

export function SalonCard({ salon, onProgramarSesion, onVerSesion }: SalonCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalTemas = salon.temas.length;
  const totalSesiones = salon.progreso_general.total_sesiones;

  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">{salon.grupo.nombre}</CardTitle>
            </div>
            <CardDescription className="text-sm">
              {salon.grupo.grado}° - Sección {salon.grupo.seccion}
              {salon.grupo.cantidad_alumnos && (
                <span className="ml-2">• {salon.grupo.cantidad_alumnos} alumnos</span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progreso General */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso General</span>
            <span className="font-medium">{salon.progreso_general.porcentaje}%</span>
          </div>
          <Progress value={salon.progreso_general.porcentaje} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>{salon.progreso_general.completadas} completadas</span>
              </div>
              <div className="flex items-center gap-1 text-blue-600">
                <Calendar className="h-3 w-3" />
                <span>{salon.progreso_general.programadas} programadas</span>
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <Clock className="h-3 w-3" />
                <span>{salon.progreso_general.pendientes} pendientes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de Temas */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {totalTemas} {totalTemas === 1 ? 'tema' : 'temas'} • {totalSesiones} sesiones
          </span>
        </div>

        {/* Temas expandidos */}
        {expanded && (
          <div className="space-y-4 pt-4 border-t">
            {salon.temas.map((temaData) => (
              <div key={temaData.tema.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">{temaData.tema.nombre}</h4>
                    <p className="text-xs text-muted-foreground">{temaData.tema.materia.nombre}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {temaData.progreso.porcentaje}%
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => onProgramarSesion?.(temaData.tema.id, salon.grupo.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress value={temaData.progreso.porcentaje} className="h-1.5" />
                <div className="text-xs text-muted-foreground">
                  {temaData.progreso.completadas} completadas • {temaData.progreso.programadas} programadas • {temaData.progreso.pendientes} pendientes
                </div>

                {/* Sesiones del tema */}
                {temaData.sesiones.length > 0 && (
                  <div className="space-y-2 mt-3 pl-4 border-l-2 border-muted">
                    {temaData.sesiones.map((sesion) => (
                      <SesionCard
                        key={sesion.id}
                        sesion={sesion}
                        temaNombre={temaData.tema.nombre}
                        onVerDetalle={() => onVerSesion?.(sesion.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


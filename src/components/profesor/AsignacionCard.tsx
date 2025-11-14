import { BookOpen, Users, Clock, TrendingUp, CheckCircle2, Circle, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface AsignacionCardProps {
  asignacion: {
    id: string;
    materia: {
      id: string;
      nombre: string;
      horas_semanales: number;
      total_temas: number;
    };
    grupo: {
      id: string;
      nombre: string;
      grado: string;
      seccion: string;
      cantidad_alumnos: number;
    };
    anio_escolar: string;
    estadisticas: {
      clases_programadas: number;
      clases_completadas: number;
      temas_cubiertos: number;
      porcentaje_cobertura: number;
      total_temas?: number;
      temas_completados?: number;
      temas_en_progreso?: number;
      temas_pendientes?: number;
    };
    planificacion?: {
      progreso_general: number;
      bimestres: Array<{
        numero: number;
        nombre: string;
        periodo: string;
        temas: Array<{
          id: string;
          nombre: string;
          estado: 'completado' | 'en_progreso' | 'pendiente';
          progreso: number;
        }>;
      }>;
    };
  };
}

export const AsignacionCard = ({ asignacion }: AsignacionCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl">{asignacion.materia.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {asignacion.grupo.grado} - Sección {asignacion.grupo.seccion}
            </p>
          </div>
          <Badge variant="outline">{asignacion.anio_escolar}</Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>Horas/sem</span>
            </div>
            <p className="text-2xl font-semibold">{asignacion.materia.horas_semanales}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <BookOpen className="h-4 w-4" />
              <span>Temas</span>
            </div>
            <p className="text-2xl font-semibold">{asignacion.materia.total_temas}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="h-4 w-4" />
              <span>Estudiantes</span>
            </div>
            <p className="text-2xl font-semibold">{asignacion.grupo.cantidad_alumnos}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Cobertura</span>
            </div>
            <p className="text-2xl font-semibold">{asignacion.estadisticas.porcentaje_cobertura}%</p>
          </div>
        </div>
        
        {asignacion.planificacion && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progreso de Planificación</span>
              <span className="text-sm font-bold text-primary">
                {asignacion.planificacion.progreso_general}%
              </span>
            </div>
            <Progress value={asignacion.planificacion.progreso_general} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-success" />
                <span>
                  {asignacion.estadisticas.temas_completados || 0} Completados
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Play className="h-3 w-3 text-primary" />
                <span>
                  {asignacion.estadisticas.temas_en_progreso || 0} En Progreso
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Circle className="h-3 w-3 text-muted-foreground" />
                <span>
                  {asignacion.estadisticas.temas_pendientes || 0} Pendientes
                </span>
              </div>
            </div>
            {asignacion.planificacion.bimestres && asignacion.planificacion.bimestres.length > 0 && (
              <div className="pt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Por Bimestre:</p>
                <div className="grid grid-cols-2 gap-2">
                  {asignacion.planificacion.bimestres.map((bimestre) => {
                    const temasCompletados = bimestre.temas.filter(t => t.estado === 'completado').length;
                    const totalTemas = bimestre.temas.length;
                    const progresoBimestre = totalTemas > 0 
                      ? Math.round((temasCompletados / totalTemas) * 100) 
                      : 0;
                    
                    return (
                      <div key={bimestre.numero} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-muted-foreground">Bim. {bimestre.numero}</span>
                          <span className="font-medium">{progresoBimestre}%</span>
                        </div>
                        <Progress value={progresoBimestre} className="h-1" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="pt-4 border-t flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/profesor/planificacion')}
          >
            Ver Planificación
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

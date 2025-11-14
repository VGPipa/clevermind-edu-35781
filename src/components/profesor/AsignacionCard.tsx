import { BookOpen, Users, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

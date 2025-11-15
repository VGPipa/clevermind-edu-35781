import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Clock, Users, CheckCircle2, AlertCircle, ArrowRight, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface GradoCardProps {
  grado: {
    grado: string;
    plan_anual: {
      id: string;
      grado: string;
      anio_escolar: string;
      estado: string;
    } | null;
    grupos: Array<{
      id: string;
      nombre: string;
      seccion: string;
      cantidad_alumnos: number;
    }>;
    cantidad_grupos: number;
    estadisticas: {
      total_materias: number;
      total_temas: number;
      horas_semanales: number;
      completitud: number;
      materias_con_temas: number;
      materias_sin_temas: number;
    };
    profesores_asignados: number;
  };
  onViewPlan?: () => void;
  onCreatePlan?: () => void;
}

export function GradoCard({ grado, onViewPlan, onCreatePlan }: GradoCardProps) {
  const hasPlan = !!grado.plan_anual;
  const estado = hasPlan && grado.estadisticas.completitud === 100 ? 'completo' : 'pendiente';

  return (
    <Card 
      className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
        estado === 'completo' ? 'border-success/30' : 'border-warning/30'
      }`}
      onClick={hasPlan ? onViewPlan : onCreatePlan}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <GraduationCap className={`h-6 w-6 ${
                estado === 'completo' ? 'text-success' : 'text-warning'
              }`} />
              <CardTitle className="text-xl">{grado.grado}</CardTitle>
              {hasPlan && (
                <Badge variant={estado === 'completo' ? 'default' : 'outline'}>
                  {estado === 'completo' ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" /> Completo</>
                  ) : (
                    <><AlertCircle className="h-3 w-3 mr-1" /> Pendiente</>
                  )}
                </Badge>
              )}
            </div>
            {grado.plan_anual && (
              <p className="text-sm text-muted-foreground mt-1">
                Año escolar: {grado.plan_anual.anio_escolar}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{grado.estadisticas.total_materias}</div>
              <div className="text-xs text-muted-foreground">Materias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{grado.estadisticas.total_temas}</div>
              <div className="text-xs text-muted-foreground">Temas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{grado.estadisticas.horas_semanales}</div>
              <div className="text-xs text-muted-foreground">Hrs/Semana</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{grado.cantidad_grupos}</div>
              <div className="text-xs text-muted-foreground">Grupos</div>
            </div>
          </div>

          {/* Profesores asignados */}
          {hasPlan && (
            <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-md">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {grado.profesores_asignados} {grado.profesores_asignados === 1 ? 'profesor' : 'profesores'} asignado(s)
              </span>
            </div>
          )}

          {/* Progreso de completitud */}
          {hasPlan && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completitud del Plan</span>
                <span className="font-medium">{grado.estadisticas.completitud}%</span>
              </div>
              <Progress value={grado.estadisticas.completitud} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{grado.estadisticas.materias_con_temas} con temas</span>
                <span>{grado.estadisticas.materias_sin_temas} sin temas</span>
              </div>
            </div>
          )}

          {/* Mensaje si no tiene plan */}
          {!hasPlan && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Plan no configurado</span>
              </div>
            </div>
          )}

          {/* Botón de acción */}
          <Button
            variant={hasPlan ? "default" : "outline"}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              if (hasPlan && onViewPlan) {
                onViewPlan();
              } else if (!hasPlan && onCreatePlan) {
                onCreatePlan();
              }
            }}
          >
            {hasPlan ? (
              <>
                Ver Plan
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Crear Plan
                <Plus className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


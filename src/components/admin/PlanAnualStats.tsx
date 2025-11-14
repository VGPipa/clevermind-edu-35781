import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PlanAnualStatsProps {
  estadisticas: {
    total_materias: number;
    materias_con_temas: number;
    materias_sin_temas: number;
    total_temas: number;
    distribucion_bimestres: {
      1: number;
      2: number;
      3: number;
      4: number;
    };
    total_horas_semanales: number;
  };
}

export function PlanAnualStats({ estadisticas }: PlanAnualStatsProps) {
  const completitudPlan = estadisticas.total_materias > 0 
    ? (estadisticas.materias_con_temas / estadisticas.total_materias) * 100 
    : 0;

  const promedioTemasPorMateria = estadisticas.materias_con_temas > 0
    ? Math.round(estadisticas.total_temas / estadisticas.materias_con_temas)
    : 0;

  return (
    <div className="space-y-6">
      {/* Cards de estadísticas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Materias</CardTitle>
            <BookOpen className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{estadisticas.total_materias}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {estadisticas.materias_con_temas} con temas configurados
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Temas</CardTitle>
            <FileText className="h-5 w-5 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{estadisticas.total_temas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {promedioTemasPorMateria} promedio por materia
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Horas Semanales</CardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{estadisticas.total_horas_semanales}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total del plan anual
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completitud</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{Math.round(completitudPlan)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Materias configuradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progreso de completitud del plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Estado del Plan Anual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Materias con Temas</span>
              <span className="font-medium">{estadisticas.materias_con_temas} / {estadisticas.total_materias}</span>
            </div>
            <Progress value={completitudPlan} className="h-3" />
          </div>

          {estadisticas.materias_sin_temas > 0 && (
            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-md">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <p className="text-sm font-medium text-warning">
                  {estadisticas.materias_sin_temas} {estadisticas.materias_sin_temas === 1 ? 'materia' : 'materias'} sin temas configurados
                </p>
                <p className="text-xs text-muted-foreground">
                  Completa la configuración de todas las materias para el plan anual
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribución por bimestres */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Distribución de Temas por Bimestre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(bim => {
              const count = estadisticas.distribucion_bimestres[bim as 1 | 2 | 3 | 4];
              const percentage = estadisticas.total_temas > 0 
                ? (count / estadisticas.total_temas) * 100 
                : 0;
              
              return (
                <div key={bim} className="space-y-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{count}</div>
                    <div className="text-xs text-muted-foreground">Bimestre {bim}</div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-center text-muted-foreground">
                    {Math.round(percentage)}%
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

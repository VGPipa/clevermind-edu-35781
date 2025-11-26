import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MetricasGlobales } from "@/types/metricas-salon";
interface MetricasGlobalesSalonProps {
  metricas: MetricasGlobales;
  nombreSalon: string;
}
export function MetricasGlobalesSalon({
  metricas,
  nombreSalon
}: MetricasGlobalesSalonProps) {
  if (!metricas) {
    return <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay métricas globales disponibles</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen del salón</h2>
        <p className="text-muted-foreground text-sm">
          Métricas del grupo durante el año escolar
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Participación Promedio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Participación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metricas.participacion_promedio}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alumnos que completan quizzes
            </p>
            {metricas.participacion_promedio < 65 && <Badge variant="destructive" className="mt-2 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Requiere atención
              </Badge>}
          </CardContent>
        </Card>

        {/* Alumnos en Riesgo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alumnos que requieren refuerzo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {metricas.alumnos_riesgo.cantidad}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas.alumnos_riesgo.porcentaje}% del grupo
            </p>
            {metricas.alumnos_riesgo.cantidad > 0}
          </CardContent>
        </Card>

        {/* Porcentaje Promedio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Desempeño
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {metricas.porcentaje_promedio || 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio general del salón
            </p>
          </CardContent>
        </Card>
      </div>
    </div>;
}
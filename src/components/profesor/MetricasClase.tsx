import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Users, Target, CheckCircle2 } from "lucide-react";
import type { ClaseConResultados } from "@/hooks/use-mis-clases-profesor";

interface MetricasClaseProps {
  metricas: ClaseConResultados["metricas"];
}

export function MetricasClase({ metricas }: MetricasClaseProps) {
  if (!metricas) {
    return (
      <div className="text-sm text-muted-foreground">No hay métricas disponibles para esta clase</div>
    );
  }

  const mejora = metricas.mejora_promedio;
  const tendencia =
    mejora !== null && mejora > 0.5
      ? "up"
      : mejora !== null && mejora < -0.5
        ? "down"
        : "stable";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Promedio Quiz Post</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metricas.promedio_nota_post !== null
              ? metricas.promedio_nota_post.toFixed(1)
              : "-"}
          </div>
          {mejora !== null && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              {tendencia === "up" && (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">+{mejora.toFixed(1)} vs Pre</span>
                </>
              )}
              {tendencia === "down" && (
                <>
                  <TrendingDown className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">{mejora.toFixed(1)} vs Pre</span>
                </>
              )}
              {tendencia === "stable" && (
                <>
                  <Minus className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Estable vs Pre</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(metricas.tasa_participacion)}%</div>
          <div className="text-xs text-muted-foreground mt-1">
            {metricas.alumnos_completaron} de {metricas.total_alumnos} alumnos
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4" />
            Completación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(metricas.tasa_completacion)}%</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Comprensión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metricas.nivel_comprension !== null
              ? `${Math.round(metricas.nivel_comprension)}%`
              : "-"}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


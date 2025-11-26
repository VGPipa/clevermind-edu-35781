import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingDown, CheckCircle2, Lightbulb } from "lucide-react";
import { DatosPre, RecomendacionPre } from "@/types/metricas-salon";

interface SeccionPreMetricasProps {
  datos: DatosPre;
  recomendaciones: RecomendacionPre[];
}

export function SeccionPreMetricas({ datos, recomendaciones }: SeccionPreMetricasProps) {
  const getClasificacionColor = (clasificacion: string) => {
    switch (clasificacion) {
      case "alta":
        return "bg-green-600";
      case "media":
        return "bg-yellow-600";
      case "baja":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getClasificacionLabel = (clasificacion: string) => {
    switch (clasificacion) {
      case "alta":
        return "Alta";
      case "media":
        return "Media";
      case "baja":
        return "Baja";
      default:
        return "N/A";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">PRE - Diagnóstico Inicial</h2>
        <p className="text-muted-foreground text-sm">
          Evaluación de lo que el grupo sabía antes de la clase
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Participación del PRE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participación del PRE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Porcentaje de completación</span>
                  <span className="font-semibold">{datos.participacion.porcentaje}%</span>
                </div>
                <Progress value={datos.participacion.porcentaje} className="h-2" />
              </div>
              {datos.participacion.ausentes.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Alumnos ausentes ({datos.participacion.ausentes.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {datos.participacion.ausentes.slice(0, 5).map((ausente) => (
                      <Badge key={ausente.id} variant="outline" className="text-xs">
                        {ausente.nombre} {ausente.apellido}
                      </Badge>
                    ))}
                    {datos.participacion.ausentes.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{datos.participacion.ausentes.length - 5} más
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Nivel General de Preparación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Nivel General de Preparación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Porcentaje de aciertos promedio</span>
                  <span className="font-semibold">{datos.nivel_preparacion.porcentaje}%</span>
                </div>
                <Progress value={datos.nivel_preparacion.porcentaje} className="h-2" />
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={`${getClasificacionColor(
                    datos.nivel_preparacion.clasificacion
                  )} text-white`}
                >
                  {getClasificacionLabel(datos.nivel_preparacion.clasificacion)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {datos.nivel_preparacion.clasificacion === "baja" && "Preparación baja (<50%)"}
                  {datos.nivel_preparacion.clasificacion === "media" && "Preparación media (50-75%)"}
                  {datos.nivel_preparacion.clasificacion === "alta" && "Preparación alta (≥75%)"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conceptos con Menor Preparación */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Conceptos con Menor Preparación Inicial
            </CardTitle>
            <CardDescription>
              Ranking de conceptos que requieren más atención
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datos.conceptos_debiles.length > 0 ? (
              <div className="space-y-3">
                {datos.conceptos_debiles.map((concepto, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{concepto.concepto}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {concepto.porcentaje_acierto}% de acierto
                      </p>
                    </div>
                    <Badge variant="destructive" className="ml-2">
                      {concepto.porcentaje_acierto}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Recomendaciones PREVIO A LA CLASE */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Recomendaciones PREVIO A LA CLASE
            </CardTitle>
            <CardDescription>
              Sugerencias para preparar mejor la clase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recomendaciones && recomendaciones.length > 0 ? (
              <div className="space-y-3">
                {recomendaciones.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/60 border border-blue-100"
                  >
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      {rec.recomendacion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rec.sugerencia}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay recomendaciones disponibles aún
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


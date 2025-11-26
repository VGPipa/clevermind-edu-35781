import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { DatosPost, RecomendacionPost } from "@/types/metricas-salon";

interface SeccionPostMetricasProps {
  datos: DatosPost;
  recomendaciones: RecomendacionPost[];
}

export function SeccionPostMetricas({ datos, recomendaciones }: SeccionPostMetricasProps) {

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">POST - Logro de la Clase</h2>
        <p className="text-muted-foreground text-sm">
          Evaluación de lo que se logró después de haber dictado la clase
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Participación del POST */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participación del POST
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
            </div>
          </CardContent>
        </Card>

        {/* Nivel de Logro del Salón */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Nivel de Logro del Salón
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Promedio de logro</span>
                  <span className="font-semibold">{datos.nivel_logro.promedio}%</span>
                </div>
                <Progress value={datos.nivel_logro.promedio} className="h-2" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-red-600 text-red-600" />
                  <span>Bajo (&lt;50%): {datos.nivel_logro.distribucion.bajo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-yellow-600 text-yellow-600" />
                  <span>Intermedio (50-75%): {datos.nivel_logro.distribucion.intermedio}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-green-600 text-green-600" />
                  <span>Alto (≥75%): {datos.nivel_logro.distribucion.alto}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alumnos que Requieren Apoyo */}
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alumnos que Requieren Apoyo
            </CardTitle>
            <CardDescription>
              Alumnos con bajo nivel de logro (basado en POST)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {datos.alumnos_apoyo.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {datos.alumnos_apoyo.map((alumno) => (
                  <div
                    key={alumno.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/60"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {alumno.nombre} {alumno.apellido}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs ml-2">
                      {alumno.porcentaje}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No hay alumnos que requieran apoyo adicional
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recomendaciones POST CLASE */}
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              Recomendaciones POST CLASE
            </CardTitle>
            <CardDescription>
              Acciones sugeridas después de la clase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recomendaciones && recomendaciones.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {recomendaciones.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white/60 border border-blue-100"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      <Badge
                        variant={rec.tipo === 'refuerzo' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {rec.tipo === 'refuerzo' ? 'Refuerzo' : 'Evaluación'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-blue-900 mb-1">
                      {rec.recomendacion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rec.sugerencia}
                    </p>
                    {rec.evidencia && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        {rec.evidencia}
                      </p>
                    )}
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

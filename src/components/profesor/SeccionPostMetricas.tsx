import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { DatosPost } from "@/types/metricas-salon";

interface SeccionPostMetricasProps {
  datos: DatosPost;
}

export function SeccionPostMetricas({ datos }: SeccionPostMetricasProps) {
  // Conceptos por reforzar (solo rojos < 50%)
  const conceptosPorReforzar = datos.conceptos_logrados.filter(c => c.porcentaje_logro < 50);

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
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-red-600 text-red-600" />
                  <span>Riesgo: {datos.nivel_logro.distribucion.riesgo}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-yellow-600 text-yellow-600" />
                  <span>Suficiente: {datos.nivel_logro.distribucion.suficiente}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-blue-600 text-blue-600" />
                  <span>Bueno: {datos.nivel_logro.distribucion.bueno}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-green-600 text-green-600" />
                  <span>Destacado: {datos.nivel_logro.distribucion.destacado}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conceptos por Reforzar y Alumnos que Requieren Apoyo - En la misma fila */}
        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          {/* Conceptos por Reforzar */}
          <Card className="border-red-200 bg-red-50/30">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                Conceptos por Reforzar
              </CardTitle>
              <CardDescription>
                Conceptos con bajo logro (menos del 50%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {conceptosPorReforzar.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {conceptosPorReforzar.map((concepto, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/60"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{concepto.concepto}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-3 h-3 rounded-full bg-red-600" />
                          <span className="text-xs text-muted-foreground">
                            Necesita refuerzo
                          </span>
                        </div>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {concepto.porcentaje_logro}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay conceptos que requieran refuerzo
                </p>
              )}
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
        </div>
      </div>
    </div>
  );
}

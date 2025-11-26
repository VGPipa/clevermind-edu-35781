import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2, Circle, Lightbulb } from "lucide-react";
import { DatosPost, RecomendacionPost } from "@/types/metricas-salon";
interface SeccionPostMetricasProps {
  datos: DatosPost;
  recomendaciones: RecomendacionPost[];
}
export function SeccionPostMetricas({
  datos,
  recomendaciones
}: SeccionPostMetricasProps) {
  const getProgressVariant = (porcentaje: number): "success" | "warning" | "danger" => {
    if (porcentaje >= 70) return "success";
    if (porcentaje >= 40) return "warning";
    return "danger";
  };
  return <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Logro de la Clase (POST)</h2>
        <p className="text-muted-foreground text-sm">Conocimientos después de la clase</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Participación del POST */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ff5426]" />
              Participación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Porcentaje de completación</span>
                  <span className="font-semibold">{datos.participacion.porcentaje}%</span>
                </div>
                <Progress value={datos.participacion.porcentaje} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Nivel de Logro del Salón */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#ff5426]" />
              Nivel de Desempeño
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Promedio de logro</span>
                  <span className="font-semibold">{datos.nivel_logro.promedio}%</span>
                </div>
                <Progress 
                  value={datos.nivel_logro.promedio} 
                  variant={getProgressVariant(datos.nivel_logro.promedio)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alumnos que Requieren Apoyo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#ff5426]" />
              Alumnos que requieren refuerzo
            </CardTitle>
            <CardDescription>Alumnos con bajo desempeño</CardDescription>
          </CardHeader>
          <CardContent>
            {datos.alumnos_apoyo.length > 0 ? <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {datos.alumnos_apoyo.map(alumno => <div key={alumno.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium">
                        {alumno.nombre} {alumno.apellido}
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs ml-2">
                      {alumno.porcentaje}%
                    </Badge>
                  </div>)}
              </div> : <p className="text-sm text-muted-foreground">
                No hay alumnos que requieran apoyo adicional
              </p>}
          </CardContent>
        </Card>

        {/* Recomendaciones POST CLASE */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-[#ff5426]" />
              Recomendaciones
            </CardTitle>
            <CardDescription>
              Acciones sugeridas después de la clase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recomendaciones && recomendaciones.length > 0 ? <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {recomendaciones.map((rec, idx) => <div key={idx} className="p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-start gap-2 mb-1">
                      <Badge variant={rec.tipo === 'refuerzo' ? 'destructive' : 'secondary'} className="text-xs">
                        {rec.tipo === 'refuerzo' ? 'Refuerzo' : 'Evaluación'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mb-1">
                      {rec.recomendacion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rec.sugerencia}
                    </p>
                    {rec.evidencia && <p className="text-xs text-muted-foreground mt-1 italic">
                        {rec.evidencia}
                      </p>}
                  </div>)}
              </div> : <p className="text-sm text-muted-foreground">
                No hay recomendaciones disponibles aún
              </p>}
          </CardContent>
        </Card>
      </div>
    </div>;
}
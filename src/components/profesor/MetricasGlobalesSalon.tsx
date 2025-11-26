import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MetricasGlobales } from "@/types/metricas-salon";

interface MetricasGlobalesSalonProps {
  metricas: MetricasGlobales;
  nombreSalon: string;
}

export function MetricasGlobalesSalon({ metricas, nombreSalon }: MetricasGlobalesSalonProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Métricas Globales del Salón</h2>
        <p className="text-muted-foreground text-sm">
          Vista general del desempeño del grupo {nombreSalon} durante el año escolar
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Participación Promedio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Participación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metricas.participacion_promedio}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alumnos que completan quizzes
            </p>
            {metricas.participacion_promedio < 65 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Requiere atención
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Alumnos en Riesgo */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Alumnos en Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">
              {metricas.alumnos_riesgo.cantidad}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metricas.alumnos_riesgo.porcentaje}% del grupo
            </p>
            {metricas.alumnos_riesgo.cantidad > 0 && (
              <Badge variant="destructive" className="mt-2 text-xs">
                Requieren atención
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Dominio por Conceptos */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Dominio por Conceptos</CardTitle>
            <CardDescription className="text-xs">
              {metricas.dominio_por_conceptos.length} conceptos evaluados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricas.dominio_por_conceptos.length > 0 ? (
              <div className="space-y-2">
                {metricas.dominio_por_conceptos.slice(0, 3).map((concepto, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{concepto.concepto}</span>
                    <Badge
                      variant={
                        concepto.nivel_logro === 'alto'
                          ? 'default'
                          : concepto.nivel_logro === 'intermedio'
                          ? 'secondary'
                          : 'destructive'
                      }
                      className="ml-2 text-xs"
                    >
                      {concepto.porcentaje_logro}%
                    </Badge>
                  </div>
                ))}
                {metricas.dominio_por_conceptos.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    +{metricas.dominio_por_conceptos.length - 3} conceptos más
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Áreas Más Fuertes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Áreas Más Fuertes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricas.areas_fuertes.length > 0 ? (
              <div className="space-y-2">
                {metricas.areas_fuertes.map((area, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{area.concepto}</span>
                    <Badge variant="default" className="ml-2 text-xs bg-green-600">
                      {area.porcentaje}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Áreas de Mayor Dificultad */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Áreas de Mayor Dificultad
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metricas.areas_dificultad.length > 0 ? (
              <div className="space-y-2">
                {metricas.areas_dificultad.map((area, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{area.concepto}</span>
                    <Badge variant="destructive" className="ml-2 text-xs">
                      {area.porcentaje}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


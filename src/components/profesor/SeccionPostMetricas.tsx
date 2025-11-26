import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2, Circle } from "lucide-react";
import { DatosPost } from "@/types/metricas-salon";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface SeccionPostMetricasProps {
  datos: DatosPost;
}

export function SeccionPostMetricas({ datos }: SeccionPostMetricasProps) {
  const getSemaforoColor = (semaforo: string) => {
    switch (semaforo) {
      case "verde":
        return "bg-green-600";
      case "amarillo":
        return "bg-yellow-600";
      case "rojo":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSemaforoLabel = (semaforo: string) => {
    switch (semaforo) {
      case "verde":
        return "Logrado";
      case "amarillo":
        return "Medio";
      case "rojo":
        return "Bajo";
      default:
        return "N/A";
    }
  };

  // Datos para gráfico de distribución
  const datosDistribucion = [
    {
      nivel: "En Riesgo",
      cantidad: datos.nivel_logro.distribucion.riesgo,
      color: "#ef4444",
    },
    {
      nivel: "Suficiente",
      cantidad: datos.nivel_logro.distribucion.suficiente,
      color: "#f59e0b",
    },
    {
      nivel: "Bueno",
      cantidad: datos.nivel_logro.distribucion.bueno,
      color: "#3b82f6",
    },
    {
      nivel: "Destacado",
      cantidad: datos.nivel_logro.distribucion.destacado,
      color: "#22c55e",
    },
  ];

  // Datos para gráfico de conceptos
  const datosConceptos = datos.conceptos_logrados.map((c) => ({
    concepto: c.concepto.length > 15 ? c.concepto.substring(0, 15) + "..." : c.concepto,
    porcentaje: c.porcentaje_logro,
    semaforo: c.semaforo,
  }));

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

        {/* Distribución por Niveles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución por Niveles</CardTitle>
            <CardDescription>Distribución de alumnos por nivel de logro</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={datosDistribucion}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nivel" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conceptos Logrados vs No Logrados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conceptos Logrados</CardTitle>
            <CardDescription>Estado de logro por concepto</CardDescription>
          </CardHeader>
          <CardContent>
            {datos.conceptos_logrados.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {datos.conceptos_logrados.map((concepto, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{concepto.concepto}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-3 h-3 rounded-full ${getSemaforoColor(concepto.semaforo)}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {getSemaforoLabel(concepto.semaforo)}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        concepto.semaforo === "verde"
                          ? "default"
                          : concepto.semaforo === "amarillo"
                          ? "secondary"
                          : "destructive"
                      }
                      className="ml-2"
                    >
                      {concepto.porcentaje_logro}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay datos disponibles</p>
            )}
          </CardContent>
        </Card>

        {/* Alumnos que Requieren Apoyo */}
        <Card className="md:col-span-2 border-amber-200 bg-amber-50/30">
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
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
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
  );
}


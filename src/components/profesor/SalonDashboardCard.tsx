import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertTriangle, CheckCircle2, Clock, Calendar } from "lucide-react";
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
import { SalonKPICards } from "./SalonKPICards";

interface SalonDashboardCardProps {
  salon: {
    grupo: {
      id: string;
      nombre: string;
      grado: string;
      seccion: string;
      cantidad_alumnos?: number;
    };
    progreso_general: {
      porcentaje: number;
      total_sesiones: number;
      completadas: number;
      programadas: number;
      pendientes: number;
    };
    resumen: {
      promedio_nota?: number | null;
      comprension_promedio?: number | null;
      participacion_promedio?: number | null;
      completitud_promedio?: number | null;
      alumnos_en_riesgo?: number;
      quizzes_pendientes?: number;
      promedio_quiz_pre?: number | null;
      promedio_quiz_post?: number | null;
    };
    alumnos?: Array<{
      id: string;
      nombre: string;
      apellido: string;
      alertas?: {
        bajoRendimiento?: boolean;
        pocaParticipacion?: boolean;
      };
    }>;
    temas?: Array<{
      tema: {
        id: string;
        nombre: string;
      };
      progreso: {
        completadas: number;
        programadas: number;
        pendientes: number;
        porcentaje: number;
      };
    }>;
  };
}

export function SalonDashboardCard({ salon }: SalonDashboardCardProps) {
  // Preparar datos para gráfico de progreso por tema
  const datosProgresoTemas = salon.temas?.map((tema) => ({
    nombre: tema.tema.nombre.length > 15 
      ? tema.tema.nombre.substring(0, 15) + "..." 
      : tema.tema.nombre,
    completadas: tema.progreso.completadas,
    programadas: tema.progreso.programadas,
    pendientes: tema.progreso.pendientes,
  })) || [];

  // Alumnos en riesgo destacados
  const alumnosEnRiesgo = salon.alumnos?.filter(
    (a) => a.alertas?.bajoRendimiento || a.alertas?.pocaParticipacion
  ).slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Header del Salón */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {salon.grupo.nombre}
              </CardTitle>
              <CardDescription className="mt-1">
                {salon.grupo.grado}° - Sección {salon.grupo.seccion}
                {salon.grupo.cantidad_alumnos && (
                  <span className="ml-2">• {salon.grupo.cantidad_alumnos} alumnos</span>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progreso General */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso General</span>
              <span className="font-medium">{salon.progreso_general.porcentaje}%</span>
            </div>
            <Progress value={salon.progreso_general.porcentaje} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{salon.progreso_general.completadas} completadas</span>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <Calendar className="h-3 w-3" />
                  <span>{salon.progreso_general.programadas} programadas</span>
                </div>
                <div className="flex items-center gap-1 text-orange-600">
                  <Clock className="h-3 w-3" />
                  <span>{salon.progreso_general.pendientes} pendientes</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <SalonKPICards resumen={salon.resumen} />

      {/* Gráfico de Progreso por Tema */}
      {datosProgresoTemas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progreso por Tema</CardTitle>
            <CardDescription>Estado de sesiones por tema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosProgresoTemas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="nombre" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completadas" fill="#22c55e" name="Completadas" />
                <Bar dataKey="programadas" fill="#3b82f6" name="Programadas" />
                <Bar dataKey="pendientes" fill="#f97316" name="Pendientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alumnos en Riesgo Destacados */}
      {alumnosEnRiesgo.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Alumnos que Requieren Atención
            </CardTitle>
            <CardDescription>
              Alumnos con bajo rendimiento o poca participación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alumnosEnRiesgo.map((alumno) => {
                const alertas: string[] = [];
                if (alumno.alertas?.bajoRendimiento) alertas.push("Bajo rendimiento");
                if (alumno.alertas?.pocaParticipacion) alertas.push("Baja participación");
                
                return (
                  <div
                    key={alumno.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/60"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        {alumno.nombre} {alumno.apellido}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {alertas.map((alerta) => (
                          <Badge key={alerta} variant="destructive" className="text-[10px]">
                            {alerta}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


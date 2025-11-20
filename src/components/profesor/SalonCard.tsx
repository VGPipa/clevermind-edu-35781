import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  AlertTriangle,
  Activity,
  Target,
  ClipboardList,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SesionCard } from "./SesionCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SalonCardProps {
  salon: {
    grupo: {
      id: string;
      nombre: string;
      grado: string;
      seccion: string;
      cantidad_alumnos?: number;
    };
    temas: Array<{
      tema: {
        id: string;
        nombre: string;
        materia: {
          id: string;
          nombre: string;
        };
      };
      sesiones: Array<any>;
      progreso: {
        completadas: number;
        programadas: number;
        pendientes: number;
        total: number;
        porcentaje: number;
      };
    }>;
    progreso_general: {
      porcentaje: number;
      total_sesiones: number;
      completadas: number;
      programadas: number;
      pendientes: number;
    };
    resumen?: {
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
      grado?: string | null;
      seccion?: string | null;
      promedio_nota?: number | null;
      promedio_aciertos?: number | null;
      quizzes_completados?: number;
      quizzes_pendientes?: number;
      alertas?: {
        bajoRendimiento?: boolean;
        pocaParticipacion?: boolean;
      };
      ultima_retroalimentacion?: {
        tipo: string;
        resumen?: string;
        fecha?: string;
      } | null;
    }>;
    recomendaciones?: Array<{
      id: string;
      tipo?: string | null;
      aplicada?: boolean | null;
      contenido?: any;
      created_at?: string | null;
      clase?: {
        numero_sesion?: number | null;
        fecha_programada?: string | null;
        estado?: string | null;
      } | null;
    }>;
    retroalimentaciones?: Array<{
      id: string;
      tipo: string;
      id_alumno?: string | null;
      contenido?: any;
      fecha_envio?: string | null;
      created_at?: string | null;
    }>;
  };
  onProgramarSesion?: (temaId: string, grupoId: string) => void;
  onVerSesion?: (sesion: any) => void;
}

export function SalonCard({ salon, onProgramarSesion, onVerSesion }: SalonCardProps) {
  const [expanded, setExpanded] = useState(false);

  const totalTemas = salon.temas.length;
  const totalSesiones = salon.progreso_general.total_sesiones;

  return (
    <Card className="hover:shadow-md transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg font-semibold">{salon.grupo.nombre}</CardTitle>
            </div>
            <CardDescription className="text-sm">
              {salon.grupo.grado}° - Sección {salon.grupo.seccion}
              {salon.grupo.cantidad_alumnos && (
                <span className="ml-2">• {salon.grupo.cantidad_alumnos} alumnos</span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progreso General */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso General</span>
            <span className="font-medium">{salon.progreso_general.porcentaje}%</span>
          </div>
          <Progress value={salon.progreso_general.porcentaje} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
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

        {/* Resumen de Temas */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {totalTemas} {totalTemas === 1 ? 'tema' : 'temas'} • {totalSesiones} sesiones
          </span>
        </div>

        {/* Temas y gestión de alumnos */}
        {expanded && (
          <div className="space-y-6 pt-4 border-t">
            <div className="space-y-4">
              {salon.temas.map((temaData) => (
                <div key={temaData.tema.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{temaData.tema.nombre}</h4>
                      <p className="text-xs text-muted-foreground">{temaData.tema.materia.nombre}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {temaData.progreso.porcentaje}%
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0"
                        onClick={() => onProgramarSesion?.(temaData.tema.id, salon.grupo.id)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={temaData.progreso.porcentaje} className="h-1.5" />
                  <div className="text-xs text-muted-foreground">
                    {temaData.progreso.completadas} completadas • {temaData.progreso.programadas} programadas • {temaData.progreso.pendientes} pendientes
                  </div>

                  {/* Sesiones del tema */}
                  {temaData.sesiones.length > 0 && (
                    <div className="space-y-2 mt-3 pl-4 border-l-2 border-muted">
                      {temaData.sesiones.map((sesion) => (
                      <SesionCard
                        key={sesion.id}
                        sesion={sesion}
                        temaNombre={temaData.tema.nombre}
                        onVerDetalle={() => onVerSesion?.(sesion)}
                      />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {salon.resumen && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <MetricCard
                    icon={<Activity className="h-4 w-4 text-primary" />}
                    title="Comprensión promedio"
                    value={
                      salon.resumen?.comprension_promedio !== undefined && salon.resumen?.comprension_promedio !== null
                        ? `${Math.round((salon.resumen?.comprension_promedio || 0) * 100) / 100}%`
                        : "—"
                    }
                    helper="Basado en resultados de clases"
                  />
                  <MetricCard
                    icon={<Target className="h-4 w-4 text-primary" />}
                    title="Promedio nota"
                    value={
                      salon.resumen?.promedio_nota !== undefined && salon.resumen?.promedio_nota !== null
                        ? `${(salon.resumen?.promedio_nota || 0).toFixed(1)} / 20`
                        : "—"
                    }
                    helper="Notas de quizzes"
                  />
                  <MetricCard
                    icon={<ClipboardList className="h-4 w-4 text-primary" />}
                    title="Quizzes pendientes"
                    value={salon.resumen?.quizzes_pendientes ?? 0}
                    helper="En todo el salón"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <MetricCard
                    icon={<Users className="h-4 w-4 text-primary" />}
                    title="Alumnos en riesgo"
                    value={salon.resumen?.alumnos_en_riesgo ?? 0}
                    helper="Bajo rendimiento o poca participación"
                    tone="warning"
                  />
                  <MetricCard
                    icon={<CheckCircle2 className="h-4 w-4 text-primary" />}
                    title="Participación promedio"
                    value={
                      salon.resumen?.participacion_promedio !== undefined && salon.resumen?.participacion_promedio !== null
                        ? `${Math.round((salon.resumen?.participacion_promedio || 0) * 100) / 100}%`
                        : "—"
                    }
                    helper="Tasa de participación"
                  />
                </div>
              </div>
            )}

            {salon.alumnos && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">Alumnos y progreso</h4>
                    <p className="text-xs text-muted-foreground">
                      Métricas por alumno basadas en quizzes y retroalimentaciones
                    </p>
                  </div>
                </div>
                {salon.alumnos.length > 0 ? (
                  <ScrollArea className="max-h-80">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Alumno</TableHead>
                          <TableHead>Prom. nota</TableHead>
                          <TableHead>Prom. aciertos</TableHead>
                          <TableHead>Quizzes</TableHead>
                          <TableHead>Alertas</TableHead>
                          <TableHead>Última retro</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salon.alumnos.map((alumno) => {
                        const alertas: string[] = [];
                        if (alumno.alertas?.bajoRendimiento) alertas.push("Bajo rendimiento");
                        if (alumno.alertas?.pocaParticipacion) alertas.push("Baja participación");
                        return (
                          <TableRow key={alumno.id}>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {alumno.nombre} {alumno.apellido}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {alumno.grado ?? salon.grupo.grado}° {alumno.seccion ?? salon.grupo.seccion}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {typeof alumno.promedio_nota === "number" ? alumno.promedio_nota.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell>
                              {typeof alumno.promedio_aciertos === "number" ? `${alumno.promedio_aciertos.toFixed(0)}%` : "—"}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {alumno.quizzes_completados ?? 0}/{(alumno.quizzes_completados ?? 0) + (alumno.quizzes_pendientes ?? 0)}
                              </span>
                            </TableCell>
                            <TableCell>
                              {alertas.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {alertas.map((alerta) => (
                                    <Badge key={alerta} variant="destructive" className="text-[11px]">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      {alerta}
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-[11px]">
                                  Sin alertas
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {alumno.ultima_retroalimentacion ? (
                                <>
                                  <span className="block capitalize">{alumno.ultima_retroalimentacion.tipo.replace("_", " ")}</span>
                                  {alumno.ultima_retroalimentacion.fecha && (
                                    <span>
                                      {new Date(alumno.ultima_retroalimentacion.fecha).toLocaleDateString("es-ES", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                    </span>
                                  )}
                                </>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    No hay datos de alumnos disponibles aún
                  </div>
                )}
              </div>
            )}

            {salon.recomendaciones && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Recomendaciones recientes</h4>
                {salon.recomendaciones.length > 0 ? (
                  <div className="space-y-2">
                    {salon.recomendaciones.slice(0, 4).map((recomendacion) => (
                    <div
                      key={recomendacion.id}
                      className={cn(
                        "p-3 rounded-lg border text-sm",
                        recomendacion.aplicada ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[11px] capitalize">
                            {recomendacion.tipo || "clase"}
                          </Badge>
                          {recomendacion.clase?.numero_sesion && (
                            <span className="text-xs text-muted-foreground">Sesión {recomendacion.clase.numero_sesion}</span>
                          )}
                        </div>
                        <Badge variant={recomendacion.aplicada ? "secondary" : "destructive"} className="text-[11px]">
                          {recomendacion.aplicada ? "Aplicada" : "Pendiente"}
                        </Badge>
                      </div>
                      {recomendacion.contenido?.resumen && (
                        <p className="mt-2 text-muted-foreground text-xs">{recomendacion.contenido.resumen}</p>
                      )}
                      {recomendacion.created_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(recomendacion.created_at).toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                        </p>
                      )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    No hay recomendaciones disponibles aún
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  icon: ReactNode;
  title: string;
  value: string | number;
  helper?: string;
  tone?: "default" | "warning";
}

function MetricCard({ icon, title, value, helper, tone = "default" }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3 text-sm",
        tone === "warning" ? "border-amber-200 bg-amber-50/60" : "border-border bg-muted/40",
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs">{icon}<span>{title}</span></div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {helper && <p className="text-xs text-muted-foreground mt-1">{helper}</p>}
    </div>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Recomendacion {
  id: string;
  tipo?: string | null;
  aplicada?: boolean | null;
  contenido?: any;
  created_at?: string | null;
  clase?: {
    id?: string;
    numero_sesion?: number | null;
    fecha_programada?: string | null;
    estado?: string | null;
  } | null;
}

interface RecomendacionesSectionProps {
  recomendaciones: Recomendacion[];
  onAplicarRecomendacion?: (recomendacionId: string) => void;
  onGenerarRecomendaciones?: () => void;
}

export function RecomendacionesSection({
  recomendaciones,
  onAplicarRecomendacion,
  onGenerarRecomendaciones,
}: RecomendacionesSectionProps) {
  const recomendacionesPendientes = recomendaciones.filter(
    (r) => !r.aplicada
  );
  const recomendacionesAplicadas = recomendaciones.filter((r) => r.aplicada);

  const getTipoBadge = (tipo: string | null | undefined) => {
    if (!tipo) return null;
    return (
      <Badge variant="outline" className="text-[11px] capitalize">
        {tipo.replace("_", " ")}
      </Badge>
    );
  };

  const getContenidoResumen = (contenido: any): string => {
    if (!contenido) return "Sin descripción";
    if (typeof contenido === "string") return contenido;
    if (contenido.resumen) return contenido.resumen;
    if (contenido.descripcion) return contenido.descripcion;
    if (contenido.mensaje) return contenido.mensaje;
    return "Recomendación disponible";
  };

  return (
    <div className="space-y-6">
      {/* Header con acción */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Recomendaciones
              </CardTitle>
              <CardDescription>
                Recomendaciones generadas basadas en resultados y desempeño
              </CardDescription>
            </div>
            {onGenerarRecomendaciones && (
              <Button onClick={onGenerarRecomendaciones}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generar Nuevas
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Estadísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{recomendaciones.length}</div>
              <p className="text-sm text-muted-foreground mt-1">
                Total Recomendaciones
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">
                {recomendacionesPendientes.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Pendientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {recomendacionesAplicadas.length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Aplicadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendaciones Pendientes */}
      {recomendacionesPendientes.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Recomendaciones Pendientes
            </CardTitle>
            <CardDescription>
              Recomendaciones que aún no han sido aplicadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {recomendacionesPendientes.map((recomendacion) => (
                  <div
                    key={recomendacion.id}
                    className="p-4 rounded-lg border border-amber-200 bg-white/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getTipoBadge(recomendacion.tipo)}
                          {recomendacion.clase?.numero_sesion && (
                            <span className="text-xs text-muted-foreground">
                              Sesión {recomendacion.clase.numero_sesion}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground">
                          {getContenidoResumen(recomendacion.contenido)}
                        </p>
                        {recomendacion.created_at && (
                          <p className="text-xs text-muted-foreground">
                            Generada el{" "}
                            {new Date(
                              recomendacion.created_at
                            ).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                      {onAplicarRecomendacion && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            onAplicarRecomendacion(recomendacion.id)
                          }
                        >
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          Aplicar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Recomendaciones Aplicadas */}
      {recomendacionesAplicadas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Recomendaciones Aplicadas
            </CardTitle>
            <CardDescription>
              Recomendaciones que ya han sido implementadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {recomendacionesAplicadas.map((recomendacion) => (
                  <div
                    key={recomendacion.id}
                    className="p-4 rounded-lg border border-green-200 bg-green-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          {getTipoBadge(recomendacion.tipo)}
                          {recomendacion.clase?.numero_sesion && (
                            <span className="text-xs text-muted-foreground">
                              Sesión {recomendacion.clase.numero_sesion}
                            </span>
                          )}
                          <Badge variant="secondary" className="text-[11px]">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Aplicada
                          </Badge>
                        </div>
                        <p className="text-sm text-foreground">
                          {getContenidoResumen(recomendacion.contenido)}
                        </p>
                        {recomendacion.created_at && (
                          <p className="text-xs text-muted-foreground">
                            Generada el{" "}
                            {new Date(
                              recomendacion.created_at
                            ).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Estado vacío */}
      {recomendaciones.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No hay recomendaciones disponibles aún
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Las recomendaciones aparecerán aquí una vez que se generen basadas
              en los resultados de las clases
            </p>
            {onGenerarRecomendaciones && (
              <Button
                className="mt-4"
                variant="outline"
                onClick={onGenerarRecomendaciones}
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Generar Recomendaciones
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}


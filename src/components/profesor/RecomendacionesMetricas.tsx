import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Recomendaciones } from "@/types/metricas-salon";

interface RecomendacionesMetricasProps {
  recomendaciones: Recomendaciones;
}

export function RecomendacionesMetricas({ recomendaciones }: RecomendacionesMetricasProps) {
  const [preExpandido, setPreExpandido] = useState(true);
  const [postExpandido, setPostExpandido] = useState(true);

  if (!recomendaciones) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay recomendaciones disponibles</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Recomendaciones Accionables</h2>
        <p className="text-muted-foreground text-sm">
          Recomendaciones para mejorar la clase actual y futuras sesiones
        </p>
      </div>

      {/* Recomendaciones PRE */}
      <Card>
        <CardHeader>
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setPreExpandido(!preExpandido)}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <CardTitle>Recomendaciones PREVIO A LA CLASE</CardTitle>
            </div>
            {preExpandido ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription>
            Recomendaciones para ajustar el inicio de la clase según lo que el grupo NO sabía
          </CardDescription>
        </CardHeader>
        {preExpandido && (
          <CardContent>
            {recomendaciones.pre?.length > 0 ? (
              <div className="space-y-4">
                {recomendaciones.pre.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border border-primary/20 bg-primary/5"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">
                          Recomendación
                        </Badge>
                        <p className="text-sm font-medium flex-1">{rec.recomendacion}</p>
                      </div>
                      <div className="flex items-start gap-2 pl-6">
                        <Badge variant="secondary" className="mt-0.5">
                          Sugerencia
                        </Badge>
                        <p className="text-sm text-muted-foreground flex-1">
                          {rec.sugerencia}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay recomendaciones PRE disponibles aún
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Recomendaciones POST */}
      <Card>
        <CardHeader>
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setPostExpandido(!postExpandido)}
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              <CardTitle>Recomendaciones POST CLASE</CardTitle>
            </div>
            {postExpandido ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription>
            Recomendaciones para mejorar la próxima sesión y evaluar la efectividad de la guía
          </CardDescription>
        </CardHeader>
        {postExpandido && (
          <CardContent>
            {recomendaciones.post?.length > 0 ? (
              <div className="space-y-6">
                {/* Refuerzo para próxima sesión */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-green-700">
                    Refuerzo para Próxima Sesión
                  </h4>
                  <div className="space-y-3">
                    {recomendaciones.post
                      .filter((r) => r.tipo === "refuerzo")
                      .map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-green-200 bg-green-50/30"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="outline" className="mt-0.5">
                                Recomendación
                              </Badge>
                              <p className="text-sm font-medium flex-1">{rec.recomendacion}</p>
                            </div>
                            <div className="flex items-start gap-2 pl-6">
                              <Badge variant="secondary" className="mt-0.5">
                                Sugerencia
                              </Badge>
                              <p className="text-sm text-muted-foreground flex-1">
                                {rec.sugerencia}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Evaluar efectividad de la guía */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-blue-700">
                    Evaluar Efectividad de la Guía
                  </h4>
                  <div className="space-y-3">
                    {recomendaciones.post
                      .filter((r) => r.tipo === "evaluacion_guia")
                      .map((rec, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-lg border border-blue-200 bg-blue-50/30"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Badge variant="outline" className="mt-0.5">
                                Recomendación
                              </Badge>
                              <p className="text-sm font-medium flex-1">{rec.recomendacion}</p>
                            </div>
                            <div className="flex items-start gap-2 pl-6">
                              <Badge variant="secondary" className="mt-0.5">
                                Sugerencia
                              </Badge>
                              <p className="text-sm text-muted-foreground flex-1">
                                {rec.sugerencia}
                              </p>
                            </div>
                            {rec.evidencia && (
                              <div className="pl-6 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  Evidencia: {rec.evidencia}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay recomendaciones POST disponibles aún
              </p>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}


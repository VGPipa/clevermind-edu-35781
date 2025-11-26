import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, School } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { MetricasGlobalesSalon } from "@/components/profesor/MetricasGlobalesSalon";
import { SeccionPreMetricas } from "@/components/profesor/SeccionPreMetricas";
import { SeccionPostMetricas } from "@/components/profesor/SeccionPostMetricas";
import { ResponseMisSalones } from "@/types/metricas-salon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function MisSalones() {
  const queryClient = useQueryClient();
  const [filtroSalon, setFiltroSalon] = useState<string>("todos");
  const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null);
  const [temaSeleccionado, setTemaSeleccionado] = useState<string | null>(null);
  const [claseSeleccionada, setClaseSeleccionada] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<ResponseMisSalones>({
    queryKey: ["mis-salones"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mis-salones");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">Error al cargar los salones</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error instanceof Error ? error.message : "Error desconocido"}
              </p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const salones = data?.salones || [];

  const salonesFiltrados =
    filtroSalon === "todos"
      ? salones
      : salones.filter((s) => s.grupo.id === filtroSalon);

  const salonSeleccionado =
    filtroSalon !== "todos"
      ? salonesFiltrados[0]
      : salonesFiltrados.length === 1
        ? salonesFiltrados[0]
        : null;

  // Si hay múltiples salones, mostrar selector
  if (salones.length > 1 && !salonSeleccionado) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Mis Salones
            </h1>
            <p className="text-muted-foreground mt-2">
              Selecciona un salón para ver sus métricas
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {salones.map((salon) => (
              <Card
                key={salon.grupo.id}
                className="hover:shadow-md transition-all cursor-pointer"
                onClick={() => setFiltroSalon(salon.grupo.id)}
              >
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{salon.grupo.nombre}</h3>
                    <p className="text-sm text-muted-foreground">
                      {salon.grupo.grado}° - Sección {salon.grupo.seccion}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {salon.grupo.cantidad_alumnos || 0} alumnos
                    </p>
                    <p className="text-sm text-primary mt-4">Ver métricas →</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Si no hay salones
  if (salones.length === 0) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="py-12 text-center">
            <School className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No hay salones disponibles
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Los salones aparecerán aquí una vez que tengas asignaciones activas
            </p>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Vista principal con métricas
  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-black dark:text-white">
            Mis Salones
          </h1>
          <p className="text-muted-foreground mt-2">
            Métricas y análisis del desempeño del grupo
          </p>
        </div>

        {/* Selector de Salón y Filtros */}
        {salonSeleccionado && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Filtro Salón (si hay múltiples) */}
              {salones.length > 1 && (
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium">Salón:</label>
                  <select
                    value={filtroSalon}
                    onChange={(e) => setFiltroSalon(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="todos">Todos los salones</option>
                    {salones.map((salon) => (
                      <option key={salon.grupo.id} value={salon.grupo.id}>
                        {salon.grupo.nombre} - {salon.grupo.grado}° {salon.grupo.seccion}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Filtros de Materia, Tema, Clase */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* Filtro Materia */}
                <div className="space-y-2">
                  <Label>Materia</Label>
                  <Select
                    value={materiaSeleccionada || "todos"}
                    onValueChange={(value) => {
                      setMateriaSeleccionada(value === "todos" ? null : value);
                      setTemaSeleccionado(null);
                      setClaseSeleccionada(null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las materias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las materias</SelectItem>
                      {salonSeleccionado.filtros.materias?.map((materia) => (
                        <SelectItem key={materia.id} value={materia.id}>
                          {materia.nombre}
                        </SelectItem>
                      )) || []}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Tema */}
                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={temaSeleccionado || "todos"}
                    onValueChange={(value) => {
                      setTemaSeleccionado(value === "todos" ? null : value);
                      setClaseSeleccionada(null);
                    }}
                    disabled={!materiaSeleccionada && (salonSeleccionado.filtros.materias?.length || 0) > 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los temas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los temas</SelectItem>
                      {(materiaSeleccionada
                        ? salonSeleccionado.filtros.temas?.filter((t) => t.id_materia === materiaSeleccionada) || []
                        : salonSeleccionado.filtros.temas || []
                      ).map((tema) => (
                        <SelectItem key={tema.id} value={tema.id}>
                          {tema.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro Clase */}
                <div className="space-y-2">
                  <Label>Clase / Sesión</Label>
                  <Select
                    value={claseSeleccionada || "todos"}
                    onValueChange={(value) => {
                      setClaseSeleccionada(value === "todos" ? null : value);
                    }}
                    disabled={!temaSeleccionado && (salonSeleccionado.filtros.temas?.length || 0) > 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las clases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todas las clases</SelectItem>
                      {(temaSeleccionado
                        ? salonSeleccionado.filtros.clases?.filter((c) => c.id_tema === temaSeleccionado) || []
                        : salonSeleccionado.filtros.clases || []
                      ).map((clase) => (
                        <SelectItem key={clase.id} value={clase.id}>
                          Sesión {clase.numero_sesion || "N/A"}
                          {clase.fecha_programada &&
                            ` - ${new Date(clase.fecha_programada).toLocaleDateString("es-ES", {
                              month: "short",
                              day: "numeric",
                            })}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido Principal */}
        {salonSeleccionado && (
          <>

            {/* Métricas Globales */}
            <MetricasGlobalesSalon
              metricas={salonSeleccionado.metricas_globales}
              nombreSalon={salonSeleccionado.grupo.nombre}
            />

            {/* Sección PRE */}
            {salonSeleccionado.datos_pre ? (
              <SeccionPreMetricas 
                datos={salonSeleccionado.datos_pre} 
                recomendaciones={salonSeleccionado.recomendaciones.pre}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No hay datos PRE disponibles aún
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Los datos aparecerán aquí una vez que se completen evaluaciones PRE
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sección POST */}
            {salonSeleccionado.datos_post ? (
              <SeccionPostMetricas 
                datos={salonSeleccionado.datos_post}
                recomendaciones={salonSeleccionado.recomendaciones.post}
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No hay datos POST disponibles aún
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Los datos aparecerán aquí una vez que se completen evaluaciones POST
                  </p>
                </CardContent>
              </Card>
            )}

          </>
        )}
      </div>
    </AppLayout>
  );
}

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, School, Users, BookOpen, Lightbulb, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SalonDashboardCard } from "@/components/profesor/SalonDashboardCard";
import { AlumnosResultadosTable } from "@/components/profesor/AlumnosResultadosTable";
import { ClasesResultadosSection } from "@/components/profesor/ClasesResultadosSection";
import { RecomendacionesSection } from "@/components/profesor/RecomendacionesSection";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function MisSalones() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filtroSalon, setFiltroSalon] = useState<string>("todos");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["mis-salones"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-mis-salones");
      if (error) throw error;
      return data;
    },
  });

  const handleVerClase = (claseId: string) => {
    navigate(`/profesor/mis-clases?clase=${claseId}`);
  };

  const handleVerDetalleAlumno = (alumnoId: string) => {
    // Navegar a detalle del alumno si existe esa página
    // Por ahora solo mostrar toast
    toast({
      title: "Detalle de alumno",
      description: `Ver detalles del alumno ${alumnoId}`,
    });
  };

  const handleGenerarRetro = (alumnoId: string) => {
    // Navegar a generar retroalimentación
    toast({
      title: "Generar retroalimentación",
      description: `Generar retroalimentación para el alumno ${alumnoId}`,
    });
  };

  const handleAplicarRecomendacion = (recomendacionId: string) => {
    // Marcar recomendación como aplicada
    toast({
      title: "Recomendación aplicada",
      description: "La recomendación ha sido marcada como aplicada",
    });
    refetch();
  };

  const handleGenerarRecomendaciones = () => {
    // Generar nuevas recomendaciones
    toast({
      title: "Generar recomendaciones",
      description: "Generando nuevas recomendaciones basadas en los resultados...",
    });
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
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
  
  // Asegurar que cada salón tenga la estructura completa esperada
  const salonesConEstructura = salones.map((salon: any) => ({
    ...salon,
    resumen: salon.resumen || {
      promedio_nota: null,
      comprension_promedio: null,
      participacion_promedio: null,
      completitud_promedio: null,
      alumnos_en_riesgo: 0,
      quizzes_pendientes: 0,
      promedio_quiz_pre: null,
      promedio_quiz_post: null,
    },
    alumnos: Array.isArray(salon.alumnos) ? salon.alumnos : [],
    recomendaciones: Array.isArray(salon.recomendaciones) ? salon.recomendaciones : [],
    retroalimentaciones: Array.isArray(salon.retroalimentaciones) ? salon.retroalimentaciones : [],
    temas: Array.isArray(salon.temas) ? salon.temas : [],
  }));

  const salonesFiltrados =
    filtroSalon === "todos"
      ? salonesConEstructura
      : salonesConEstructura.filter((s: any) => s.grupo?.id === filtroSalon);

  const salonSeleccionado =
    filtroSalon !== "todos"
      ? salonesFiltrados[0]
      : salonesFiltrados.length === 1
        ? salonesFiltrados[0]
        : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Mis Salones
            </h1>
            <p className="text-muted-foreground mt-2">
              Visualiza resultados de alumnos, clases y recomendaciones por salón
            </p>
          </div>
        </div>

        {/* Filtro de Salón */}
        {salonesConEstructura.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-xs">
                <Label>Seleccionar Salón</Label>
                <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los salones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los salones</SelectItem>
                    {salonesConEstructura.map((salon: any) => (
                      <SelectItem key={salon.grupo?.id} value={salon.grupo?.id}>
                        {salon.grupo?.nombre} - {salon.grupo?.grado}° {salon.grupo?.seccion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contenido Principal */}
        {salonesFiltrados.length === 0 ? (
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
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Vista General
              </TabsTrigger>
              <TabsTrigger value="alumnos" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Alumnos
              </TabsTrigger>
              <TabsTrigger value="clases" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Clases
              </TabsTrigger>
              <TabsTrigger value="recomendaciones" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Recomendaciones
              </TabsTrigger>
            </TabsList>

            {/* Vista General */}
            <TabsContent value="general" className="space-y-6">
              {salonesFiltrados.length === 1 ? (
                <SalonDashboardCard salon={salonesFiltrados[0]} />
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {salonesFiltrados.map((salon: any) => (
                    <Card key={salon.grupo.id} className="hover:shadow-md transition-all">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          {salon.grupo.nombre}
                        </CardTitle>
                        <CardDescription>
                          {salon.grupo.grado}° - Sección {salon.grupo.seccion}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-muted-foreground">Progreso General</span>
                              <span className="font-medium">
                                {salon.progreso_general?.porcentaje ?? 0}%
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {salon.progreso_general?.completadas ?? 0} completadas •{" "}
                              {salon.progreso_general?.programadas ?? 0} programadas
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">Promedio Nota</div>
                              <div className="font-semibold">
                                {salon.resumen?.promedio_nota !== null &&
                                salon.resumen?.promedio_nota !== undefined
                                  ? `${salon.resumen.promedio_nota.toFixed(1)}`
                                  : "—"}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Alumnos en Riesgo</div>
                              <div className="font-semibold">
                                {salon.resumen?.alumnos_en_riesgo ?? 0}
                              </div>
                            </div>
                          </div>
                          <div
                            className="text-sm text-primary cursor-pointer hover:underline"
                            onClick={() => setFiltroSalon(salon.grupo.id)}
                          >
                            Ver detalles →
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Resultados de Alumnos */}
            <TabsContent value="alumnos" className="space-y-6">
              {salonSeleccionado ? (
                <AlumnosResultadosTable
                  alumnos={salonSeleccionado.alumnos}
                  grupoNombre={salonSeleccionado.grupo.nombre}
                  onVerDetalle={handleVerDetalleAlumno}
                  onGenerarRetro={handleGenerarRetro}
                />
              ) : (
                <div className="space-y-6">
                  {salonesFiltrados.map((salon: any) => (
                    <div key={salon.grupo.id}>
                      <h3 className="text-lg font-semibold mb-4">
                        {salon.grupo.nombre} - {salon.grupo.grado}° {salon.grupo.seccion}
                      </h3>
                      <AlumnosResultadosTable
                        alumnos={salon.alumnos}
                        grupoNombre={salon.grupo.nombre}
                        onVerDetalle={handleVerDetalleAlumno}
                        onGenerarRetro={handleGenerarRetro}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Resultados de Clases */}
            <TabsContent value="clases" className="space-y-6">
              {salonSeleccionado ? (
                <ClasesResultadosSection
                  temas={salonSeleccionado.temas}
                  onVerClase={handleVerClase}
                />
              ) : (
                <div className="space-y-6">
                  {salonesFiltrados.map((salon: any) => (
                    <div key={salon.grupo.id}>
                      <h3 className="text-lg font-semibold mb-4">
                        {salon.grupo.nombre} - {salon.grupo.grado}° {salon.grupo.seccion}
                      </h3>
                      <ClasesResultadosSection
                        temas={salon.temas}
                        onVerClase={handleVerClase}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recomendaciones */}
            <TabsContent value="recomendaciones" className="space-y-6">
              {salonSeleccionado ? (
                <RecomendacionesSection
                  recomendaciones={salonSeleccionado.recomendaciones}
                  onAplicarRecomendacion={handleAplicarRecomendacion}
                  onGenerarRecomendaciones={handleGenerarRecomendaciones}
                />
              ) : (
                <div className="space-y-6">
                  {salonesFiltrados.map((salon: any) => (
                    <div key={salon.grupo.id}>
                      <h3 className="text-lg font-semibold mb-4">
                        {salon.grupo.nombre} - {salon.grupo.grado}° {salon.grupo.seccion}
                      </h3>
                      <RecomendacionesSection
                        recomendaciones={salon.recomendaciones}
                        onAplicarRecomendacion={handleAplicarRecomendacion}
                        onGenerarRecomendaciones={handleGenerarRecomendaciones}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}

import { useMemo, ReactNode, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  Brain,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/profesor/StatsCard";
import { FechaSelector } from "@/components/profesor/FechaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaseActionsMenu } from "@/components/profesor/ClaseActionsMenu";

export default function ProfesorDashboard() {
  const navigate = useNavigate();
  const [fechaReferencia, setFechaReferencia] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-profesor', fechaReferencia],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-profesor', {
        body: { fecha_referencia: fechaReferencia },
      });
      if (error) throw error;
      return data;
    }
  });

  const stats = [
    { 
      title: "Clases esta semana", 
      value: dashboardData?.stats?.classes_this_week?.toString() || "0", 
      icon: BookOpen 
    },
    { 
      title: "Materias asignadas", 
      value: dashboardData?.stats?.assigned_subjects?.toString() || "0", 
      icon: GraduationCap 
    },
    { 
      title: "Total estudiantes", 
      value: dashboardData?.stats?.total_students?.toString() || "0", 
      icon: Users 
    },
    { 
      title: "Promedio general", 
      value: dashboardData?.stats?.general_average?.toString() || "0.0", 
      icon: TrendingUp 
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM", { locale: es });
  };

  const getClaseStage = (estado: string) => {
    const estadoMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'borrador': { label: "Borrador", variant: "outline" },
      'generando_clase': { label: "Generando clase", variant: "secondary" },
      'editando_guia': { label: "Editando guía", variant: "secondary" },
      'guia_aprobada': { label: "Guía aprobada", variant: "default" },
      'quiz_pre_generando': { label: "Generando quiz PRE", variant: "secondary" },
      'quiz_pre_enviado': { label: "Quiz PRE enviado", variant: "default" },
      'analizando_quiz_pre': { label: "Analizando quiz PRE", variant: "secondary" },
      'modificando_guia': { label: "Modificando guía", variant: "secondary" },
      'guia_final': { label: "Guía final lista", variant: "default" },
      'clase_programada': { label: "Clase programada", variant: "default" },
      'en_clase': { label: "En clase", variant: "default" },
      'quiz_post_generando': { label: "Generando quiz POST", variant: "secondary" },
      'quiz_post_enviado': { label: "Quiz POST enviado", variant: "default" },
      'analizando_resultados': { label: "Analizando resultados", variant: "secondary" },
      'completada': { label: "Completada", variant: "default" },
    };

    return estadoMap[estado] || { label: estado, variant: "outline" };
  };


  // Separar clases en 2 bloques principales
  const clasesEnPreparacion = useMemo(() => {
    if (!dashboardData?.clases_pendientes) return [];

    return dashboardData.clases_pendientes.map((clase: any) => ({
      ...clase,
      estado_label: getClaseStage(clase.estado).label,
      estado_variant: getClaseStage(clase.estado).variant,
    }));
  }, [dashboardData]);

  const clasesCalendario = useMemo(() => {
    if (!dashboardData?.clases_listas) return [];

    return dashboardData.clases_listas
      .map((clase: any) => ({
        ...clase,
        estado_label: getClaseStage(clase.estado).label,
        estado_variant: getClaseStage(clase.estado).variant,
      }))
      .sort((a: any, b: any) => {
        if (!a.fecha_programada) return 1;
        if (!b.fecha_programada) return -1;
        return (
          new Date(a.fecha_programada).getTime() -
          new Date(b.fecha_programada).getTime()
        );
      });
  }, [dashboardData]);

  // Agrupar clases del calendario por categorías temporales
  const groupedCalendario = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);

    const groups = {
      hoy: [] as typeof clasesCalendario,
      manana: [] as typeof clasesCalendario,
      estaSemana: [] as typeof clasesCalendario,
      proximamente: [] as typeof clasesCalendario,
    };

    clasesCalendario.forEach((clase: any) => {
      if (!clase.fecha_programada) {
        groups.proximamente.push(clase);
        return;
      }
      const claseDate = new Date(clase.fecha_programada);
      claseDate.setHours(0, 0, 0, 0);

      if (claseDate.getTime() === today.getTime()) {
        groups.hoy.push(clase);
      } else if (claseDate.getTime() === tomorrow.getTime()) {
        groups.manana.push(clase);
      } else if (claseDate < thisWeekEnd) {
        groups.estaSemana.push(clase);
      } else {
        groups.proximamente.push(clase);
      }
    });

    return groups;
  }, [clasesCalendario]);

  const renderEmptyState = (Icon: any, title: string, description: string) => (
    <div className="text-center py-8">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard Profesor</h1>
            <p className="text-muted-foreground">
              Vista general de tu actividad docente
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/profesor/generar-clase")} size="lg" variant="action">
              <Sparkles className="mr-2 h-5 w-5" />
              Nueva Clase con IA
            </Button>
            <FechaSelector
              fechaReferencia={fechaReferencia}
              onFechaChange={setFechaReferencia}
            />
          </div>
        </div>


        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content - 2 Blocks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bloque 1: Clases en Preparación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Clases en Preparación
              </CardTitle>
              <CardDescription>
                Clases que necesitan tu atención antes de ser dictadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clasesEnPreparacion.length > 0 ? (
                <div className="space-y-3">
                  {clasesEnPreparacion.map((clase: any) => (
                    <div key={clase.id} className="p-4 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                          <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                        </div>
                        <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                      </div>
                      {clase.fecha_programada && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Programada: {formatDate(clase.fecha_programada)}
                        </p>
                      )}
                      <ClaseActionsMenu clase={clase} />
                    </div>
                  ))}
                </div>
              ) : (
                renderEmptyState(
                  CheckCircle2,
                  "¡Todo al día!",
                  "No tienes clases pendientes de preparación"
                )
              )}
            </CardContent>
          </Card>

          {/* Bloque 2: Calendario de Clases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Calendario de Clases
              </CardTitle>
              <CardDescription>
                Clases programadas, en curso y completadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {clasesCalendario.length > 0 ? (
                <div className="space-y-4">
                  {/* HOY */}
                  {groupedCalendario.hoy.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">HOY</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(new Date().toISOString().split('T')[0])}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedCalendario.hoy.map((clase: any) => (
                          <div key={clase.id} className="p-3 border rounded-lg bg-destructive/5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                              </div>
                              <Badge variant={clase.estado_variant as any} className={clase.estado === 'en_clase' ? 'animate-pulse' : ''}>
                                {clase.estado_label}
                              </Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* MAÑANA */}
                  {groupedCalendario.manana.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">MAÑANA</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedCalendario.manana.map((clase: any) => (
                          <div key={clase.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                              </div>
                              <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ESTA SEMANA */}
                  {groupedCalendario.estaSemana.length > 0 && (
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">ESTA SEMANA</Badge>
                      <div className="space-y-2">
                        {groupedCalendario.estaSemana.map((clase: any) => (
                          <div key={clase.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                                {clase.fecha_programada && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(clase.fecha_programada)}
                                  </p>
                                )}
                              </div>
                              <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRÓXIMAMENTE */}
                  {groupedCalendario.proximamente.length > 0 && (
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">PRÓXIMAMENTE</Badge>
                      <div className="space-y-2">
                        {groupedCalendario.proximamente.slice(0, 5).map((clase: any) => (
                          <div key={clase.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                                {clase.fecha_programada && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(clase.fecha_programada)}
                                  </p>
                                )}
                              </div>
                              <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>
                        ))}
                      </div>
                      {groupedCalendario.proximamente.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          +{groupedCalendario.proximamente.length - 5} clases más
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                renderEmptyState(
                  Calendar,
                  "No hay clases en calendario",
                  "Las clases programadas aparecerán aquí"
                )
              )}
            </CardContent>
          </Card>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Recomendaciones IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.recomendaciones && dashboardData.recomendaciones.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recomendaciones.map((rec: any) => (
                  <div
                    key={rec.id}
                    className="p-4 border rounded-lg bg-purple-500/5 border-purple-500/20"
                  >
                    <p className="text-sm">{rec.contenido}</p>
                    {rec.id_clase_anterior && (
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-2 p-0 h-auto text-purple-600"
                        onClick={() => navigate(`/profesor/recomendaciones-quiz-pre/${rec.id_clase_anterior}`)}
                      >
                        Ver detalles →
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              renderEmptyState(
                Brain,
                "No hay recomendaciones",
                "Las recomendaciones de IA aparecerán aquí"
              )
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

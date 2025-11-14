import { useMemo, ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  AlertCircle,
  Sparkles,
  Brain,
  CalendarDays,
  BarChart3,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/profesor/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfesorDashboard() {
  const navigate = useNavigate();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-profesor'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('dashboard-profesor');
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
    return format(date, "d 'de' MMMM, HH:mm", { locale: es });
  };

  const getClaseStage = (clase: any) => {
    if (clase.estado === 'completada') {
      return { label: "Completada", variant: "default" as const };
    }
    if (clase.estado === 'en_progreso') {
      return { label: "En clase", variant: "default" as const };
    }
    const isPast = new Date(clase.fecha_programada) < new Date();
    if (!clase.tiene_eval_post && isPast) {
      return { label: "Pendiente eval. post", variant: "secondary" as const };
    }
    if (!clase.tiene_eval_pre) {
      return { label: "Sin evaluación previa", variant: "secondary" as const };
    }
    return { label: "Lista para dar", variant: "default" as const };
  };

  const quickActions = [
    {
      label: "Generar Clase",
      description: "Crea una nueva clase con IA",
      icon: Brain,
      action: () => navigate("/profesor/generar-clase"),
    },
    {
      label: "Planificación",
      description: "Revisa tus unidades y temas",
      icon: BookOpen,
      action: () => navigate("/profesor/planificacion"),
    },
    {
      label: "Métricas",
      description: "Analiza el avance de tus cursos",
      icon: BarChart3,
      action: () => navigate("/profesor/metricas"),
    },
    {
      label: "Capacitación IA",
      description: "Mejora tus prompts y guías",
      icon: Sparkles,
      action: () => navigate("/profesor/capacitacion"),
    },
  ];

  const upcomingClasses = useMemo(() => {
    if (!dashboardData) return [];
    const combined = [
      ...(dashboardData.clases_pendientes || []),
      ...(dashboardData.clases_listas || []),
    ];

    return combined
      .filter((item: any) => item?.fecha_programada)
      .sort(
        (a: any, b: any) =>
          new Date(a.fecha_programada).getTime() -
          new Date(b.fecha_programada).getTime()
      )
      .slice(0, 10);
  }, [dashboardData]);

  const groupedUpcoming = useMemo(() => {
    return upcomingClasses.reduce((acc: Record<string, any[]>, clase: any) => {
      const dayLabel = format(
        new Date(clase.fecha_programada),
        "EEEE d 'de' MMMM",
        { locale: es }
      );
      if (!acc[dayLabel]) {
        acc[dayLabel] = [];
      }
      acc[dayLabel].push(clase);
      return acc;
    }, {});
  }, [upcomingClasses]);

  const renderEmptyState = (icon: ReactNode, message: string) => (
    <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-3">
      {icon}
      <p className="max-w-sm text-sm">{message}</p>
    </div>
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-40 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Panel del Profesor</h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus clases y desarrolla el pensamiento crítico de tus estudiantes
            </p>
          </div>
          <Button 
            size="lg" 
            onClick={() => navigate('/profesor/generar-clase')}
            className="bg-gradient-primary hover:opacity-90 shadow-lg"
            aria-label="Crear nueva clase con IA"
          >
            <Brain className="mr-2 h-5 w-5" />
            Nueva Clase con IA
          </Button>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardContent className="p-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="justify-start h-auto py-4 flex flex-col items-start gap-1"
                  onClick={action.action}
                  aria-label={action.label}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </span>
                  <span className="text-xs text-muted-foreground text-left">
                    {action.description}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* SECCIÓN 1: Clases Pendientes de Preparación */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Clases Pendientes de Preparación
                </CardTitle>
                <CardDescription>
                  Clases programadas en los próximos 7 días que necesitan guía
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.clases_pendientes &&
                dashboardData.clases_pendientes.length > 0 ? (
                  dashboardData.clases_pendientes.map((clase: any) => (
                    <div
                      key={clase.id}
                      className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold">
                            {clase.materia} - {clase.grupo}
                          </h3>
                          <Badge variant="destructive">Sin preparar</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{clase.tema}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(clase.fecha_programada)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {clase.estudiantes} estudiantes
                          </span>
                        </div>
                      </div>
                      <Button
                        className="w-full md:w-auto"
                        onClick={() =>
                          navigate(`/profesor/generar-clase?claseId=${clase.id}`)
                        }
                        aria-label={`Preparar clase ${clase.tema}`}
                      >
                        Preparar Clase
                      </Button>
                    </div>
                  ))
                ) : (
                  renderEmptyState(
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />,
                    "No tienes clases pendientes de preparación. Genera una nueva clase o revisa tus guías existentes."
                  )
                )}
              </CardContent>
            </Card>

            {/* SECCIÓN 2: Clases Programadas Listas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Clases Programadas Listas
                </CardTitle>
                <CardDescription>
                  Clases con guía generada en diferentes etapas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.clases_listas &&
                dashboardData.clases_listas.length > 0 ? (
                  dashboardData.clases_listas.map((clase: any) => {
                    const stage = getClaseStage(clase);
                    return (
                      <div
                        key={clase.id}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {clase.materia} - {clase.grupo}
                            </h3>
                            <Badge variant={stage.variant}>{stage.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{clase.tema}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(clase.fecha_programada)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {clase.estudiantes} estudiantes
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          className="w-full md:w-auto"
                          onClick={() => navigate(`/profesor/ver-guia/${clase.id}`)}
                          aria-label={`Ver guía de la clase ${clase.tema}`}
                        >
                          Ver Guía
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  renderEmptyState(
                    <FileText className="h-8 w-8 text-muted-foreground" />,
                    "Aún no tienes guías listas para revisar. Cuando generes una guía aparecerá en esta sección."
                  )
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Calendario Próximas Clases */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  Calendario Próximas Clases
                </CardTitle>
                <CardDescription>
                  Vista rápida de tus próximas sesiones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingClasses.length > 0 ? (
                  Object.entries(groupedUpcoming).map(([day, clases]) => (
                    <div key={day}>
                      <p className="text-xs uppercase text-muted-foreground mb-2 font-medium">
                        {day}
                      </p>
                      <div className="space-y-3">
                        {clases.map((clase) => {
                          const stage = getClaseStage(clase);
                          return (
                            <div
                              key={`${clase.id}-${stage.label}`}
                              className="flex flex-col gap-2 p-3 rounded-lg border bg-background"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-medium">
                                  {clase.materia} - {clase.grupo}
                                </p>
                                <Badge variant={stage.variant}>{stage.label}</Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(new Date(clase.fecha_programada), "HH:mm", {
                                    locale: es,
                                  })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {clase.estudiantes} estudiantes
                                </span>
                                <span>{clase.tema}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  renderEmptyState(
                    <CalendarDays className="h-8 w-8 text-muted-foreground" />,
                    "Cuando tengas clases programadas, aparecerán aquí para ayudarte a organizar tu semana."
                  )
                )}
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recomendaciones IA
                </CardTitle>
                <CardDescription>
                  Sugerencias basadas en tu contexto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.recommendations &&
                dashboardData.recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {dashboardData.recommendations.map((rec: any) => (
                      <div key={rec.id} className="p-3 bg-background rounded-lg border">
                        <p className="text-sm">{rec.contenido}</p>
                        {rec.clases?.temas?.nombre && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {rec.clases.temas.nombre}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmptyState(
                    <Sparkles className="h-8 w-8 text-primary" />,
                    "Aún no hay recomendaciones personalizadas. Genera una clase para recibir sugerencias adaptadas a tus estudiantes."
                  )
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/profesor/generar-clase")}
                  aria-label="Explorar más sugerencias de IA"
                >
                  Explorar más sugerencias
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

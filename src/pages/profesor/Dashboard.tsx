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
  AlertCircle,
  Sparkles,
  Brain,
  CalendarDays,
  BarChart3,
  FileText,
  Play,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/profesor/StatsCard";
import { FechaSelector } from "@/components/profesor/FechaSelector";
import { AlertaBadge } from "@/components/profesor/AlertaBadge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

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
    return format(date, "d 'de' MMMM, HH:mm", { locale: es });
  };

  const getClaseStage = (clase: any) => {
    const estado = clase.estado;
    
    // Map all possible states
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
      'preparada': { label: "Preparada", variant: "default" },
      'en_progreso': { label: "En progreso", variant: "default" },
      'programada': { label: "Programada", variant: "default" },
      'ejecutada': { label: "Ejecutada", variant: "default" },
      'cancelada': { label: "Cancelada", variant: "destructive" },
    };

    if (estadoMap[estado]) {
      return estadoMap[estado];
    }

    // Fallback for unknown states
    return { label: estado || "Desconocido", variant: "outline" as const };
  };

  const getClaseAction = (clase: any) => {
    const estado = clase.estado;
    
    switch (estado) {
      case 'borrador':
        return {
          label: 'Continuar clase',
          onClick: () => navigate(`/profesor/generar-clase?clase=${clase.id}`),
          icon: FileText,
        };
      case 'editando_guia':
        return {
          label: 'Editar guía',
          onClick: () => navigate(`/profesor/editar-guia/${clase.id}`),
          icon: FileText,
        };
      case 'guia_aprobada':
      case 'quiz_pre_generando':
        return {
          label: 'Generar quiz PRE',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: Brain,
        };
      case 'quiz_pre_enviado':
      case 'analizando_quiz_pre':
        return {
          label: 'Ver resultados PRE',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: BarChart3,
        };
      case 'modificando_guia':
        return {
          label: 'Modificar guía',
          onClick: () => navigate(`/profesor/editar-guia/${clase.id}`),
          icon: FileText,
        };
      case 'guia_final':
      case 'clase_programada':
        return {
          label: 'Ver guía final',
          onClick: () => navigate(`/profesor/ver-guia-clase/${clase.id}`),
          icon: FileText,
        };
      case 'en_clase':
        return {
          label: 'En clase ahora',
          onClick: () => navigate(`/profesor/ver-guia-clase/${clase.id}`),
          icon: Play,
        };
      case 'quiz_post_generando':
        return {
          label: 'Generar quiz POST',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: Brain,
        };
      case 'quiz_post_enviado':
      case 'analizando_resultados':
        return {
          label: 'Ver resultados POST',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: BarChart3,
        };
      case 'completada':
        return {
          label: 'Ver resumen',
          onClick: () => navigate(`/profesor/ver-guia-clase/${clase.id}`),
          icon: CheckCircle2,
        };
      default:
        return null;
    }
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
    }, {} as Record<string, any[]>);
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
        <div className="flex flex-col gap-4">
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
          <FechaSelector
            fechaReferencia={fechaReferencia}
            onFechaChange={setFechaReferencia}
            anioEscolar={dashboardData?.anio_escolar}
          />
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
                  Clases programadas dentro del rango configurado que necesitan guía
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {dashboardData?.clases_pendientes &&
                dashboardData.clases_pendientes.length > 0 ? (
                  dashboardData.clases_pendientes.map((clase: any) => {
                    const stage = getClaseStage(clase);
                    const action = getClaseAction(clase);
                    
                    return (
                      <div
                        key={clase.id}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {clase.materia || clase.tema} - {clase.grupo}
                            </h3>
                            <Badge variant={stage.variant}>{stage.label}</Badge>
                            {clase.numero_sesion && (
                              <Badge variant="outline">Sesión {clase.numero_sesion}</Badge>
                            )}
                            {clase.nivel_alerta && (
                              <AlertaBadge nivel={clase.nivel_alerta} diasRestantes={clase.dias_restantes || 0} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{clase.tema || clase.nombre}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {clase.fecha_programada && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(clase.fecha_programada)}
                              </span>
                            )}
                            {clase.estudiantes && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {clase.estudiantes} estudiantes
                              </span>
                            )}
                            {clase.dias_restantes !== undefined && (
                              <span className="flex items-center gap-1">
                                {clase.dias_restantes === 0 ? 'Hoy' : clase.dias_restantes === 1 ? 'Mañana' : `En ${clase.dias_restantes} días`}
                              </span>
                            )}
                          </div>
                        </div>
                        {action ? (
                          <Button
                            className="w-full md:w-auto"
                            onClick={action.onClick}
                            aria-label={action.label}
                          >
                            {action.label}
                          </Button>
                        ) : (
                          <Button
                            className="w-full md:w-auto"
                            onClick={() =>
                              navigate(`/profesor/generar-clase?tema=${clase.id_tema || clase.id}`)
                            }
                            aria-label={`Preparar clase ${clase.tema}`}
                          >
                            Preparar Clase
                          </Button>
                        )}
                      </div>
                    );
                  })
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
                    const action = getClaseAction(clase);
                    
                    return (
                      <div
                        key={clase.id}
                        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className="font-semibold">
                              {clase.materia || clase.tema} - {clase.grupo}
                            </h3>
                            <Badge variant={stage.variant}>{stage.label}</Badge>
                            {clase.numero_sesion && (
                              <Badge variant="outline">Sesión {clase.numero_sesion}</Badge>
                            )}
                            {clase.nivel_alerta && (
                              <AlertaBadge nivel={clase.nivel_alerta} diasRestantes={clase.dias_restantes || 0} />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{clase.tema || clase.nombre}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {clase.fecha_programada && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(clase.fecha_programada)}
                              </span>
                            )}
                            {clase.estudiantes && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {clase.estudiantes} estudiantes
                              </span>
                            )}
                            {clase.dias_restantes !== undefined && (
                              <span className="flex items-center gap-1">
                                {clase.dias_restantes === 0 ? 'Hoy' : clase.dias_restantes === 1 ? 'Mañana' : `En ${clase.dias_restantes} días`}
                              </span>
                            )}
                          </div>
                        </div>
                        {action ? (
                          <Button
                            className="w-full md:w-auto"
                            onClick={action.onClick}
                            aria-label={action.label}
                          >
                            {action.label}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full md:w-auto"
                            onClick={() => navigate(`/profesor/editar-guia/${clase.id}`)}
                            aria-label={`Ver guía de la clase ${clase.tema}`}
                          >
                            Ver Guía
                          </Button>
                        )}
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
                  Object.entries(groupedUpcoming).map(([day, clases]: [string, any[]]) => (
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
                              <p className="text-sm text-muted-foreground">{clase.tema}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(new Date(clase.fecha_programada), "HH:mm", {
                                  locale: es,
                                })}
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

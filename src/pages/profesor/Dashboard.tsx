import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, TrendingUp, Clock, AlertCircle, Sparkles, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/profesor/StatsCard";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
          >
            <Brain className="mr-2 h-5 w-5" />
            Nueva Clase con IA
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* SECCIÓN 1: Clases Pendientes de Preparación */}
            {dashboardData?.clases_pendientes && dashboardData.clases_pendientes.length > 0 && (
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
                  {dashboardData.clases_pendientes.map((clase: any) => (
                    <div
                      key={clase.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{clase.materia} - {clase.grupo}</h3>
                          <Badge variant="destructive">Sin preparar</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{clase.tema}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                        onClick={() => navigate(`/profesor/generar-clase?claseId=${clase.id}`)}
                      >
                        Preparar Clase
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* SECCIÓN 2: Clases Programadas Listas */}
            {dashboardData?.clases_listas && dashboardData.clases_listas.length > 0 && (
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
                  {dashboardData.clases_listas.map((clase: any) => {
                    const stage = getClaseStage(clase);
                    return (
                      <div
                        key={clase.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{clase.materia} - {clase.grupo}</h3>
                            <Badge variant={stage.variant}>{stage.label}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{clase.tema}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
                          onClick={() => navigate(`/profesor/ver-guia/${clase.id}`)}
                        >
                          Ver Guía
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>

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
              {dashboardData?.recommendations && dashboardData.recommendations.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.recommendations.map((rec: any) => (
                    <div key={rec.id} className="p-3 bg-background rounded-lg border">
                      <p className="text-sm">{rec.contenido}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {rec.clases?.temas?.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-background rounded-lg border">
                    <p className="text-sm font-medium mb-1">
                      💡 Método Socrático
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ideal para desarrollar pensamiento crítico
                    </p>
                  </div>
                  <div className="p-3 bg-background rounded-lg border">
                    <p className="text-sm font-medium mb-1">
                      📊 Análisis Comparativo
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Refuerza conceptos usando ejemplos del día a día
                    </p>
                  </div>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/profesor/generar-clase')}
              >
                Explorar más sugerencias
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

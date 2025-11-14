import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, TrendingUp, Clock, AlertCircle, Sparkles, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/profesor/StatsCard";

export default function ProfesorDashboard() {
  const navigate = useNavigate();

  const stats = [
    { title: "Clases esta semana", value: "12", icon: BookOpen, trend: { value: 15, isPositive: true } },
    { title: "Materias asignadas", value: "4", icon: GraduationCap },
    { title: "Total estudiantes", value: "156", icon: Users },
    { title: "Promedio general", value: "8.7", icon: TrendingUp, trend: { value: 5, isPositive: true } },
  ];

  const upcomingClasses = [
    {
      subject: "Matemáticas - 5° Básico",
      topic: "Fracciones y decimales",
      time: "Hoy, 10:00 AM",
      prepared: true,
      students: 28,
    },
    {
      subject: "Ciencias - 6° Básico",
      topic: "El sistema solar",
      time: "Hoy, 2:00 PM",
      prepared: false,
      students: 25,
    },
    {
      subject: "Lenguaje - 5° Básico",
      topic: "Análisis literario",
      time: "Mañana, 9:00 AM",
      prepared: true,
      students: 30,
    },
  ];

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
          {/* Upcoming Classes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximas Clases
              </CardTitle>
              <CardDescription>
                Clases programadas que requieren preparación
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingClasses.map((clase, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{clase.subject}</h3>
                      {!clase.prepared && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Pendiente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{clase.topic}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {clase.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {clase.students} estudiantes
                      </span>
                    </div>
                  </div>
                  <Button
                    variant={clase.prepared ? "outline" : "default"}
                    size="sm"
                    onClick={() => navigate('/profesor/generar-clase')}
                  >
                    {clase.prepared ? "Ver Guía" : "Preparar"}
                  </Button>
                </div>
              ))}
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
              <div className="space-y-3">
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-sm font-medium mb-1">
                    💡 Método Socrático
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ideal para tu próxima clase de Ciencias sobre el sistema solar
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-sm font-medium mb-1">
                    📊 Análisis Comparativo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Refuerza conceptos de fracciones usando ejemplos del día a día
                  </p>
                </div>
                <div className="p-3 bg-background rounded-lg border">
                  <p className="text-sm font-medium mb-1">
                    🎯 Evaluación Pre-Clase
                  </p>
                  <p className="text-xs text-muted-foreground">
                    3 clases necesitan evaluaciones diagnósticas
                  </p>
                </div>
              </div>
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

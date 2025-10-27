import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BookOpen, Clock, Trophy, Award, Brain, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { formatPeruTime } from "@/lib/timezone";

export default function ApoderadoDashboard() {
  const alumnoInfo = {
    nombre: "María Rodríguez",
    grado: "3° Básico",
    seccion: "A"
  };

  const mockStats = {
    promedio: 7.8,
    asistencia: 95,
    quizzes: 12,
    horasEstudio: 6
  };

  const mockMaterias = [
    { nombre: "Matemáticas", promedio: 8.2, tendencia: "up", color: "success" },
    { nombre: "Lenguaje", promedio: 7.9, tendencia: "stable", color: "primary" },
    { nombre: "Ciencias", promedio: 8.5, tendencia: "up", color: "success" },
    { nombre: "Historia", promedio: 7.0, tendencia: "down", color: "warning" },
    { nombre: "Inglés", promedio: 7.5, tendencia: "stable", color: "secondary" },
    { nombre: "Arte", promedio: 8.8, tendencia: "up", color: "success" },
  ];

  const mockProximasClases = [
    { materia: "Matemáticas", fecha: "Hoy 08:00", tema: "Geometría" },
    { materia: "Lenguaje", fecha: "Hoy 10:30", tema: "Poesía" },
    { materia: "Ciencias", fecha: "Mañana 09:00", tema: "Estados de la materia" },
  ];

  const mockRecomendaciones = [
    { 
      tipo: "fortaleza",
      mensaje: "María tiene un excelente desempeño en Ciencias. Considera reforzar con lecturas adicionales sobre el tema.",
      icono: Trophy,
      color: "success"
    },
    {
      tipo: "atencion",
      mensaje: "El rendimiento en Historia ha bajado levemente. Recomendamos dedicar 15 minutos diarios de repaso.",
      icono: AlertCircle,
      color: "warning"
    },
    {
      tipo: "habito",
      mensaje: "María mantiene buenos hábitos de estudio. Sus horarios de trabajo son consistentes.",
      icono: Clock,
      color: "primary"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Tablero Familiar
            </h1>
            <p className="text-muted-foreground mt-2">
              Seguimiento de {alumnoInfo.nombre} - {alumnoInfo.grado} {alumnoInfo.seccion}
            </p>
          </div>
          <Button className="bg-gradient-primary">
            <Brain className="mr-2 h-4 w-4" />
            Asistente IA
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mockStats.promedio}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-success">↑ 0.2</span> vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
              <Trophy className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockStats.asistencia}%</div>
              <p className="text-xs text-muted-foreground mt-1">Este mes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <BookOpen className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{mockStats.quizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">Completados</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Estudio</CardTitle>
              <Clock className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{mockStats.horasEstudio}h</div>
              <p className="text-xs text-muted-foreground mt-1">Promedio semanal</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-success" />
                Rendimiento por Materia
              </CardTitle>
              <CardDescription>Promedios actuales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockMaterias.map((materia, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{materia.nombre}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs ${
                          materia.tendencia === 'up' ? 'text-success' :
                          materia.tendencia === 'down' ? 'text-warning' :
                          'text-muted-foreground'
                        }`}>
                          {materia.tendencia === 'up' ? '↑' :
                           materia.tendencia === 'down' ? '↓' : '→'}
                        </span>
                        <Badge className="bg-success text-success-foreground">
                          {materia.promedio}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={materia.promedio * 10} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Próximas Clases
              </CardTitle>
              <CardDescription>Calendario de actividades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockProximasClases.map((clase, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{clase.materia}</p>
                        <Badge variant="outline" className="text-xs">
                          {clase.fecha}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">📚 {clase.tema}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Recomendaciones Personalizadas
            </CardTitle>
            <CardDescription>Sugerencias generadas por IA basadas en el rendimiento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockRecomendaciones.map((rec, idx) => {
                const IconComponent = rec.icono;
                return (
                  <div key={idx} className={`flex items-start gap-3 p-4 rounded-lg border-l-4 bg-card/50 border-${rec.color}`}>
                    <IconComponent className={`h-5 w-5 mt-0.5 text-${rec.color}`} />
                    <div className="flex-1">
                      <p className="text-sm">{rec.mensaje}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, TrendingUp, Clock, Target, Award, Calendar, Brain, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function AlumnoDashboard() {
  const mockStats = {
    promedio: 7.8,
    quizzes: 12,
    materias: 6,
    horas: 8
  };

  const mockClases = [
    { materia: "Matemáticas", hora: "08:00", profesor: "Ana Martínez", tema: "Geometría", sala: "201" },
    { materia: "Lenguaje", hora: "10:30", profesor: "Carlos López", tema: "Poesía", sala: "105" },
    { materia: "Ciencias", hora: "14:00", profesor: "María González", tema: "El Agua", sala: "Lab 1" },
  ];

  const mockQuizzesPendientes = [
    { titulo: "Evaluación: Geometría", materia: "Matemáticas", fechaLimite: "Hoy 23:59", preguntas: 15, duracion: 30 },
    { titulo: "Quiz: Comprensión Lectora", materia: "Lenguaje", fechaLimite: "Mañana", preguntas: 10, duracion: 20 },
  ];

  const mockCalificaciones = [
    { materia: "Matemáticas", promedio: 8.2, color: "primary" },
    { materia: "Lenguaje", promedio: 7.9, color: "secondary" },
    { materia: "Ciencias", promedio: 8.5, color: "success" },
    { materia: "Historia", promedio: 7.0, color: "accent" },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Mi Panel de Estudio
            </h1>
            <p className="text-muted-foreground mt-2">
              Sigue tu progreso y completa tus actividades
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
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mockStats.promedio}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-success">↑ 0.3</span> desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <Target className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockStats.quizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">Completados este mes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Materias</CardTitle>
              <BookOpen className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{mockStats.materias}</div>
              <p className="text-xs text-muted-foreground mt-1">Activas este semestre</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo</CardTitle>
              <Clock className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{mockStats.horas}h</div>
              <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Clases de Hoy
              </CardTitle>
              <CardDescription>Tu horario para hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockClases.map((clase, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
                    <div className="mt-1 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-medium">
                      {clase.hora}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{clase.materia}</p>
                        <Badge variant="outline">{clase.sala}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{clase.profesor}</p>
                      <p className="text-xs text-muted-foreground mt-1">📚 {clase.tema}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-warning" />
                Quizzes Pendientes
              </CardTitle>
              <CardDescription>Por completar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockQuizzesPendientes.map((quiz, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-card/50 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{quiz.titulo}</p>
                        <p className="text-xs text-muted-foreground">{quiz.materia}</p>
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {quiz.fechaLimite}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>📝 {quiz.preguntas} preguntas</span>
                      <span>⏱️ {quiz.duracion} min</span>
                    </div>
                    <Button size="sm" className="w-full mt-2 bg-gradient-primary">
                      <Play className="mr-2 h-3 w-3" />
                      Comenzar Quiz
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-success" />
              Rendimiento por Materia
            </CardTitle>
            <CardDescription>Tus promedios actuales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {mockCalificaciones.map((cal, idx) => (
                <div key={idx} className="space-y-2 p-3 rounded-lg border bg-card/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{cal.materia}</span>
                    <Badge className="bg-success text-success-foreground">
                      {cal.promedio}
                    </Badge>
                  </div>
                  <Progress value={cal.promedio * 10} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {cal.promedio >= 8 ? "¡Excelente trabajo! 🌟" : 
                     cal.promedio >= 7 ? "Buen desempeño 👍" : 
                     "Sigue esforzándote 💪"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, Users, TrendingUp, FileText, Brain, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatPeruTime } from "@/lib/timezone";

export default function ProfesorDashboard() {
  const mockStats = {
    clases: 8,
    materias: 3,
    alumnos: 85,
    promedio: 7.2
  };

  const mockClases = [
    { materia: "Matemáticas", grupo: "1° Básico A", hora: "08:00", tema: "Suma y Resta", estado: "hoy" },
    { materia: "Lenguaje", grupo: "2° Básico B", hora: "10:30", tema: "Comprensión Lectora", estado: "hoy" },
    { materia: "Matemáticas", grupo: "3° Básico A", hora: "14:00", tema: "Multiplicación", estado: "mañana" },
  ];

  const mockQuizzes = [
    { titulo: "Quiz: Suma hasta 100", grupo: "1° Básico A", completados: 24, total: 28, promedio: 8.1 },
    { titulo: "Evaluación: Comprensión", grupo: "2° Básico B", completados: 20, total: 25, promedio: 7.5 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Panel del Profesor
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus clases y materiales educativos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Brain className="mr-2 h-4 w-4" />
              Generar Guía con IA
            </Button>
            <Button className="bg-gradient-primary">
              <FileText className="mr-2 h-4 w-4" />
              Nueva Clase
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mis Clases</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockStats.clases}</div>
              <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Materias</CardTitle>
              <BookOpen className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{mockStats.materias}</div>
              <p className="text-xs text-muted-foreground mt-1">Asignadas</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
              <Users className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{mockStats.alumnos}</div>
              <p className="text-xs text-muted-foreground mt-1">Total en mis cursos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mockStats.promedio}</div>
              <p className="text-xs text-muted-foreground mt-1">General cursos</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximas Clases
              </CardTitle>
              <CardDescription>Tu calendario de esta semana</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClases.map((clase, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
                    <div className={`mt-1 px-2 py-1 rounded text-xs font-medium ${
                      clase.estado === 'hoy' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {clase.hora}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{clase.materia}</p>
                        <Badge variant={clase.estado === 'hoy' ? 'default' : 'secondary'}>
                          {clase.estado}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{clase.grupo}</p>
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
                <CheckCircle2 className="h-5 w-5 text-success" />
                Quizzes Activos
              </CardTitle>
              <CardDescription>Progreso de evaluaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockQuizzes.map((quiz, idx) => (
                  <div key={idx} className="space-y-2 p-3 rounded-lg border bg-card/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{quiz.titulo}</p>
                        <p className="text-xs text-muted-foreground">{quiz.grupo}</p>
                      </div>
                      <Badge className="bg-success text-success-foreground">
                        ⭐ {quiz.promedio}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={(quiz.completados / quiz.total) * 100} className="flex-1 h-2" />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {quiz.completados}/{quiz.total}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Herramientas del Profesor</CardTitle>
            <CardDescription>Acceso rápido a funcionalidades principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start h-auto py-3">
                <Brain className="mr-2 h-4 w-4 text-primary" />
                Generar Guía IA
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <FileText className="mr-2 h-4 w-4 text-secondary" />
                Crear Quiz
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <TrendingUp className="mr-2 h-4 w-4 text-accent" />
                Ver Métricas
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <Users className="mr-2 h-4 w-4 text-success" />
                Mis Alumnos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

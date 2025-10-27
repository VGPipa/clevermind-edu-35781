import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Play, CheckCircle2, Clock, Calendar, Target, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Clases() {
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);

  const mockMaterias = [
    {
      id: "1",
      nombre: "Matemáticas",
      profesor: "Ana Martínez",
      horario: "Lun, Mié, Vie 08:00-09:30",
      progreso: 45,
      proximaClase: "Mañana 08:00",
      color: "primary"
    },
    {
      id: "2",
      nombre: "Lenguaje",
      profesor: "Carlos López",
      horario: "Mar, Jue 10:00-11:30",
      progreso: 60,
      proximaClase: "Hoy 10:00",
      color: "secondary"
    },
    {
      id: "3",
      nombre: "Ciencias",
      profesor: "María González",
      horario: "Lun, Mié 14:00-15:30",
      progreso: 38,
      proximaClase: "Lun 14:00",
      color: "accent"
    },
    {
      id: "4",
      nombre: "Historia",
      profesor: "Roberto Silva",
      horario: "Mar, Vie 13:00-14:30",
      progreso: 52,
      proximaClase: "Mar 13:00",
      color: "success"
    }
  ];

  const mockClasesRecientes = [
    {
      materia: "Matemáticas",
      tema: "Suma y Resta hasta 100",
      fecha: "Ayer",
      estado: "completada",
      calificacion: 8.5
    },
    {
      materia: "Lenguaje",
      tema: "Comprensión Lectora",
      fecha: "Hace 2 días",
      estado: "completada",
      calificacion: 7.8
    },
    {
      materia: "Ciencias",
      tema: "Estados del Agua",
      fecha: "Hace 3 días",
      estado: "completada",
      calificacion: 9.0
    }
  ];

  const mockQuizzes = [
    {
      id: "1",
      materia: "Matemáticas",
      titulo: "Evaluación: Geometría",
      tipo: "evaluacion",
      preguntas: 15,
      duracion: 30,
      fechaLimite: "Hoy 23:59",
      estado: "disponible",
      intentos: 0
    },
    {
      id: "2",
      materia: "Lenguaje",
      titulo: "Quiz: Comprensión Lectora",
      tipo: "quiz",
      preguntas: 10,
      duracion: 20,
      fechaLimite: "Mañana",
      estado: "disponible",
      intentos: 0
    },
    {
      id: "3",
      materia: "Ciencias",
      titulo: "Quiz: El Agua",
      tipo: "quiz",
      preguntas: 8,
      duracion: 15,
      fechaLimite: "Completado",
      estado: "completado",
      intentos: 1,
      nota: 8.5
    }
  ];

  const mockProximasClases = [
    {
      materia: "Lenguaje",
      tema: "Poesía Chilena",
      profesor: "Carlos López",
      fecha: "Hoy",
      hora: "10:00",
      sala: "105"
    },
    {
      materia: "Matemáticas",
      tema: "Geometría: Triángulos",
      profesor: "Ana Martínez",
      fecha: "Mañana",
      hora: "08:00",
      sala: "201"
    },
    {
      materia: "Ciencias",
      tema: "El Ciclo del Agua",
      profesor: "María González",
      fecha: "Lunes",
      hora: "14:00",
      sala: "Lab 1"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mis Clases
          </h1>
          <p className="text-muted-foreground mt-2">
            Explora tus materias y mantente al día con tus actividades
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {mockMaterias.map((materia) => (
            <Card 
              key={materia.id} 
              className="hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer"
              onClick={() => setSelectedMateria(materia.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{materia.nombre}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {materia.profesor}
                    </CardDescription>
                  </div>
                  <BookOpen className={`h-5 w-5 text-${materia.color}`} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{materia.progreso}%</span>
                  </div>
                  <Progress value={materia.progreso} className="h-1.5" />
                </div>

                <div className="pt-2 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {materia.horario}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-primary" />
                    <span className="font-medium">{materia.proximaClase}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="proximas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="proximas">Próximas Clases</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="proximas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Próximas Clases
                </CardTitle>
                <CardDescription>Tu calendario de esta semana</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockProximasClases.map((clase, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
                      <div className="mt-1">
                        <Badge 
                          variant={clase.fecha === "Hoy" ? "default" : "outline"}
                          className="mb-1"
                        >
                          {clase.fecha}
                        </Badge>
                        <div className="text-xs font-medium text-muted-foreground">
                          {clase.hora}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-medium">{clase.materia}</h3>
                          <Badge variant="outline">{clase.sala}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {clase.profesor}
                        </p>
                        <p className="text-sm">📚 {clase.tema}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {mockQuizzes.map((quiz) => (
                <Card key={quiz.id} className={quiz.estado === "completado" ? "opacity-75" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{quiz.titulo}</CardTitle>
                          {quiz.estado === "completado" && (
                            <CheckCircle2 className="h-4 w-4 text-success" />
                          )}
                        </div>
                        <CardDescription>{quiz.materia}</CardDescription>
                      </div>
                      <Badge variant={quiz.tipo === "evaluacion" ? "destructive" : "secondary"}>
                        {quiz.tipo === "evaluacion" ? "Evaluación" : "Quiz"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {quiz.estado === "completado" ? (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Nota obtenida</span>
                          <Badge className="bg-success text-success-foreground">
                            ⭐ {quiz.nota}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {quiz.preguntas} preguntas
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {quiz.duracion} min
                          </div>
                        </div>

                        <div className="p-2 rounded bg-muted/50 text-xs text-center">
                          <span className="text-muted-foreground">Disponible hasta: </span>
                          <span className="font-medium">{quiz.fechaLimite}</span>
                        </div>

                        <Button className="w-full bg-gradient-primary" size="sm">
                          <Play className="mr-2 h-3 w-3" />
                          Comenzar Quiz
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="historial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-success" />
                  Clases Recientes
                </CardTitle>
                <CardDescription>Tus últimas clases completadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockClasesRecientes.map((clase, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                      <div>
                        <h3 className="font-medium text-sm">{clase.tema}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {clase.materia} · {clase.fecha}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <Badge className="bg-success text-success-foreground">
                          {clase.calificacion}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

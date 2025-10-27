import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, BookOpen, Target, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Planificacion() {
  const mockMaterias = [
    {
      nombre: "Matemáticas",
      grado: "1° Básico",
      seccion: "A",
      horasSemana: 6,
      temas: 12,
      avance: 45,
      proximoTema: "Suma y Resta hasta 100"
    },
    {
      nombre: "Lenguaje",
      grado: "2° Básico",
      seccion: "B",
      horasSemana: 5,
      temas: 10,
      avance: 60,
      proximoTema: "Comprensión Lectora"
    },
    {
      nombre: "Matemáticas",
      grado: "3° Básico",
      seccion: "A",
      horasSemana: 6,
      temas: 15,
      avance: 30,
      proximoTema: "Geometría Básica"
    }
  ];

  const mockTemasSemana = [
    {
      dia: "Lunes",
      hora: "08:00 - 09:30",
      materia: "Matemáticas 1°A",
      tema: "Suma y Resta",
      estado: "pendiente"
    },
    {
      dia: "Lunes",
      hora: "10:00 - 11:30",
      materia: "Lenguaje 2°B",
      tema: "Comprensión Lectora",
      estado: "pendiente"
    },
    {
      dia: "Martes",
      hora: "08:00 - 09:30",
      materia: "Matemáticas 3°A",
      tema: "Geometría",
      estado: "pendiente"
    },
    {
      dia: "Martes",
      hora: "14:00 - 15:30",
      materia: "Matemáticas 1°A",
      tema: "Problemas de Suma",
      estado: "pendiente"
    }
  ];

  const mockPlanAnual = [
    {
      unidad: "Unidad 1: Números hasta 100",
      materia: "Matemáticas 1°A",
      duracion: "8 semanas",
      temas: 6,
      completado: 4,
      estado: "en_progreso"
    },
    {
      unidad: "Unidad 2: Textos Narrativos",
      materia: "Lenguaje 2°B",
      duracion: "6 semanas",
      temas: 5,
      completado: 5,
      estado: "completado"
    },
    {
      unidad: "Unidad 3: Figuras Geométricas",
      materia: "Matemáticas 3°A",
      duracion: "5 semanas",
      temas: 4,
      completado: 1,
      estado: "en_progreso"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Planificación Académica
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus materias y planifica tus clases
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {mockMaterias.map((materia, idx) => (
            <Card key={idx} className="hover:shadow-elegant transition-all hover:-translate-y-1">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{materia.nombre}</CardTitle>
                    <CardDescription>
                      {materia.grado} {materia.seccion}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{materia.horasSemana}h/sem</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avance del curso</span>
                  <span className="font-medium">{materia.avance}%</span>
                </div>
                <Progress value={materia.avance} className="h-2" />
                
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{materia.temas} temas totales</span>
                  </div>
                  <div className="p-2 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-xs text-muted-foreground mb-1">Próximo tema:</p>
                    <p className="text-sm font-medium">{materia.proximoTema}</p>
                  </div>
                </div>

                <Button className="w-full mt-3" variant="outline">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Ver Planificación
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="semana" className="space-y-4">
          <TabsList>
            <TabsTrigger value="semana">Esta Semana</TabsTrigger>
            <TabsTrigger value="plan">Plan Anual</TabsTrigger>
          </TabsList>

          <TabsContent value="semana" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Temas de esta Semana
                </CardTitle>
                <CardDescription>Tu calendario de temas por día</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTemasSemana.map((clase, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
                      <div className="mt-1">
                        <div className="text-xs font-medium text-muted-foreground mb-1">{clase.dia}</div>
                        <Badge variant="outline" className="text-xs whitespace-nowrap">
                          {clase.hora}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{clase.materia}</p>
                        <p className="text-sm text-muted-foreground mt-1">📚 {clase.tema}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        Preparar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Plan Anual
                </CardTitle>
                <CardDescription>Unidades y progreso general</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPlanAnual.map((unidad, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card/50 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{unidad.unidad}</h3>
                            <Badge variant={unidad.estado === "completado" ? "default" : "secondary"}>
                              {unidad.estado === "completado" ? "Completado" : "En Progreso"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{unidad.materia}</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {unidad.duracion}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Temas completados</span>
                          <span className="font-medium">{unidad.completado}/{unidad.temas}</span>
                        </div>
                        <Progress value={(unidad.completado / unidad.temas) * 100} className="h-2" />
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

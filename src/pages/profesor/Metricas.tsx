import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, Award, AlertCircle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPeruDateTimeShort, toPeruTime } from "@/lib/timezone";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function Metricas() {
  const mockEstadisticas = {
    promedioGeneral: 7.5,
    alumnosTotal: 85,
    quizzesCompletados: 156,
    tasaAprobacion: 88
  };

  const mockCursos = [
    {
      nombre: "Matemáticas 1°A",
      alumnos: 28,
      promedio: 7.8,
      tendencia: "up",
      quizzes: 12,
      asistencia: 92
    },
    {
      nombre: "Lenguaje 2°B",
      alumnos: 25,
      promedio: 7.2,
      tendencia: "stable",
      quizzes: 10,
      asistencia: 88
    },
    {
      nombre: "Matemáticas 3°A",
      alumnos: 32,
      promedio: 7.6,
      tendencia: "up",
      quizzes: 15,
      asistencia: 95
    }
  ];

  const mockTemasDesafiantes = [
    {
      tema: "Multiplicación",
      curso: "3° Básico A",
      promedio: 6.2,
      intentos: 45,
      dificultad: "alta"
    },
    {
      tema: "Comprensión Lectora",
      curso: "2° Básico B",
      promedio: 6.8,
      intentos: 38,
      dificultad: "media"
    },
    {
      tema: "Geometría",
      curso: "3° Básico A",
      promedio: 6.5,
      intentos: 52,
      dificultad: "media"
    }
  ];

  const mockAlumnosDestacados = [
    { nombre: "María González", curso: "1°A", promedio: 9.2, racha: 12 },
    { nombre: "Pedro Martínez", curso: "3°A", promedio: 8.9, racha: 8 },
    { nombre: "Ana López", curso: "2°B", promedio: 8.7, racha: 10 },
    { nombre: "Carlos Ruiz", curso: "1°A", promedio: 8.5, racha: 6 },
  ];

  const mockAlumnosAtencion = [
    { nombre: "Juan Pérez", curso: "2°B", promedio: 5.8, quizzesPendientes: 3 },
    { nombre: "Sofía Torres", curso: "3°A", promedio: 6.1, quizzesPendientes: 2 },
    { nombre: "Diego Silva", curso: "1°A", promedio: 6.0, quizzesPendientes: 4 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Métricas y Análisis
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualiza el desempeño y progreso de tus alumnos
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mockEstadisticas.promedioGeneral}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-success">↑ 0.3</span> vs mes anterior
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockEstadisticas.alumnosTotal}</div>
              <p className="text-xs text-muted-foreground mt-1">En todos tus cursos</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <Target className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{mockEstadisticas.quizzesCompletados}</div>
              <p className="text-xs text-muted-foreground mt-1">Completados este mes</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tasa Aprobación</CardTitle>
              <Award className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{mockEstadisticas.tasaAprobacion}%</div>
              <p className="text-xs text-muted-foreground mt-1">Sobre nota 6.0</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cursos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cursos">Por Curso</TabsTrigger>
            <TabsTrigger value="alumnos">Por Alumno</TabsTrigger>
            <TabsTrigger value="temas">Por Tema</TabsTrigger>
          </TabsList>

          <TabsContent value="cursos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Desempeño por Curso
                </CardTitle>
                <CardDescription>Estadísticas generales de cada curso</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCursos.map((curso, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card/50 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{curso.nombre}</h3>
                          <p className="text-sm text-muted-foreground">{curso.alumnos} alumnos</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm ${
                            curso.tendencia === 'up' ? 'text-success' : 'text-muted-foreground'
                          }`}>
                            {curso.tendencia === 'up' ? '↑' : '→'}
                          </span>
                          <Badge className="bg-success text-success-foreground">
                            {curso.promedio}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="text-center p-2 rounded bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">Quizzes</div>
                          <div className="font-medium">{curso.quizzes}</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">Asistencia</div>
                          <div className="font-medium">{curso.asistencia}%</div>
                        </div>
                        <div className="text-center p-2 rounded bg-muted/50">
                          <div className="text-xs text-muted-foreground mb-1">Progreso</div>
                          <div className="font-medium">En curso</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alumnos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Award className="h-5 w-5 text-success" />
                    Alumnos Destacados
                  </CardTitle>
                  <CardDescription>Mejor desempeño</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAlumnosDestacados.map((alumno, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                        <div>
                          <p className="font-medium text-sm">{alumno.nombre}</p>
                          <p className="text-xs text-muted-foreground">{alumno.curso}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            🔥 {alumno.racha}
                          </Badge>
                          <Badge className="bg-success text-success-foreground">
                            {alumno.promedio}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertCircle className="h-5 w-5 text-warning" />
                    Alumnos que Requieren Atención
                  </CardTitle>
                  <CardDescription>Necesitan apoyo adicional</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockAlumnosAtencion.map((alumno, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                        <div>
                          <p className="font-medium text-sm">{alumno.nombre}</p>
                          <p className="text-xs text-muted-foreground">{alumno.curso}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="mb-1">
                            {alumno.promedio}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {alumno.quizzesPendientes} pendientes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="temas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  Temas Más Desafiantes
                </CardTitle>
                <CardDescription>Áreas que requieren refuerzo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockTemasDesafiantes.map((tema, idx) => (
                    <div key={idx} className="p-4 rounded-lg border bg-card/50 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{tema.tema}</h3>
                          <p className="text-sm text-muted-foreground">{tema.curso}</p>
                        </div>
                        <Badge variant={tema.dificultad === 'alta' ? 'destructive' : 'secondary'}>
                          {tema.dificultad === 'alta' ? 'Alta' : 'Media'} dificultad
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Promedio del tema</span>
                          <span className="font-medium">{tema.promedio}</span>
                        </div>
                        <Progress value={tema.promedio * 10} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {tema.intentos} intentos de quiz en este tema
                        </p>
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

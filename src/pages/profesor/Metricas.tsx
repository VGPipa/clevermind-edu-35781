import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, Award, AlertCircle, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPeruDateTimeShort, toPeruTime } from "@/lib/timezone";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Metricas() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['metricas-profesor'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-metricas-profesor');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las métricas. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  const estadisticas = data?.estadisticas || {
    promedioGeneral: 0,
    alumnosTotal: 0,
    quizzesCompletados: 0,
    tasaAprobacion: 0,
  };

  const cursos = data?.cursos || [];
  const temasDesafiantes = data?.temasDesafiantes || [];
  const alumnosDestacados = data?.alumnosDestacados || [];
  const alumnosAtencion = data?.alumnosAtencion || [];

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
                  {cursos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay datos de cursos disponibles</p>
                    </div>
                  ) : (
                    cursos.map((curso: any, idx: number) => (
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
                    ))
                  )}
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
                    {alumnosDestacados.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay alumnos destacados aún
                      </p>
                    ) : (
                      alumnosDestacados.map((alumno: any, idx: number) => (
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
                      ))
                    )}
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
                    {alumnosAtencion.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay alumnos que requieran atención
                      </p>
                    ) : (
                      alumnosAtencion.map((alumno: any, idx: number) => (
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
                      ))
                    )}
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
                  {temasDesafiantes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No hay datos de temas desafiantes disponibles</p>
                    </div>
                  ) : (
                    temasDesafiantes.map((tema: any, idx: number) => (
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
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BookOpen, Clock, Trophy } from "lucide-react";

export default function ApoderadoDashboard() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Tablero Familiar</h1>
          <p className="text-muted-foreground mt-2">
            Seguimiento del progreso de tu hijo/a
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Promedio General</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Último mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Asistencia</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
              <p className="text-xs text-muted-foreground">Este mes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Completados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Estudio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0h</div>
              <p className="text-xs text-muted-foreground">Promedio diario</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Materias Fuertes</CardTitle>
              <CardDescription>Mejor desempeño</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No hay datos suficientes aún</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Áreas de Mejora</CardTitle>
              <CardDescription>Requieren atención</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">No hay datos suficientes aún</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones</CardTitle>
            <CardDescription>Sugerencias personalizadas generadas por IA</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Las recomendaciones aparecerán aquí una vez que haya suficiente actividad
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

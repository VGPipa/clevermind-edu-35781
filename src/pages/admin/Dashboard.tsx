import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, GraduationCap, BarChart3, Building2, CalendarDays, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatPeruDateTimeShort, toPeruTime } from "@/lib/timezone";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDashboard() {
  const mockStats = {
    profesores: 15,
    alumnos: 245,
    materias: 12,
    quizzes: 89
  };

  const mockActividades = [
    { accion: "Nuevo profesor registrado", usuario: "María González", tiempo: "Hace 2 horas", tipo: "success" },
    { accion: "Plan anual actualizado", usuario: "Sistema", tiempo: "Hace 5 horas", tipo: "info" },
    { accion: "Nuevo grupo creado", usuario: "Admin", tiempo: "Ayer", tipo: "success" },
  ];

  const mockGrupos = [
    { nombre: "1° Básico A", alumnos: 28, profesor: "Ana Martínez", ocupacion: 93 },
    { nombre: "2° Básico B", alumnos: 25, profesor: "Carlos López", ocupacion: 83 },
    { nombre: "3° Básico A", alumnos: 30, profesor: "María González", ocupacion: 100 },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tu institución educativa desde aquí
            </p>
          </div>
          <Button className="bg-gradient-primary">
            <Building2 className="mr-2 h-4 w-4" />
            Configurar Institución
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Profesores</CardTitle>
              <Users className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{mockStats.profesores}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <TrendingUp className="inline h-3 w-3 text-success mr-1" />
                +2 este mes
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-secondary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Alumnos</CardTitle>
              <GraduationCap className="h-5 w-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{mockStats.alumnos}</div>
              <p className="text-xs text-muted-foreground mt-1">Matriculados 2025</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-accent/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Materias</CardTitle>
              <BookOpen className="h-5 w-5 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{mockStats.materias}</div>
              <p className="text-xs text-muted-foreground mt-1">En plan anual</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-elegant transition-all hover:-translate-y-1 border-success/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Quizzes</CardTitle>
              <BarChart3 className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{mockStats.quizzes}</div>
              <p className="text-xs text-muted-foreground mt-1">Completados este mes</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Actividad Reciente
              </CardTitle>
              <CardDescription>Últimas acciones en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActividades.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b last:border-0">
                    <div className={`h-2 w-2 rounded-full mt-2 ${
                      item.tipo === 'success' ? 'bg-success' : 'bg-primary'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.accion}</p>
                      <p className="text-xs text-muted-foreground">{item.usuario} · {item.tiempo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Estado de Grupos
              </CardTitle>
              <CardDescription>Ocupación por curso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockGrupos.map((grupo, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{grupo.nombre}</p>
                        <p className="text-xs text-muted-foreground">
                          {grupo.profesor} · {grupo.alumnos} alumnos
                        </p>
                      </div>
                      <Badge variant={grupo.ocupacion >= 95 ? "destructive" : "secondary"}>
                        {grupo.ocupacion}%
                      </Badge>
                    </div>
                    <Progress value={grupo.ocupacion} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>Gestión principal de la institución</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="justify-start h-auto py-3">
                <Users className="mr-2 h-4 w-4" />
                Gestionar Usuarios
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <BookOpen className="mr-2 h-4 w-4" />
                Plan Anual
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <GraduationCap className="mr-2 h-4 w-4" />
                Grupos y Cursos
              </Button>
              <Button variant="outline" className="justify-start h-auto py-3">
                <BarChart3 className="mr-2 h-4 w-4" />
                Reportes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

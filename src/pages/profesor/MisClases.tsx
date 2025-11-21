import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useMisClasesProfesor } from "@/hooks/use-mis-clases-profesor";
import { ClaseResultadosCard } from "@/components/profesor/ClaseResultadosCard";
import { ComparacionPrePost } from "@/components/profesor/ComparacionPrePost";
import { AlumnosAtencionTable } from "@/components/profesor/AlumnosAtencionTable";
import { QuizResultadosGrid } from "@/components/profesor/QuizResultadosGrid";
import { DetalleClaseModal } from "@/components/profesor/DetalleClaseModal";
import {
  BookOpen,
  TrendingUp,
  AlertTriangle,
  FileText,
  Calendar,
  Users,
  Target,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ClaseConResultados } from "@/hooks/use-mis-clases-profesor";

export default function MisClases() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useMisClasesProfesor();
  const [filtroMateria, setFiltroMateria] = useState<string>("todas");
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState("");
  const [claseDetalle, setClaseDetalle] = useState<ClaseConResultados | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando tus clases...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-destructive mb-2">Error al cargar los datos</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Error desconocido"}
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">No hay datos disponibles</p>
        </div>
      </AppLayout>
    );
  }

  // Obtener materias y grupos únicos para filtros
  const materiasUnicas = Array.from(
    new Set(data.clases.map((c) => c.tema.materia.id))
  ).map((id) => {
    const clase = data.clases.find((c) => c.tema.materia.id === id);
    return {
      id,
      nombre: clase?.tema.materia.nombre || "",
    };
  });

  const gruposUnicos = Array.from(new Set(data.clases.map((c) => c.grupo.id))).map((id) => {
    const clase = data.clases.find((c) => c.grupo.id === id);
    return {
      id,
      nombre: clase?.grupo.nombre || "",
    };
  });

  // Filtrar clases
  let clasesFiltradas = data.clases;
  if (filtroMateria !== "todas") {
    clasesFiltradas = clasesFiltradas.filter((c) => c.tema.materia.id === filtroMateria);
  }
  if (filtroGrupo !== "todos") {
    clasesFiltradas = clasesFiltradas.filter((c) => c.grupo.id === filtroGrupo);
  }
  if (filtroEstado !== "todos") {
    if (filtroEstado === "programadas") {
      clasesFiltradas = clasesFiltradas.filter(
        (c) => c.estado === "programada" || c.estado === "clase_programada"
      );
    } else if (filtroEstado === "ejecutadas") {
      clasesFiltradas = clasesFiltradas.filter(
        (c) => c.estado === "ejecutada" || c.estado === "completada"
      );
    }
  }
  if (busqueda) {
    const busquedaLower = busqueda.toLowerCase();
    clasesFiltradas = clasesFiltradas.filter(
      (c) =>
        c.tema.nombre.toLowerCase().includes(busquedaLower) ||
        c.tema.materia.nombre.toLowerCase().includes(busquedaLower)
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Mis Clases
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualiza los resultados de tus alumnos por clase
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">{data.kpis.total_clases}</div>
                <p className="text-sm text-muted-foreground mt-1">Total de Clases</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {data.kpis.promedio_general !== null
                    ? data.kpis.promedio_general.toFixed(1)
                    : "-"}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Promedio General</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {data.kpis.tasa_participacion_promedio}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">Participación Promedio</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {data.kpis.alumnos_en_riesgo}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Alumnos en Riesgo</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {data.kpis.quizzes_pendientes_revisar}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Quizzes Pendientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="resumen" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="resumen">Resumen por Clase</TabsTrigger>
              <TabsTrigger value="comparativo">Análisis Comparativo</TabsTrigger>
              <TabsTrigger value="atencion">Alumnos que Necesitan Atención</TabsTrigger>
              <TabsTrigger value="quizzes">Resultados de Quizzes</TabsTrigger>
            </TabsList>

            {/* Filtros */}
            <div className="flex gap-2">
              <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Materia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las materias</SelectItem>
                  {materiasUnicas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los grupos</SelectItem>
                  {gruposUnicos.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="programadas">Programadas</SelectItem>
                  <SelectItem value="ejecutadas">Ejecutadas</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Buscar por tema o materia..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-[250px]"
              />
            </div>
          </div>

          <TabsContent value="resumen" className="space-y-4">
            {clasesFiltradas.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No hay clases que coincidan con los filtros seleccionados
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {clasesFiltradas.map((clase) => (
                  <ClaseResultadosCard
                    key={clase.id}
                    clase={clase}
                    onVerGuia={() => navigate(`/profesor/ver-guia/${clase.id}`)}
                    onGestionarQuizzes={() => navigate(`/profesor/gestionar-quizzes/${clase.id}`)}
                    onVerRetroalimentaciones={() =>
                      navigate(`/profesor/retroalimentaciones/${clase.id}`)
                    }
                    onVerRecomendaciones={() =>
                      navigate(`/profesor/recomendaciones-quiz-pre/${clase.id}`)
                    }
                    onExportar={() => {
                      console.log("Exportar resultados:", clase.id);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="comparativo" className="space-y-4">
            <ComparacionPrePost clases={data.clases} />
          </TabsContent>

          <TabsContent value="atencion" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Alumnos que Necesitan Atención
                </CardTitle>
                <CardDescription>
                  Alumnos con bajo rendimiento, quizzes pendientes o baja participación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlumnosAtencionTable alumnos={data.alumnos_atencion} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Resultados de Quizzes
                </CardTitle>
                <CardDescription>Quizzes previos y post con resultados agregados</CardDescription>
              </CardHeader>
              <CardContent>
                <QuizResultadosGrid
                  quizzes={data.quizzes}
                  onVerDetalle={(quizId) => {
                    console.log("Ver detalle quiz:", quizId);
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DetalleClaseModal
        clase={claseDetalle}
        open={modalAbierto}
        onOpenChange={setModalAbierto}
      />
    </AppLayout>
  );
}


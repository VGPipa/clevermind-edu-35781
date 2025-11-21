import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BookOpen, Calendar, Award, MessageSquare, TrendingUp, Target, Clock } from "lucide-react";
import { useMisClasesAlumno } from "@/hooks/use-mis-clases-alumno";
import { MateriaCard } from "@/components/alumno/MateriaCard";
import { ClaseListItem } from "@/components/alumno/ClaseListItem";
import { QuizCard } from "@/components/alumno/QuizCard";
import { ResultadosTable } from "@/components/alumno/ResultadosTable";
import { EvolucionNotasChart } from "@/components/alumno/EvolucionNotasChart";
import { QuizDetalleModal } from "@/components/alumno/QuizDetalleModal";
import type { ClaseData, QuizData } from "@/hooks/use-mis-clases-alumno";

export default function Clases() {
  const { data, isLoading, error } = useMisClasesAlumno();
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [filtroMateria, setFiltroMateria] = useState<string>("todas");
  const [busqueda, setBusqueda] = useState("");
  const [quizDetalle, setQuizDetalle] = useState<QuizData | null>(null);
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

  // Filtrar clases
  let clasesFiltradas = data.clases;
  if (filtroMateria !== "todas") {
    clasesFiltradas = clasesFiltradas.filter(
      (c) => c.tema.materia.id === filtroMateria
    );
  }
  if (filtroEstado !== "todos") {
    if (filtroEstado === "programadas") {
      clasesFiltradas = clasesFiltradas.filter(
        (c) => c.estado === "programada" || c.estado === "clase_programada"
      );
    } else if (filtroEstado === "ejecutadas") {
      clasesFiltradas = clasesFiltradas.filter(
        (c) => c.estado === "completada" || c.estado === "ejecutada"
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

  // Filtrar quizzes
  let quizzesFiltrados = data.quizzes;
  if (filtroMateria !== "todas") {
    const materiaSeleccionada = data.materias.find((m) => m.id === filtroMateria);
    if (materiaSeleccionada) {
      quizzesFiltrados = quizzesFiltrados.filter(
        (q) => {
          // Buscar la clase correspondiente al quiz
          const clase = data.clases.find((c) => c.id === q.clase.id);
          return clase?.tema.materia.id === filtroMateria;
        }
      );
    }
  }
  if (filtroEstado !== "todos") {
    if (filtroEstado === "disponibles") {
      quizzesFiltrados = quizzesFiltrados.filter(
        (q) => q.estado === "publicado" && !q.respuesta_alumno
      );
    } else if (filtroEstado === "completados") {
      quizzesFiltrados = quizzesFiltrados.filter(
        (q) => q.respuesta_alumno?.estado === "completado"
      );
    }
  }

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

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                <div className="text-3xl font-bold text-green-600">
                  {data.kpis.quizzes_completados}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Quizzes Completados</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {data.kpis.quizzes_pendientes}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Quizzes Pendientes</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {data.kpis.tasa_participacion}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">Tasa de Participación</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {data.kpis.progreso_general}%
                </div>
                <p className="text-sm text-muted-foreground mt-1">Progreso General</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Materias */}
        {data.materias.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {data.materias.map((materia) => (
              <MateriaCard
                key={materia.id}
                materia={materia}
                onClick={() => setSelectedMateria(selectedMateria === materia.id ? null : materia.id)}
              />
            ))}
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="clases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="clases">Mis Clases</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes y Evaluaciones</TabsTrigger>
            <TabsTrigger value="resultados">Resultados y Progreso</TabsTrigger>
            <TabsTrigger value="retroalimentaciones">Retroalimentaciones</TabsTrigger>
          </TabsList>

          <TabsContent value="clases" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Mis Clases
                    </CardTitle>
                    <CardDescription>Clases programadas y ejecutadas</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Materia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las materias</SelectItem>
                        {data.materias.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre}
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
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-[200px]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {clasesFiltradas.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay clases que coincidan con los filtros
                  </div>
                ) : (
                  <div className="space-y-3">
                    {clasesFiltradas.map((clase) => (
                      <ClaseListItem
                        key={clase.id}
                        clase={clase}
                        onVerDetalle={() => {
                          // Navegar a detalle de clase si existe
                          console.log("Ver detalle de clase:", clase.id);
                        }}
                        onVerRetroalimentaciones={() => {
                          // Navegar a retroalimentaciones si existe
                          console.log("Ver retroalimentaciones de clase:", clase.id);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Quizzes y Evaluaciones
                    </CardTitle>
                    <CardDescription>Quizzes disponibles y completados</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Materia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas las materias</SelectItem>
                        {data.materias.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre}
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
                        <SelectItem value="disponibles">Disponibles</SelectItem>
                        <SelectItem value="completados">Completados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {quizzesFiltrados.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay quizzes que coincidan con los filtros
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {quizzesFiltrados.map((quiz) => (
                      <QuizCard
                        key={quiz.id}
                        quiz={quiz}
                        onComenzar={() => {
                          // Navegar a comenzar quiz
                          console.log("Comenzar quiz:", quiz.id);
                        }}
                        onVerResultados={() => {
                          setQuizDetalle(quiz);
                          setModalAbierto(true);
                        }}
                        onVerDetalle={() => {
                          setQuizDetalle(quiz);
                          setModalAbierto(true);
                        }}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4">
            <EvolucionNotasChart quizzes={data.quizzes} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-success" />
                  Resultados por Materia
                </CardTitle>
                <CardDescription>Desempeño detallado por materia</CardDescription>
              </CardHeader>
              <CardContent>
                <ResultadosTable resultados={data.resultados} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retroalimentaciones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-secondary" />
                  Retroalimentaciones
                </CardTitle>
                <CardDescription>Feedback recibido de tus profesores</CardDescription>
              </CardHeader>
              <CardContent>
                {data.retroalimentaciones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay retroalimentaciones disponibles
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.retroalimentaciones.map((retro) => (
                      <div
                        key={retro.id}
                        className="p-4 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {retro.tipo === "alumno"
                                ? "Para ti"
                                : retro.tipo === "profesor_individual"
                                  ? "Profesor"
                                  : retro.tipo}
                            </Badge>
                            {retro.clase && (
                              <p className="text-sm font-medium">{retro.clase.tema.nombre}</p>
                            )}
                          </div>
                          {retro.fecha_envio && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(retro.fecha_envio).toLocaleDateString("es-PE")}
                            </span>
                          )}
                        </div>
                        {retro.contenido && typeof retro.contenido === "object" && (
                          <div className="text-sm text-muted-foreground">
                            {retro.contenido.resumen || JSON.stringify(retro.contenido)}
                          </div>
                        )}
                        {typeof retro.contenido === "string" && (
                          <div className="text-sm text-muted-foreground">{retro.contenido}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <QuizDetalleModal
        quiz={quizDetalle}
        open={modalAbierto}
        onOpenChange={setModalAbierto}
      />
    </AppLayout>
  );
}

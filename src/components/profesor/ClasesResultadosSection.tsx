import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Eye, Calendar, Users, CheckCircle2, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClaseResultado {
  id: string;
  numero_sesion?: number | null;
  fecha_programada?: string | null;
  fecha_ejecutada?: string | null;
  estado: string;
  tema: {
    id: string;
    nombre: string;
    materia: {
      id: string;
      nombre: string;
    };
  };
  quizzes?: Array<{
    id: string;
    tipo: string;
    estado: string | null;
  }>;
}

interface ClasesResultadosSectionProps {
  temas?: Array<{
    tema: {
      id: string;
      nombre: string;
      materia: {
        id: string;
        nombre: string;
      };
    };
    sesiones: ClaseResultado[];
    progreso: {
      completadas: number;
      programadas: number;
      pendientes: number;
      porcentaje: number;
    };
  }>;
  onVerClase?: (claseId: string) => void;
}

export function ClasesResultadosSection({
  temas,
  onVerClase,
}: ClasesResultadosSectionProps) {
  const [filtroTema, setFiltroTema] = useState<string>("todos");
  const [filtroMateria, setFiltroMateria] = useState<string>("todas");

  if (!temas || temas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Clases</CardTitle>
          <CardDescription>Métricas y resultados por clase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay clases con resultados disponibles aún
          </div>
        </CardContent>
      </Card>
    );
  }

  // Obtener materias únicas
  const materiasUnicas = Array.from(
    new Set(temas.map((t) => t.tema.materia.id))
  ).map((id) => {
    const tema = temas.find((t) => t.tema.materia.id === id);
    return {
      id,
      nombre: tema?.tema.materia.nombre || "",
    };
  });

  // Filtrar temas
  let temasFiltrados = temas;
  if (filtroMateria !== "todas") {
    temasFiltrados = temasFiltrados.filter(
      (t) => t.tema.materia.id === filtroMateria
    );
  }
  if (filtroTema !== "todos") {
    temasFiltrados = temasFiltrados.filter(
      (t) => t.tema.id === filtroTema
    );
  }

  // Obtener todas las sesiones de los temas filtrados
  const todasLasSesiones = temasFiltrados.flatMap((t) =>
    t.sesiones.map((s) => ({
      ...s,
      temaNombre: t.tema.nombre,
      materiaNombre: t.tema.materia.nombre,
    }))
  );

  // Preparar datos para gráfico de comparación pre/post
  const sesionesConQuizzes = todasLasSesiones.filter(
    (s) => s.quizzes && s.quizzes.length > 0
  );

  // Gráfico de progreso por tema
  const datosProgreso = temasFiltrados.map((tema) => ({
    nombre:
      tema.tema.nombre.length > 20
        ? tema.tema.nombre.substring(0, 20) + "..."
        : tema.tema.nombre,
    completadas: tema.progreso.completadas,
    programadas: tema.progreso.programadas,
    porcentaje: tema.progreso.porcentaje,
  }));

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "completada":
      case "ejecutada":
        return (
          <Badge variant="default" className="bg-green-600">
            Completada
          </Badge>
        );
      case "programada":
      case "clase_programada":
        return <Badge variant="outline">Programada</Badge>;
      default:
        return <Badge variant="secondary">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Filtrar por Materia</Label>
              <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las materias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las materias</SelectItem>
                  {materiasUnicas.map((materia) => (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filtrar por Tema</Label>
              <Select value={filtroTema} onValueChange={setFiltroTema}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los temas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los temas</SelectItem>
                  {temasFiltrados.map((tema) => (
                    <SelectItem key={tema.tema.id} value={tema.tema.id}>
                      {tema.tema.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Progreso por Tema */}
      {datosProgreso.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progreso de Sesiones por Tema</CardTitle>
            <CardDescription>
              Estado de completitud de sesiones por tema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosProgreso}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="nombre"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="completadas" fill="#22c55e" name="Completadas" />
                <Bar dataKey="programadas" fill="#3b82f6" name="Programadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Lista de Clases */}
      <Card>
        <CardHeader>
          <CardTitle>Clases y Sesiones</CardTitle>
          <CardDescription>
            {todasLasSesiones.length} sesión(es) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todasLasSesiones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay sesiones que coincidan con los filtros
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {temasFiltrados.map((temaData) => (
                  <div key={temaData.tema.id} className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <h4 className="font-semibold">{temaData.tema.nombre}</h4>
                        <p className="text-sm text-muted-foreground">
                          {temaData.tema.materia.nombre}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {temaData.progreso.porcentaje}% completado
                      </Badge>
                    </div>
                    {temaData.sesiones.length > 0 && (
                      <div className="space-y-2 pl-4 border-l-2 border-muted">
                        {temaData.sesiones.map((sesion) => (
                          <Card key={sesion.id} className="hover:shadow-md transition-all">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    {sesion.numero_sesion && (
                                      <Badge variant="outline">
                                        Sesión {sesion.numero_sesion}
                                      </Badge>
                                    )}
                                    {getEstadoBadge(sesion.estado)}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {sesion.fecha_programada && (
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                          {new Date(
                                            sesion.fecha_programada
                                          ).toLocaleDateString("es-ES", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </span>
                                      </div>
                                    )}
                                    {sesion.quizzes && sesion.quizzes.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span>
                                          {sesion.quizzes.length} quiz(zes)
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {onVerClase && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onVerClase(sesion.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Ver Detalle
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


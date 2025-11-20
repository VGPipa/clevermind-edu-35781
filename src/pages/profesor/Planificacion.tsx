import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { useQuery, QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TemaCard } from "@/components/profesor/TemaCard";
import { TemaListCard } from "@/components/profesor/TemaListCard";
import { TemaDetailModal } from "@/components/profesor/TemaDetailModal";
import { IniciarTemaDialog } from "@/components/profesor/IniciarTemaDialog";
import { StatsCard } from "@/components/profesor/StatsCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface Tema {
  id: string;
  nombre: string;
  descripcion: string;
  objetivos: string;
  duracion_estimada: number;
  estado: 'completado' | 'en_progreso' | 'pendiente';
  clases_programadas: number;
  clases_ejecutadas: number;
  progreso: number;
  es_modificado: boolean;
}

interface Bimestre {
  numero: number;
  nombre: string;
  periodo: string;
  temas: Tema[];
}

interface Materia {
  id: string;
  nombre: string;
  descripcion: string;
  grado: string;
  grupo: string;
  seccion: string;
  horas_semanales: number;
  progreso_general: number;
  bimestres: Bimestre[];
}

interface PlanificacionData {
  anio_escolar: string;
  materias: Materia[];
}

export default function Planificacion() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = new QueryClient();
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [selectedTema, setSelectedTema] = useState<Tema | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isIniciarTemaOpen, setIsIniciarTemaOpen] = useState(false);
  const [temaParaIniciar, setTemaParaIniciar] = useState<any>(null);
  const [vistaActiva, setVistaActiva] = useState<'materias' | 'temas'>('materias');
  const [filtroMateria, setFiltroMateria] = useState<string>('todos');
  const [filtroBimestre, setFiltroBimestre] = useState<string>('todos');
  const [filtroEstatus, setFiltroEstatus] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['planificacion-profesor'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-planificacion-profesor');
      
      if (error) throw error;
      return data as PlanificacionData;
    },
  });

  const { data: temasData, isLoading: isLoadingTemas, refetch: refetchTemas } = useQuery({
    queryKey: ['temas-planificacion'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-temas-planificacion');
      if (error) throw error;
      return data;
    },
    enabled: vistaActiva === 'temas',
  });

  const handleProgramarClase = (temaId: string) => {
    navigate(`/profesor/planificacion/tema/${temaId}`);
  };

  const handleVerTema = (temaId: string) => {
    navigate(`/profesor/planificacion/tema/${temaId}`);
  };

  const handleIniciarTema = (tema: any) => {
    // Buscar datos completos del tema con materia
    for (const materia of data.materias) {
      for (const bimestre of materia.bimestres) {
        const temaCompleto = bimestre.temas.find(t => t.id === tema.id);
        if (temaCompleto) {
          setTemaParaIniciar({
            ...temaCompleto,
            materias: {
              horas_semanales: materia.horas_semanales
            }
          });
          setIsIniciarTemaOpen(true);
          return;
        }
      }
    }
  };

  const handleVerDetalle = (temaId: string) => {
    // Encontrar el tema completo basado en el ID
    for (const materia of data.materias) {
      for (const bimestre of materia.bimestres) {
        const tema = bimestre.temas.find(t => t.id === temaId);
        if (tema) {
          setSelectedTema(tema);
          setIsModalOpen(true);
          return;
        }
      }
    }
  };

  const refetchPlanificacion = async () => {
    await queryClient.invalidateQueries({ queryKey: ['planificacion-profesor'] });
    refetchTemas();
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-5 w-96 mt-2" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Error al cargar la planificación. Por favor, intenta nuevamente.</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!data || data.materias.length === 0) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tienes materias asignadas para el año {data?.anio_escolar || '2025'}.</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Seleccionar la primera materia por defecto
  const currentMateria = selectedMateria 
    ? data.materias.find(m => m.id === selectedMateria) 
    : data.materias[0];

  if (currentMateria && !selectedMateria) {
    setSelectedMateria(currentMateria.id);
  }

  // Calcular estadísticas generales
  const totalTemas = data.materias.reduce((acc, m) => 
    acc + m.bimestres.reduce((b, bi) => b + bi.temas.length, 0), 0
  );
  
  const temasCompletados = data.materias.reduce((acc, m) => 
    acc + m.bimestres.reduce((b, bi) => 
      b + bi.temas.filter(t => t.estado === 'completado').length, 0
    ), 0
  );

  const progresoGeneral = totalTemas > 0 
    ? Math.round((temasCompletados / totalTemas) * 100) 
    : 0;

  const clasesEjecutadas = data.materias.reduce((acc, m) =>
    acc + m.bimestres.reduce((b, bi) =>
      b + bi.temas.reduce((t, tema) => t + tema.clases_ejecutadas, 0), 0
    ), 0
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Planificación Académica {data.anio_escolar}
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona tus materias y planifica tus clases
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total de Temas"
            value={totalTemas}
            icon={BookOpen}
            iconColor="text-primary"
          />
          <StatsCard
            title="Temas Completados"
            value={temasCompletados}
            icon={CheckCircle2}
            iconColor="text-success"
          />
          <StatsCard
            title="Progreso General"
            value={`${Math.round(progresoGeneral)}%`}
            icon={TrendingUp}
            iconColor="text-accent"
          />
          <StatsCard
            title="Materias Asignadas"
            value={data.materias.length}
            icon={Calendar}
            iconColor="text-secondary"
          />
        </div>

        {/* Alertas de materias sin temas */}
        {vistaActiva === 'materias' && data.materias.some((m: Materia) => m.bimestres.every(b => b.temas.length === 0)) && (
          <Card className="border-warning">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Algunas materias no tienen temas configurados</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revisa las materias que no tienen contenido planificado
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs principales: Materias / Temas */}
        <Tabs value={vistaActiva} onValueChange={(v) => setVistaActiva(v as 'materias' | 'temas')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="materias">Por Materias</TabsTrigger>
            <TabsTrigger value="temas">Temas</TabsTrigger>
          </TabsList>

          <TabsContent value="materias" className="space-y-6 mt-6">
        {/* Subject Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Selecciona una Materia</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedMateria || undefined} onValueChange={setSelectedMateria}>
              <TabsList className="w-full flex flex-wrap h-auto">
                {data.materias.map((materia) => (
                  <TabsTrigger key={materia.id} value={materia.id} className="flex-1 min-w-[200px]">
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{materia.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {materia.grado}° Primaria - {materia.grupo}
                      </span>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {data.materias.map((materia) => (
                <TabsContent key={materia.id} value={materia.id} className="space-y-4 mt-6">
                  {/* Materia Info */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{materia.nombre}</h3>
                      <p className="text-sm text-muted-foreground">
                        {materia.descripcion || `${materia.grado}° Primaria - ${materia.grupo} (Sección ${materia.seccion})`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">{materia.horas_semanales}h/semana</Badge>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Progreso</p>
                        <p className="text-2xl font-bold text-primary">{materia.progreso_general}%</p>
                      </div>
                    </div>
                  </div>

                  <Progress value={materia.progreso_general} className="h-2" />

                  {/* Bimestres */}
                  <Accordion type="single" collapsible defaultValue="bimestre-1" className="w-full">
                    {materia.bimestres.map((bimestre) => {
                      const temasCompletadosBimestre = bimestre.temas.filter(t => t.estado === 'completado').length;
                      const progesoBimestre = bimestre.temas.length > 0
                        ? Math.round((temasCompletadosBimestre / bimestre.temas.length) * 100)
                        : 0;

                      return (
                        <AccordionItem key={bimestre.numero} value={`bimestre-${bimestre.numero}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                  <span className="text-primary font-bold">{bimestre.numero}</span>
                                </div>
                                <div className="text-left">
                                  <h4 className="font-semibold">{bimestre.nombre}</h4>
                                  <p className="text-sm text-muted-foreground">{bimestre.periodo}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <Badge variant={progesoBimestre === 100 ? "default" : "secondary"}>
                                  {temasCompletadosBimestre}/{bimestre.temas.length} temas
                                </Badge>
                                <div className="text-right">
                                  <p className="text-sm font-medium">{progesoBimestre}%</p>
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            {/* Verificar si la materia está vacía */}
                            {materia.bimestres.every(b => b.temas.length === 0) ? (
                              <div className="p-6 text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-warning/10 mb-4">
                                  <AlertCircle className="h-8 w-8 text-warning" />
                                </div>
                                <h3 className="text-lg font-semibold mb-2">Sin Temas Configurados</h3>
                                <p className="text-muted-foreground mb-4">
                                  Esta materia no tiene temas planificados para ningún bimestre.
                                </p>
                                <Badge variant="outline" className="text-warning border-warning">
                                  Pendiente de Configuración
                                </Badge>
                              </div>
                            ) : (
                              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                                {bimestre.temas.map((tema) => (
                                  <TemaCard
                                    key={tema.id}
                                    tema={tema}
                                    onProgramarClase={handleProgramarClase}
                                    onVerDetalle={handleVerDetalle}
                                    onIniciarTema={handleIniciarTema}
                                  />
                                ))}
                              </div>
                            )}
                            {bimestre.temas.length === 0 && materia.bimestres.some(b => b.temas.length > 0) && (
                              <p className="text-center text-muted-foreground py-8">
                                No hay temas registrados para este bimestre
                              </p>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="temas" className="space-y-6 mt-6">
            {/* Filtros y búsqueda */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Temas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tema por nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Materia</label>
                    <Select value={filtroMateria} onValueChange={setFiltroMateria}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todas las materias</SelectItem>
                        {data?.materias.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Bimestre</label>
                    <Select value={filtroBimestre} onValueChange={setFiltroBimestre}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los bimestres</SelectItem>
                        <SelectItem value="1">Bimestre I</SelectItem>
                        <SelectItem value="2">Bimestre II</SelectItem>
                        <SelectItem value="3">Bimestre III</SelectItem>
                        <SelectItem value="4">Bimestre IV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Estatus</label>
                    <Select value={filtroEstatus} onValueChange={setFiltroEstatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los estatus</SelectItem>
                        <SelectItem value="sin_guia">Sin Guía</SelectItem>
                        <SelectItem value="con_guia_sin_sesiones">Con Guía Sin Sesiones</SelectItem>
                        <SelectItem value="con_sesiones">Con Sesiones</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Estadísticas */}
                {temasData && (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{temasData.total || 0}</div>
                      <p className="text-xs text-muted-foreground">Total Temas</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{temasData.sin_guia || 0}</div>
                      <p className="text-xs text-muted-foreground">Sin Guía</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{temasData.con_guia || 0}</div>
                      <p className="text-xs text-muted-foreground">Con Guía</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{temasData.con_sesiones || 0}</div>
                      <p className="text-xs text-muted-foreground">Con Sesiones</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lista de Temas */}
            {isLoadingTemas ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : temasData?.temas && temasData.temas.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {temasData.temas
                  .filter((tema: any) => {
                    // Filtro por búsqueda
                    if (busqueda && !tema.nombre.toLowerCase().includes(busqueda.toLowerCase())) {
                      return false;
                    }
                    // Filtro por materia
                    if (filtroMateria !== 'todos' && tema.materia?.id !== filtroMateria) {
                      return false;
                    }
                    // Filtro por bimestre
                    if (filtroBimestre !== 'todos' && tema.bimestre.toString() !== filtroBimestre) {
                      return false;
                    }
                    // Filtro por estatus
                    if (filtroEstatus !== 'todos' && tema.estatus !== filtroEstatus) {
                      return false;
                    }
                    return true;
                  })
                  .map((tema: any) => (
                    <TemaListCard
                      key={tema.id}
                      tema={tema}
                      onIniciarTema={() => {
                        // Buscar tema completo para iniciar
                        for (const materia of data.materias) {
                          for (const bimestre of materia.bimestres) {
                            const temaCompleto = bimestre.temas.find(t => t.id === tema.id);
                            if (temaCompleto) {
                              setTemaParaIniciar({
                                ...temaCompleto,
                                materias: {
                                  horas_semanales: materia.horas_semanales
                                }
                              });
                              setIsIniciarTemaOpen(true);
                              return;
                            }
                          }
                        }
                      }}
                      onVerGuia={() => handleVerTema(tema.id)}
                      onProgramarSesion={() => handleVerTema(tema.id)}
                      onVerDetalle={() => handleVerTema(tema.id)}
                      onVerEnSalones={() => navigate('/profesor/mis-salones')}
                    />
                  ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No hay temas disponibles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Tema Detail Modal */}
      <TemaDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tema={selectedTema}
      />

      {/* Iniciar Tema Dialog */}
      {temaParaIniciar && (
        <IniciarTemaDialog
          open={isIniciarTemaOpen}
          onOpenChange={setIsIniciarTemaOpen}
          tema={temaParaIniciar}
          onSuccess={refetchPlanificacion}
        />
      )}
    </AppLayout>
  );
}

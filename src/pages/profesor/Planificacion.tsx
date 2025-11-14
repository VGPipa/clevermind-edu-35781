import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TemaCard } from "@/components/profesor/TemaCard";
import { TemaDetailModal } from "@/components/profesor/TemaDetailModal";
import { StatsCard } from "@/components/profesor/StatsCard";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
  const [selectedMateria, setSelectedMateria] = useState<string | null>(null);
  const [selectedTema, setSelectedTema] = useState<Tema | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['planificacion-profesor'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-planificacion-profesor');
      
      if (error) throw error;
      return data as PlanificacionData;
    },
  });

  const handleProgramarClase = (temaId: string) => {
    navigate(`/profesor/generar-clase?tema=${temaId}`);
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
        {data.materias.some((m: Materia) => m.bimestres.every(b => b.temas.length === 0)) && (
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
      </div>

      {/* Tema Detail Modal */}
      <TemaDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        tema={selectedTema}
      />
    </AppLayout>
  );
}

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Filter, Plus } from "lucide-react";
import { PlanAnualStats } from "@/components/admin/PlanAnualStats";
import { MateriaCard } from "@/components/admin/MateriaCard";
import { TemasTable } from "@/components/admin/TemasTable";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PlanAnual() {
  const [selectedGrado, setSelectedGrado] = useState<string>("all");
  const [expandedMateria, setExpandedMateria] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['plan-anual-admin', selectedGrado],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedGrado !== 'all') {
        params.append('grado', selectedGrado);
      }
      
      const { data, error } = await supabase.functions.invoke('get-plan-anual-admin', {
        body: {},
      });
      
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
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-32" />
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
              <p>Error al cargar el plan anual. Por favor, intenta nuevamente.</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  if (!data || !data.plan_anual) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <p className="text-lg font-medium mb-2">No hay plan anual configurado</p>
              <p className="text-muted-foreground mb-4">
                Crea un plan anual para comenzar a gestionar materias y temas
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Crear Plan Anual
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const materiasPorEstado = {
    todas: data.materias,
    completas: data.materias.filter((m: any) => m.estado === 'completo'),
    pendientes: data.materias.filter((m: any) => m.estado === 'pendiente'),
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Plan Anual {data.plan_anual.anio_escolar}
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestión completa del plan académico - {data.plan_anual.grado}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedGrado} onValueChange={setSelectedGrado}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filtrar por grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los grados</SelectItem>
                <SelectItem value="1° Primaria">1° Primaria</SelectItem>
                <SelectItem value="2° Primaria">2° Primaria</SelectItem>
                <SelectItem value="3° Primaria">3° Primaria</SelectItem>
                <SelectItem value="4° Primaria">4° Primaria</SelectItem>
                <SelectItem value="5° Primaria">5° Primaria</SelectItem>
                <SelectItem value="6° Primaria">6° Primaria</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Materia
            </Button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <PlanAnualStats estadisticas={data.estadisticas} />

        {/* Tabs de materias */}
        <Tabs defaultValue="todas" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="todas">
              Todas ({materiasPorEstado.todas.length})
            </TabsTrigger>
            <TabsTrigger value="completas">
              Completas ({materiasPorEstado.completas.length})
            </TabsTrigger>
            <TabsTrigger value="pendientes">
              Pendientes ({materiasPorEstado.pendientes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="todas" className="space-y-4">
            <MateriasList 
              materias={materiasPorEstado.todas} 
              expandedMateria={expandedMateria}
              setExpandedMateria={setExpandedMateria}
            />
          </TabsContent>

          <TabsContent value="completas" className="space-y-4">
            <MateriasList 
              materias={materiasPorEstado.completas}
              expandedMateria={expandedMateria}
              setExpandedMateria={setExpandedMateria}
            />
          </TabsContent>

          <TabsContent value="pendientes" className="space-y-4">
            {materiasPorEstado.pendientes.length > 0 ? (
              <MateriasList 
                materias={materiasPorEstado.pendientes}
                expandedMateria={expandedMateria}
                setExpandedMateria={setExpandedMateria}
              />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      ¡Excelente! Todas las materias tienen temas configurados
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

interface MateriasListProps {
  materias: any[];
  expandedMateria: string | null;
  setExpandedMateria: (id: string | null) => void;
}

function MateriasList({ materias, expandedMateria, setExpandedMateria }: MateriasListProps) {
  return (
    <div className="space-y-4">
      {materias.map((materia: any) => (
        <div key={materia.id}>
          <MateriaCard 
            materia={materia}
            onExpandir={() => setExpandedMateria(
              expandedMateria === materia.id ? null : materia.id
            )}
            expanded={expandedMateria === materia.id}
          />
          
          {expandedMateria === materia.id && materia.total_temas > 0 && (
            <Card className="mt-2 border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-base">Temas de {materia.nombre}</CardTitle>
                <CardDescription>
                  {materia.total_temas} {materia.total_temas === 1 ? 'tema' : 'temas'} configurados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="todos" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="todos">
                      Todos ({materia.total_temas})
                    </TabsTrigger>
                    {[1, 2, 3, 4].map(bim => (
                      <TabsTrigger key={bim} value={`bim${bim}`}>
                        Bimestre {bim} ({materia.temas_por_bimestre[bim]?.length || 0})
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value="todos">
                    <TemasTable 
                      temas={Object.values(materia.temas_por_bimestre).flat() as any[]} 
                    />
                  </TabsContent>

                  {[1, 2, 3, 4].map(bim => (
                    <TabsContent key={bim} value={`bim${bim}`}>
                      <TemasTable 
                        temas={materia.temas_por_bimestre[bim] || []}
                        bimestre={bim}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  );
}

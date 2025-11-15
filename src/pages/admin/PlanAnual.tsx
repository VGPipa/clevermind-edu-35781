import { useState, useMemo } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Filter, Plus, Edit, Trash2, Copy } from "lucide-react";
import { PlanAnualStats } from "@/components/admin/PlanAnualStats";
import { MateriaCard } from "@/components/admin/MateriaCard";
import { TemasTable } from "@/components/admin/TemasTable";
import { PlanAnualDialog } from "@/components/admin/PlanAnualDialog";
import { MateriaDialog } from "@/components/admin/MateriaDialog";
import { TemaDialog } from "@/components/admin/TemaDialog";
import { SearchAndFilter } from "@/components/admin/SearchAndFilter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function PlanAnual() {
  const [selectedGrado, setSelectedGrado] = useState<string>("all");
  const [expandedMateria, setExpandedMateria] = useState<string | null>(null);
  const [searchMateria, setSearchMateria] = useState<string>("");
  const [filterEstado, setFilterEstado] = useState<string>("all");
  const [filterHorasMin, setFilterHorasMin] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("orden");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedMaterias, setSelectedMaterias] = useState<Set<string>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [planAnualDialogOpen, setPlanAnualDialogOpen] = useState(false);
  const [editingPlanAnual, setEditingPlanAnual] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [materiaDialogOpen, setMateriaDialogOpen] = useState(false);
  const [editingMateria, setEditingMateria] = useState<any>(null);
  const [deleteMateriaDialogOpen, setDeleteMateriaDialogOpen] = useState(false);
  const [materiaToDelete, setMateriaToDelete] = useState<any>(null);
  const [temaDialogOpen, setTemaDialogOpen] = useState(false);
  const [editingTema, setEditingTema] = useState<any>(null);
  const [currentMateriaId, setCurrentMateriaId] = useState<string>("");
  const [deleteTemaDialogOpen, setDeleteTemaDialogOpen] = useState(false);
  const [temaToDelete, setTemaToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

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

  const handleCreatePlanAnual = () => {
    setEditingPlanAnual(null);
    setPlanAnualDialogOpen(true);
  };

  const handleEditPlanAnual = () => {
    if (data?.plan_anual) {
      setEditingPlanAnual(data.plan_anual);
      setPlanAnualDialogOpen(true);
    }
  };

  const handleDeletePlanAnual = () => {
    if (data?.plan_anual) {
      setPlanToDelete(data.plan_anual);
      setDeleteDialogOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;

    try {
      // Check if plan has materias
      const { data: materias, error: materiasError } = await supabase
        .from('materias')
        .select('id')
        .eq('id_plan_anual', planToDelete.id)
        .limit(1);

      if (materiasError) throw materiasError;

      if (materias && materias.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar un plan anual que tiene materias asignadas. Elimina primero las materias.",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('plan_anual')
        .delete()
        .eq('id', planToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Plan anual eliminado correctamente",
      });

      setDeleteDialogOpen(false);
      setPlanToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el plan anual",
        variant: "destructive",
      });
    }
  };

  const handlePlanAnualSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
  };

  const handleCreateMateria = () => {
    setEditingMateria(null);
    setMateriaDialogOpen(true);
  };

  const handleEditMateria = (materia: any) => {
    setEditingMateria(materia);
    setMateriaDialogOpen(true);
  };

  const handleDeleteMateria = (materia: any) => {
    setMateriaToDelete(materia);
    setDeleteMateriaDialogOpen(true);
  };

  const confirmDeleteMateria = async () => {
    if (!materiaToDelete) return;

    try {
      // Check if materia has temas
      const { data: temas, error: temasError } = await supabase
        .from('temas')
        .select('id')
        .eq('id_materia', materiaToDelete.id)
        .limit(1);

      if (temasError) throw temasError;

      if (temas && temas.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar una materia que tiene temas asignados. Elimina primero los temas.",
          variant: "destructive",
        });
        setDeleteMateriaDialogOpen(false);
        return;
      }

      // Check if materia has asignaciones
      const { data: asignaciones, error: asignacionesError } = await supabase
        .from('asignaciones_profesor')
        .select('id')
        .eq('id_materia', materiaToDelete.id)
        .limit(1);

      if (asignacionesError) throw asignacionesError;

      if (asignaciones && asignaciones.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar una materia que tiene profesores asignados. Elimina primero las asignaciones.",
          variant: "destructive",
        });
        setDeleteMateriaDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('materias')
        .delete()
        .eq('id', materiaToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Materia eliminada correctamente",
      });

      setDeleteMateriaDialogOpen(false);
      setMateriaToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error deleting materia:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la materia",
        variant: "destructive",
      });
    }
  };

  const handleMateriaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
  };

  const handleCreateTema = (materiaId: string) => {
    setEditingTema(null);
    setCurrentMateriaId(materiaId);
    setTemaDialogOpen(true);
  };

  const handleEditTema = (tema: any, materiaId: string) => {
    setEditingTema(tema);
    setCurrentMateriaId(materiaId);
    setTemaDialogOpen(true);
  };

  const handleDeleteTema = (tema: any) => {
    setTemaToDelete(tema);
    setDeleteTemaDialogOpen(true);
  };

  const confirmDeleteTema = async () => {
    if (!temaToDelete) return;

    try {
      // Check if tema has clases
      const { data: clases, error: clasesError } = await supabase
        .from('clases')
        .select('id')
        .eq('id_tema', temaToDelete.id)
        .limit(1);

      if (clasesError) throw clasesError;

      if (clases && clases.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar un tema que tiene clases programadas. Elimina primero las clases.",
          variant: "destructive",
        });
        setDeleteTemaDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('temas')
        .delete()
        .eq('id', temaToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tema eliminado correctamente",
      });

      setDeleteTemaDialogOpen(false);
      setTemaToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error deleting tema:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el tema",
        variant: "destructive",
      });
    }
  };

  const handleTemaSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
  };

  const handleDuplicatePlanAnual = async () => {
    if (!data?.plan_anual) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id_institucion')
        .eq('user_id', user.id)
        .single();

      if (!profile?.id_institucion) throw new Error('Institución no encontrada');

      // Create new plan with suffix
      const newAnioEscolar = `${data.plan_anual.anio_escolar} (Copia)`;
      const { data: newPlan, error: planError } = await supabase
        .from('plan_anual')
        .insert({
          id_institucion: profile.id_institucion,
          grado: data.plan_anual.grado,
          anio_escolar: newAnioEscolar,
          estado: 'activo',
        })
        .select()
        .single();

      if (planError) throw planError;

      // Get all materias for the original plan
      const { data: materias, error: materiasError } = await supabase
        .from('materias')
        .select('*')
        .eq('id_plan_anual', data.plan_anual.id);

      if (materiasError) throw materiasError;

      // Duplicate materias and their temas
      for (const materia of materias || []) {
        const { data: newMateria, error: materiaError } = await supabase
          .from('materias')
          .insert({
            id_plan_anual: newPlan.id,
            nombre: materia.nombre,
            descripcion: materia.descripcion,
            horas_semanales: materia.horas_semanales,
            orden: materia.orden,
          })
          .select()
          .single();

        if (materiaError) throw materiaError;

        // Get temas for this materia
        const { data: temas, error: temasError } = await supabase
          .from('temas')
          .select('*')
          .eq('id_materia', materia.id);

        if (temasError) throw temasError;

        // Duplicate temas
        if (temas && temas.length > 0) {
          const temasToInsert = temas.map(tema => ({
            id_materia: newMateria.id,
            nombre: tema.nombre,
            descripcion: tema.descripcion,
            objetivos: tema.objetivos,
            duracion_estimada: tema.duracion_estimada,
            bimestre: tema.bimestre,
            orden: tema.orden,
          }));

          const { error: insertTemasError } = await supabase
            .from('temas')
            .insert(temasToInsert);

          if (insertTemasError) throw insertTemasError;
        }
      }

      toast({
        title: "Éxito",
        description: "Plan anual duplicado correctamente",
      });

      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error duplicating plan:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo duplicar el plan anual",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateMateria = async (materia: any) => {
    try {
      // Create duplicate materia
      const { data: existingMaterias } = await supabase
        .from('materias')
        .select('orden')
        .eq('id_plan_anual', materia.id_plan_anual || data?.plan_anual?.id)
        .order('orden', { ascending: false })
        .limit(1);

      const nextOrden = existingMaterias && existingMaterias.length > 0
        ? (existingMaterias[0].orden || 0) + 1
        : 1;

      const { data: newMateria, error: materiaError } = await supabase
        .from('materias')
        .insert({
          id_plan_anual: materia.id_plan_anual || data?.plan_anual?.id,
          nombre: `${materia.nombre} (Copia)`,
          descripcion: materia.descripcion,
          horas_semanales: materia.horas_semanales,
          orden: nextOrden,
        })
        .select()
        .single();

      if (materiaError) throw materiaError;

      // Get temas for original materia
      const { data: temas, error: temasError } = await supabase
        .from('temas')
        .select('*')
        .eq('id_materia', materia.id);

      if (temasError) throw temasError;

      // Duplicate temas
      if (temas && temas.length > 0) {
        const temasToInsert = temas.map(tema => ({
          id_materia: newMateria.id,
          nombre: tema.nombre,
          descripcion: tema.descripcion,
          objetivos: tema.objetivos,
          duracion_estimada: tema.duracion_estimada,
          bimestre: tema.bimestre,
          orden: tema.orden,
        }));

        const { error: insertTemasError } = await supabase
          .from('temas')
          .insert(temasToInsert);

        if (insertTemasError) throw insertTemasError;
      }

      toast({
        title: "Éxito",
        description: "Materia duplicada correctamente",
      });

      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error duplicating materia:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo duplicar la materia",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTema = async (tema: any, materiaId: string) => {
    try {
      // Get max orden for this materia and bimestre
      const { data: existingTemas } = await supabase
        .from('temas')
        .select('orden')
        .eq('id_materia', materiaId)
        .eq('bimestre', tema.bimestre)
        .order('orden', { ascending: false })
        .limit(1);

      const nextOrden = existingTemas && existingTemas.length > 0
        ? (existingTemas[0].orden || 0) + 1
        : 1;

      const { error } = await supabase
        .from('temas')
        .insert({
          id_materia: materiaId,
          nombre: `${tema.nombre} (Copia)`,
          descripcion: tema.descripcion,
          objetivos: tema.objetivos,
          duracion_estimada: tema.duracion_estimada,
          bimestre: tema.bimestre,
          orden: nextOrden,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Tema duplicado correctamente",
      });

      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error duplicating tema:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo duplicar el tema",
        variant: "destructive",
      });
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
              <Button onClick={handleCreatePlanAnual}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Plan Anual
              </Button>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  // Filter and sort materias
  const materiasFiltradas = useMemo(() => {
    let filtered = [...(data.materias || [])];

    // Search filter
    if (searchMateria) {
      const searchLower = searchMateria.toLowerCase();
      filtered = filtered.filter((m: any) =>
        m.nombre.toLowerCase().includes(searchLower) ||
        (m.descripcion && m.descripcion.toLowerCase().includes(searchLower))
      );
    }

    // Estado filter
    if (filterEstado !== 'all') {
      filtered = filtered.filter((m: any) => m.estado === filterEstado);
    }

    // Horas semanales filter
    if (filterHorasMin !== 'all') {
      const minHoras = parseInt(filterHorasMin);
      filtered = filtered.filter((m: any) => m.horas_semanales >= minHoras);
    }

    // Sorting
    filtered.sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'nombre':
          aValue = a.nombre.toLowerCase();
          bValue = b.nombre.toLowerCase();
          break;
        case 'horas_semanales':
          aValue = a.horas_semanales || 0;
          bValue = b.horas_semanales || 0;
          break;
        case 'total_temas':
          aValue = a.total_temas || 0;
          bValue = b.total_temas || 0;
          break;
        case 'estado':
          aValue = a.estado;
          bValue = b.estado;
          break;
        default: // orden
          aValue = a.orden || 0;
          bValue = b.orden || 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [data.materias, searchMateria, filterEstado, filterHorasMin, sortBy, sortOrder]);

  const materiasPorEstado = {
    todas: materiasFiltradas,
    completas: materiasFiltradas.filter((m: any) => m.estado === 'completo'),
    pendientes: materiasFiltradas.filter((m: any) => m.estado === 'pendiente'),
  };

  const clearFilters = () => {
    setSearchMateria("");
    setFilterEstado("all");
    setFilterHorasMin("all");
    setSortBy("orden");
    setSortOrder("asc");
    setSelectedMaterias(new Set());
  };

  const toggleMateriaSelection = (materiaId: string) => {
    const newSelected = new Set(selectedMaterias);
    if (newSelected.has(materiaId)) {
      newSelected.delete(materiaId);
    } else {
      newSelected.add(materiaId);
    }
    setSelectedMaterias(newSelected);
  };

  const selectAllMaterias = () => {
    if (selectedMaterias.size === materiasFiltradas.length) {
      setSelectedMaterias(new Set());
    } else {
      setSelectedMaterias(new Set(materiasFiltradas.map((m: any) => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMaterias.size === 0) return;

    try {
      const materiasToDelete = Array.from(selectedMaterias);
      
      // Check for dependencies
      for (const materiaId of materiasToDelete) {
        const { data: temas } = await supabase
          .from('temas')
          .select('id')
          .eq('id_materia', materiaId)
          .limit(1);

        if (temas && temas.length > 0) {
          toast({
            title: "Error",
            description: "Algunas materias tienen temas asignados. Elimina primero los temas.",
            variant: "destructive",
          });
          setBulkDeleteDialogOpen(false);
          return;
        }

        const { data: asignaciones } = await supabase
          .from('asignaciones_profesor')
          .select('id')
          .eq('id_materia', materiaId)
          .limit(1);

        if (asignaciones && asignaciones.length > 0) {
          toast({
            title: "Error",
            description: "Algunas materias tienen profesores asignados. Elimina primero las asignaciones.",
            variant: "destructive",
          });
          setBulkDeleteDialogOpen(false);
          return;
        }
      }

      // Delete all selected materias
      const { error } = await supabase
        .from('materias')
        .delete()
        .in('id', materiasToDelete);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `${selectedMaterias.size} materia(s) eliminada(s) correctamente`,
      });

      setSelectedMaterias(new Set());
      setBulkDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['plan-anual-admin'] });
    } catch (error: any) {
      console.error('Error deleting materias:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron eliminar las materias",
        variant: "destructive",
      });
    }
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
            <Button variant="outline" onClick={handleEditPlanAnual}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Plan
            </Button>
            <Button variant="outline" onClick={handleDuplicatePlanAnual}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicar Plan
            </Button>
            <Button variant="destructive" onClick={handleDeletePlanAnual}>
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar Plan
            </Button>
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
            <Button onClick={handleCreateMateria} disabled={!data?.plan_anual}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Materia
            </Button>
          </div>
        </div>

        {/* Estadísticas generales */}
        <PlanAnualStats estadisticas={data.estadisticas} />

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <SearchAndFilter
              searchValue={searchMateria}
              onSearchChange={setSearchMateria}
              placeholder="Buscar materias por nombre o descripción..."
              filters={[
                {
                  label: "Estado",
                  value: filterEstado,
                  options: [
                    { label: "Todos", value: "all" },
                    { label: "Completas", value: "completo" },
                    { label: "Pendientes", value: "pendiente" },
                  ],
                  onChange: setFilterEstado,
                },
                {
                  label: "Horas mín.",
                  value: filterHorasMin,
                  options: [
                    { label: "Todas", value: "all" },
                    { label: "1+ horas", value: "1" },
                    { label: "3+ horas", value: "3" },
                    { label: "5+ horas", value: "5" },
                    { label: "8+ horas", value: "8" },
                  ],
                  onChange: setFilterHorasMin,
                },
                {
                  label: "Ordenar por",
                  value: sortBy,
                  options: [
                    { label: "Orden", value: "orden" },
                    { label: "Nombre", value: "nombre" },
                    { label: "Horas/sem", value: "horas_semanales" },
                    { label: "Total temas", value: "total_temas" },
                    { label: "Estado", value: "estado" },
                  ],
                  onChange: setSortBy,
                },
                {
                  label: "Dirección",
                  value: sortOrder,
                  options: [
                    { label: "Ascendente", value: "asc" },
                    { label: "Descendente", value: "desc" },
                  ],
                  onChange: (value) => setSortOrder(value as "asc" | "desc"),
                },
              ]}
              onClear={clearFilters}
            />
            
            {selectedMaterias.size > 0 && (
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md border border-primary/20">
                <span className="text-sm font-medium">
                  {selectedMaterias.size} materia(s) seleccionada(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMaterias(new Set())}
                  >
                    Deseleccionar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteDialogOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar ({selectedMaterias.size})
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              onEditMateria={handleEditMateria}
              onDeleteMateria={handleDeleteMateria}
              onDuplicateMateria={handleDuplicateMateria}
              onCreateTema={handleCreateTema}
              onEditTema={handleEditTema}
              onDeleteTema={handleDeleteTema}
              onDuplicateTema={handleDuplicateTema}
              selectedMaterias={selectedMaterias}
              onToggleSelection={toggleMateriaSelection}
            />
          </TabsContent>

          <TabsContent value="completas" className="space-y-4">
            <MateriasList 
              materias={materiasPorEstado.completas}
              expandedMateria={expandedMateria}
              setExpandedMateria={setExpandedMateria}
              onEditMateria={handleEditMateria}
              onDeleteMateria={handleDeleteMateria}
              onDuplicateMateria={handleDuplicateMateria}
              onCreateTema={handleCreateTema}
              onEditTema={handleEditTema}
              onDeleteTema={handleDeleteTema}
              onDuplicateTema={handleDuplicateTema}
              selectedMaterias={selectedMaterias}
              onToggleSelection={toggleMateriaSelection}
            />
          </TabsContent>

          <TabsContent value="pendientes" className="space-y-4">
            {materiasPorEstado.pendientes.length > 0 ? (
              <MateriasList 
                materias={materiasPorEstado.pendientes}
                expandedMateria={expandedMateria}
                setExpandedMateria={setExpandedMateria}
                onEditMateria={handleEditMateria}
                onDeleteMateria={handleDeleteMateria}
                onCreateTema={handleCreateTema}
                onEditTema={handleEditTema}
                onDeleteTema={handleDeleteTema}
                selectedMaterias={selectedMaterias}
                onToggleSelection={toggleMateriaSelection}
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

      <PlanAnualDialog
        open={planAnualDialogOpen}
        onOpenChange={setPlanAnualDialogOpen}
        planAnual={editingPlanAnual}
        onSuccess={handlePlanAnualSuccess}
      />

      <MateriaDialog
        open={materiaDialogOpen}
        onOpenChange={setMateriaDialogOpen}
        materia={editingMateria}
        planAnualId={data?.plan_anual?.id || ''}
        onSuccess={handleMateriaSuccess}
      />

      <TemaDialog
        open={temaDialogOpen}
        onOpenChange={setTemaDialogOpen}
        tema={editingTema}
        materiaId={currentMateriaId}
        onSuccess={handleTemaSuccess}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el plan anual "{planToDelete?.grado}" del año {planToDelete?.anio_escolar}.
              Asegúrate de que no tenga materias asignadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteMateriaDialogOpen} onOpenChange={setDeleteMateriaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la materia "{materiaToDelete?.nombre}".
              Asegúrate de que no tenga temas o asignaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMateria} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteTemaDialogOpen} onOpenChange={setDeleteTemaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el tema "{temaToDelete?.nombre}".
              Asegúrate de que no tenga clases programadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteTema} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {selectedMaterias.size} materia(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán {selectedMaterias.size} materia(s) seleccionada(s).
              Asegúrate de que no tengan temas o asignaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground">
              Eliminar {selectedMaterias.size} materia(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

interface MateriasListProps {
  materias: any[];
  expandedMateria: string | null;
  setExpandedMateria: (id: string | null) => void;
  onEditMateria: (materia: any) => void;
  onDeleteMateria: (materia: any) => void;
  onDuplicateMateria: (materia: any) => void;
  onCreateTema: (materiaId: string) => void;
  onEditTema: (tema: any, materiaId: string) => void;
  onDeleteTema: (tema: any) => void;
  onDuplicateTema: (tema: any, materiaId: string) => void;
  selectedMaterias: Set<string>;
  onToggleSelection: (materiaId: string) => void;
}

function MateriasList({ 
  materias, 
  expandedMateria, 
  setExpandedMateria,
  onEditMateria,
  onDeleteMateria,
  onDuplicateMateria,
  onCreateTema,
  onEditTema,
  onDeleteTema,
  onDuplicateTema,
  selectedMaterias,
  onToggleSelection
}: MateriasListProps) {
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
            onEdit={() => onEditMateria(materia)}
            onDelete={() => onDeleteMateria(materia)}
            onDuplicate={() => onDuplicateMateria(materia)}
            selected={selectedMaterias.has(materia.id)}
            onSelect={(checked) => onToggleSelection(materia.id)}
          />
          
          {expandedMateria === materia.id && (
            <Card className="mt-2 border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Temas de {materia.nombre}</CardTitle>
                    <CardDescription>
                      {materia.total_temas} {materia.total_temas === 1 ? 'tema' : 'temas'} configurados
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onCreateTema(materia.id)}
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Tema
                  </Button>
                </div>
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
                      onEdit={(tema) => onEditTema(tema, materia.id)}
                      onDelete={onDeleteTema}
                      onDuplicate={(tema) => onDuplicateTema(tema, materia.id)}
                    />
                  </TabsContent>

                  {[1, 2, 3, 4].map(bim => (
                    <TabsContent key={bim} value={`bim${bim}`}>
                      <TemasTable 
                        temas={materia.temas_por_bimestre[bim] || []}
                        bimestre={bim}
                        onEdit={(tema) => onEditTema(tema, materia.id)}
                        onDelete={onDeleteTema}
                        onDuplicate={(tema) => onDuplicateTema(tema, materia.id)}
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

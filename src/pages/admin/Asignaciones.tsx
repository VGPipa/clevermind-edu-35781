import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { AsignacionesStats } from "@/components/admin/AsignacionesStats";
import { AsignacionesTable } from "@/components/admin/AsignacionesTable";
import { AsignacionDialog } from "@/components/admin/AsignacionDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Search } from "lucide-react";

const AdminAsignaciones = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['asignaciones-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-asignaciones-admin');
      if (error) throw error;
      return data;
    },
  });

  const filteredAsignaciones = data?.asignaciones?.filter((a: any) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      a.profesor.nombre.toLowerCase().includes(searchLower) ||
      a.profesor.apellido.toLowerCase().includes(searchLower) ||
      a.materia.nombre.toLowerCase().includes(searchLower) ||
      a.grupo.grado.toLowerCase().includes(searchLower)
    );
  }) || [];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-96 w-full" />
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
            Error al cargar las asignaciones. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">Gestión de Asignaciones</h1>
            <p className="text-muted-foreground">
              Administra las asignaciones de profesores, materias y grupos
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Asignación
          </Button>
        </div>

        <AsignacionesStats estadisticas={data?.estadisticas} />

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por profesor, materia o grupo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <AsignacionesTable 
            asignaciones={filteredAsignaciones} 
            onRefresh={() => refetch()}
          />
        </div>

        <AsignacionDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          profesores={data.profesores || []}
          materias={data.materias || []}
          grupos={data.grupos || []}
          onSuccess={() => refetch()}
        />
      </div>
    </AppLayout>
  );
};

export default AdminAsignaciones;

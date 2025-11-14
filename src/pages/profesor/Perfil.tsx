import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PerfilHeader } from "@/components/profesor/PerfilHeader";
import { AsignacionCard } from "@/components/profesor/AsignacionCard";
import { EstadisticasDocente } from "@/components/profesor/EstadisticasDocente";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const ProfesorPerfil = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['perfil-profesor'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-perfil-profesor');
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
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
            Error al cargar el perfil. Por favor, intenta de nuevo.
          </AlertDescription>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Mi Perfil</h1>
          <p className="text-muted-foreground">
            Información personal y estadísticas de tu actividad docente
          </p>
        </div>

        <PerfilHeader profesor={data.profesor} />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Estadísticas Generales</h2>
          <EstadisticasDocente estadisticas={data.estadisticas_generales} />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Mis Asignaciones ({data.asignaciones.length})
          </h2>
          {data.asignaciones.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No tienes asignaciones actualmente. Contacta con el administrador.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {data.asignaciones.map((asignacion: any) => (
                <AsignacionCard key={asignacion.id} asignacion={asignacion} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfesorPerfil;

import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, School, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SalonCard } from "@/components/profesor/SalonCard";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProgramarSesionDialog } from "@/components/profesor/ProgramarSesionDialog";
import { useToast } from "@/hooks/use-toast";

export default function MisSalones() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filtroSalon, setFiltroSalon] = useState<string>('todos');
  const [showProgramarSesion, setShowProgramarSesion] = useState(false);
  const [temaSeleccionado, setTemaSeleccionado] = useState<{ temaId: string; grupoId: string; guiaTema?: any } | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['mis-salones'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-mis-salones');
      if (error) throw error;
      return data;
    },
  });

  const handleProgramarSesion = (temaId: string, grupoId: string) => {
    // Get guia tema for this tema
    const salon = data?.salones?.find((s: any) => s.grupo.id === grupoId);
    const temaData = salon?.temas?.find((t: any) => t.tema.id === temaId);
    
    setTemaSeleccionado({
      temaId,
      grupoId,
      guiaTema: temaData?.guia_tema,
    });
    setShowProgramarSesion(true);
  };

  const handleGestionarSesion = (sesion: any) => {
    if (sesion?.tiene_guia) {
      navigate(`/profesor/editar-guia/${sesion.id}`);
    } else {
      navigate(`/profesor/generar-clase?clase=${sesion.id}`);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-destructive">Error al cargar los salones</p>
            </div>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  const salones = data?.salones || [];
  // Asegurar que cada salón tenga la estructura completa esperada
  const salonesConEstructura = salones.map((salon: any) => ({
    ...salon,
    resumen: salon.resumen || {
      promedio_nota: null,
      comprension_promedio: null,
      participacion_promedio: null,
      completitud_promedio: null,
      alumnos_en_riesgo: 0,
      quizzes_pendientes: 0,
      promedio_quiz_pre: null,
      promedio_quiz_post: null,
    },
    alumnos: Array.isArray(salon.alumnos) ? salon.alumnos : [],
    recomendaciones: Array.isArray(salon.recomendaciones) ? salon.recomendaciones : [],
    retroalimentaciones: Array.isArray(salon.retroalimentaciones) ? salon.retroalimentaciones : [],
  }));
  
  const salonesFiltrados = filtroSalon === 'todos' 
    ? salonesConEstructura 
    : salonesConEstructura.filter((s: any) => s.grupo?.id === filtroSalon);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black dark:text-white">
              Mis Salones
            </h1>
            <p className="text-muted-foreground mt-2">
              Gestiona las sesiones programadas y ejecutadas por salón
            </p>
          </div>
        </div>

        {/* Filtros */}
        {salonesConEstructura.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full max-w-xs">
                <Label>Filtrar por Salón</Label>
                <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los salones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los salones</SelectItem>
                    {salonesConEstructura.map((salon: any) => (
                      <SelectItem key={salon.grupo?.id} value={salon.grupo?.id}>
                        {salon.grupo?.nombre} - {salon.grupo?.grado}° {salon.grupo?.seccion}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estadísticas Generales */}
        {salonesConEstructura.length > 0 && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold">{salonesConEstructura.length}</div>
                  <p className="text-sm text-muted-foreground mt-1">Salones</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {salonesConEstructura.reduce((sum: number, s: any) => sum + (s.progreso_general?.completadas || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Sesiones Completadas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {salonesConEstructura.reduce((sum: number, s: any) => sum + (s.progreso_general?.programadas || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Sesiones Programadas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">
                    {salonesConEstructura.reduce((sum: number, s: any) => sum + (s.progreso_general?.pendientes || 0), 0)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Sesiones Pendientes</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Salones */}
        {salonesFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <School className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {filtroSalon !== 'todos' 
                  ? 'No hay temas con sesiones en este salón'
                  : 'No hay temas con sesiones creadas aún'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Los temas aparecerán aquí una vez que tengas una guía maestra y hayas programado al menos una sesión
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {salonesFiltrados.map((salon: any) => (
              <SalonCard
                key={salon.grupo.id}
                salon={salon}
                onProgramarSesion={handleProgramarSesion}
                onVerSesion={handleGestionarSesion}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog Programar Sesión */}
      {temaSeleccionado && (
        <ProgramarSesionDialog
          open={showProgramarSesion}
          onOpenChange={(open) => {
            setShowProgramarSesion(open);
            if (!open) setTemaSeleccionado(null);
          }}
          temaId={temaSeleccionado.temaId}
          guiaTema={temaSeleccionado.guiaTema}
          gruposDisponibles={[{ id: temaSeleccionado.grupoId }]}
          onSuccess={() => {
            refetch();
            toast({
              title: "Sesión programada",
              description: "La sesión se ha programado exitosamente",
            });
          }}
        />
      )}
    </AppLayout>
  );
}


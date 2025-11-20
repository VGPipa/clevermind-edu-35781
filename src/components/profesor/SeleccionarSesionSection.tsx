import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, BookOpen, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SeleccionarSesionSectionProps {
  onSeleccionarSesion: (sesionId: string) => void;
  onCrearExtraordinaria: () => void;
  onIrAPlanificacion: () => void;
}

export function SeleccionarSesionSection({
  onSeleccionarSesion,
  onCrearExtraordinaria,
  onIrAPlanificacion,
}: SeleccionarSesionSectionProps) {
  const { toast } = useToast();
  const [filtroTema, setFiltroTema] = useState<string>("todos");
  const [filtroSalon, setFiltroSalon] = useState<string>("todos");

  const { data: sesionesData, isLoading } = useQuery({
    queryKey: ["sesiones-pendientes"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-sesiones-pendientes");
      if (error) {
        console.error("Error cargando sesiones pendientes:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las sesiones pendientes.",
          variant: "destructive",
        });
        throw error;
      }
      return data as any;
    },
  });

  const sesiones = sesionesData?.sesiones || [];
  const siguienteSesion = sesionesData?.siguiente_sesion;

  // Lista filtrada, excluyendo la siguiente sesión sugerida para evitar duplicados
  const sesionesFiltradas =
    sesiones?.filter((sesion: any) => {
      if (siguienteSesion && sesion.id === siguienteSesion.id) {
        return false;
      }
      if (filtroTema !== "todos" && sesion.tema?.id !== filtroTema) return false;
      if (filtroSalon !== "todos" && sesion.grupo?.id !== filtroSalon) return false;
      return true;
    }) || [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Seleccionar Sesión para Generar Clase
        </h1>
        <p className="text-sm text-muted-foreground">
          Elige una sesión programada o crea una clase extraordinaria.
        </p>
      </div>

      {sesiones && sesiones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Filtrar por Tema</Label>
            <Select value={filtroTema} onValueChange={setFiltroTema}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los temas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los temas</SelectItem>
                {sesiones
                  .filter(
                    (s: any, index: number, self: any[]) =>
                      index === self.findIndex((t: any) => t.tema?.id === s.tema?.id)
                  )
                  .map((sesion: any) => (
                    <SelectItem key={sesion.tema?.id} value={sesion.tema?.id}>
                      {sesion.tema?.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Filtrar por Salón</Label>
            <Select value={filtroSalon} onValueChange={setFiltroSalon}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los salones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los salones</SelectItem>
                {sesiones
                  .filter(
                    (s: any, index: number, self: any[]) =>
                      index === self.findIndex((t: any) => t.grupo?.id === s.grupo?.id)
                  )
                  .map((sesion: any) => (
                    <SelectItem key={sesion.grupo?.id} value={sesion.grupo?.id}>
                      {sesion.grupo?.nombre} - {sesion.grupo?.grado}° {sesion.grupo?.seccion}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {siguienteSesion && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Siguiente Sesión Sugerida</p>
              <p className="text-sm text-muted-foreground mt-1">
                {siguienteSesion.tema?.nombre} - Sesión {siguienteSesion.numero_sesion}
              </p>
              {siguienteSesion.fecha_programada && (
                <p className="text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {new Date(siguienteSesion.fecha_programada).toLocaleDateString("es-ES")}
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => onSeleccionarSesion(siguienteSesion.id)}>
              Usar Esta
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : sesionesFiltradas.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sesionesFiltradas.map((sesion: any) => (
            <div
              key={sesion.id}
              className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
              onClick={() => onSeleccionarSesion(sesion.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Sesión {sesion.numero_sesion}</Badge>
                    <span className="font-medium">{sesion.tema?.nombre}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {sesion.grupo?.nombre} - {sesion.grupo?.grado}° {sesion.grupo?.seccion}
                  </p>
                  {sesion.fecha_programada && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(sesion.fecha_programada).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="ghost">
                  Seleccionar
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay sesiones pendientes disponibles</p>
          <p className="text-sm mt-2">
            Puedes crear una clase extraordinaria o ir a Planificación para crear una guía maestra.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 pt-4 border-t">
        <Button variant="outline" onClick={onCrearExtraordinaria} className="w-full">
          <Sparkles className="h-4 w-4 mr-2" />
          Crear Clase Extraordinaria
        </Button>
        <Button variant="ghost" onClick={onIrAPlanificacion} className="w-full">
          <BookOpen className="h-4 w-4 mr-2" />
          Ir a Planificación para Crear Guía Maestra
        </Button>
      </div>
    </div>
  );
}



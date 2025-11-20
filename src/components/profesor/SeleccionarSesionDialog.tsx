import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Calendar, BookOpen, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SeleccionarSesionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SeleccionarSesionDialog({ open, onOpenChange }: SeleccionarSesionDialogProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filtroTema, setFiltroTema] = useState<string>("todos");
  const [filtroSalon, setFiltroSalon] = useState<string>("todos");
  const [sesionSeleccionada, setSesionSeleccionada] = useState<string | null>(null);
  const [modoExtraordinaria, setModoExtraordinaria] = useState(false);

  const { data: sesionesData, isLoading } = useQuery({
    queryKey: ['sesiones-pendientes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-sesiones-pendientes');
      if (error) throw error;
      return data;
    },
    enabled: open && !modoExtraordinaria,
  });

  // Get unique temas and salones for filters
  const temasUnicos = Array.from(
    new Set(sesionesData?.sesiones?.map((s: any) => s.tema?.id).filter(Boolean) || [])
  );
  const salonesUnicos = Array.from(
    new Set(sesionesData?.sesiones?.map((s: any) => s.grupo?.id).filter(Boolean) || [])
  );

  // Filter sesiones
  const sesionesFiltradas = sesionesData?.sesiones?.filter((sesion: any) => {
    if (filtroTema !== "todos" && sesion.tema?.id !== filtroTema) return false;
    if (filtroSalon !== "todos" && sesion.grupo?.id !== filtroSalon) return false;
    return true;
  }) || [];

  const siguienteSesion = sesionesData?.siguiente_sesion;

  const handleSeleccionarSesion = (sesionId: string) => {
    navigate(`/profesor/generar-clase?clase=${sesionId}`);
    onOpenChange(false);
  };

  const handleCrearExtraordinaria = () => {
    navigate('/profesor/generar-clase?extraordinaria=true');
    onOpenChange(false);
  };

  const handleIrAPlanificacion = () => {
    navigate('/profesor/planificacion');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Seleccionar Sesión para Generar Clase
          </DialogTitle>
          <DialogDescription>
            Elige una sesión programada o crea una clase extraordinaria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!modoExtraordinaria ? (
            <>
              {/* Filtros */}
              {sesionesData?.sesiones && sesionesData.sesiones.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filtrar por Tema</Label>
                    <Select value={filtroTema} onValueChange={setFiltroTema}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos los temas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos los temas</SelectItem>
                        {sesionesData.sesiones
                          .filter((s: any, index: number, self: any[]) => 
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
                        {sesionesData.sesiones
                          .filter((s: any, index: number, self: any[]) => 
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

              {/* Siguiente Sesión Sugerida */}
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
                          {new Date(siguienteSesion.fecha_programada).toLocaleDateString('es-ES')}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleSeleccionarSesion(siguienteSesion.id)}
                    >
                      Usar Esta
                    </Button>
                  </div>
                </div>
              )}

              {/* Lista de Sesiones */}
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
                      onClick={() => handleSeleccionarSesion(sesion.id)}
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
                              {new Date(sesion.fecha_programada).toLocaleDateString('es-ES')}
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
                    Puedes crear una clase extraordinaria o ir a Planificación para crear una guía maestra
                  </p>
                </div>
              )}

              {/* Opciones Adicionales */}
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCrearExtraordinaria}
                  className="w-full"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Crear Clase Extraordinaria
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleIrAPlanificacion}
                  className="w-full"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Ir a Planificación para Crear Guía Maestra
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Modo extraordinaria seleccionado
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


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

  // Set siguiente sesión as default
  useEffect(() => {
    if (sesionesData?.siguiente_sesion && !sesionSeleccionada) {
      setSesionSeleccionada(sesionesData.siguiente_sesion.id);
    }
  }, [sesionesData, sesionSeleccionada]);

  const handleSeleccionarSesion = () => {
    if (!sesionSeleccionada) {
      toast({
        title: "Error",
        description: "Debes seleccionar una sesión",
        variant: "destructive",
      });
      return;
    }

    navigate(`/profesor/generar-clase?clase=${sesionSeleccionada}`);
    onOpenChange(false);
  };

  const handleClaseExtraordinaria = () => {
    navigate('/profesor/generar-clase?extraordinaria=true');
    onOpenChange(false);
  };

  const sesionActual = sesionesFiltradas.find((s: any) => s.id === sesionSeleccionada);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Sesión o Crear Clase</DialogTitle>
          <DialogDescription>
            Elige una sesión precreada para continuar, o crea una clase extraordinaria
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Opción: Clase Extraordinaria */}
          <div className="border rounded-lg p-4 bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Clase Extraordinaria</h3>
                  <p className="text-sm text-muted-foreground">
                    Crear una clase sin tema asociado
                  </p>
                </div>
              </div>
              <Button onClick={handleClaseExtraordinaria} variant="outline">
                Crear Clase Extraordinaria
              </Button>
            </div>
          </div>

          {/* Separador */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O selecciona una sesión precreada
              </span>
            </div>
          </div>

          {/* Filtros */}
          {!modoExtraordinaria && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Filtrar por Tema</Label>
                  <Select value={filtroTema} onValueChange={setFiltroTema}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los temas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los temas</SelectItem>
                      {sesionesData?.sesiones
                        ?.filter((s: any, index: number, self: any[]) => 
                          self.findIndex((t: any) => t.tema?.id === s.tema?.id) === index
                        )
                        .map((sesion: any) => (
                          <SelectItem key={sesion.tema?.id} value={sesion.tema?.id}>
                            {sesion.tema?.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Filtrar por Salón</Label>
                  <Select value={filtroSalon} onValueChange={setFiltroSalon}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los salones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos los salones</SelectItem>
                      {sesionesData?.sesiones
                        ?.filter((s: any, index: number, self: any[]) => 
                          self.findIndex((t: any) => t.grupo?.id === s.grupo?.id) === index
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

              {/* Lista de Sesiones */}
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : sesionesFiltradas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No hay sesiones pendientes disponibles</p>
                  <p className="text-sm mt-1">
                    Crea una clase extraordinaria o programa sesiones desde Planificación
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {sesionesFiltradas.map((sesion: any) => {
                    const isSelected = sesionSeleccionada === sesion.id;
                    const isSiguiente = sesion.id === sesionesData?.siguiente_sesion?.id;

                    return (
                      <div
                        key={sesion.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'hover:border-primary/50 hover:bg-accent/50'
                        }`}
                        onClick={() => setSesionSeleccionada(sesion.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">
                                Sesión {sesion.numero_sesion}
                              </span>
                              {isSiguiente && (
                                <Badge className="bg-green-500 text-white text-xs">
                                  Siguiente
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">{sesion.tema?.nombre}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                <span>{sesion.tema?.materia?.nombre}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {sesion.grupo?.nombre} - {sesion.grupo?.grado}° {sesion.grupo?.seccion}
                                </span>
                              </div>
                              {sesion.fecha_programada && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(sesion.fecha_programada).toLocaleDateString('es-ES')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <input
                              type="radio"
                              checked={isSelected}
                              onChange={() => setSesionSeleccionada(sesion.id)}
                              className="h-4 w-4"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Botón Continuar */}
              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSeleccionarSesion}
                  disabled={!sesionSeleccionada || isLoading}
                >
                  Continuar con Sesión Seleccionada
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}


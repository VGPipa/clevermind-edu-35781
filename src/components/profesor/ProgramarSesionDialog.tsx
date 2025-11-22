import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Calendar, Clock } from "lucide-react";

interface ProgramarSesionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  temaId: string;
  guiaTema?: {
    id: string;
    total_sesiones: number;
    estructura_sesiones?: Array<{
      numero: number;
      titulo_preliminar?: string;
      contexto_preliminar?: string;
      duracion_sugerida?: number;
      // Mantener compatibilidad con formato antiguo
      titulo?: string;
      contenido_clave?: string;
    }>;
  };
  gruposDisponibles?: Array<{ id: string; nombre?: string; grado?: string; seccion?: string }>;
  onSuccess?: () => void;
}

export function ProgramarSesionDialog({
  open,
  onOpenChange,
  temaId,
  guiaTema,
  gruposDisponibles = [],
  onSuccess
}: ProgramarSesionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState<Array<{ id: string; nombre: string; grado: string; seccion: string }>>([]);
  const [sesionesPendientes, setSesionesPendientes] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    id_grupo: "",
    numero_sesion: 1,
    fecha_programada: new Date().toISOString().split('T')[0],
    duracion_minutos: 90,
    contexto_especifico: "",
  });

  // Cargar grupos disponibles
  useEffect(() => {
    if (open && gruposDisponibles.length > 0) {
      setGrupos(gruposDisponibles.map(g => ({
        id: g.id,
        nombre: g.nombre || 'Sin nombre',
        grado: g.grado || '',
        seccion: g.seccion || '',
      })));
      if (gruposDisponibles.length === 1) {
        setFormData(prev => ({ ...prev, id_grupo: gruposDisponibles[0].id }));
      }
    } else if (open && gruposDisponibles.length === 0) {
      // Si no hay grupos disponibles, intentar cargarlos
      loadGrupos();
    }
  }, [open, gruposDisponibles]);

  // Cargar sesiones ya programadas para calcular la siguiente disponible
  useEffect(() => {
    if (open && temaId && formData.id_grupo) {
      loadSesionesProgramadas();
    }
  }, [open, temaId, formData.id_grupo]);

  const loadGrupos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profesor } = await supabase
        .from('profesores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profesor) return;

      // Obtener tema para saber la materia
      const { data: tema } = await supabase
        .from('temas')
        .select('id_materia')
        .eq('id', temaId)
        .single();

      if (!tema) return;

      // Obtener asignaciones
      const { data: asignaciones } = await supabase
        .from('asignaciones_profesor')
        .select(`
          id_grupo,
          grupos (
            id,
            nombre,
            grado,
            seccion
          )
        `)
        .eq('id_profesor', profesor.id)
        .eq('id_materia', tema.id_materia);

      if (asignaciones) {
        const gruposData = asignaciones
          .map(a => a.grupos)
          .filter(Boolean)
          .map((g: any) => ({
            id: g.id,
            nombre: g.nombre,
            grado: g.grado,
            seccion: g.seccion,
          }));
        setGrupos(gruposData);
        if (gruposData.length === 1) {
          setFormData(prev => ({ ...prev, id_grupo: gruposData[0].id }));
        }
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
    }
  };

  const loadSesionesProgramadas = async (): Promise<number[]> => {
    try {
      const { data: clases } = await supabase
        .from('clases')
        .select('numero_sesion')
        .eq('id_tema', temaId)
        .eq('id_grupo', formData.id_grupo)
        .not('numero_sesion', 'is', null);

      const sesionesProgramadas = (clases || []).map(c => c.numero_sesion).filter(Boolean) as number[];
      const sesionesPendientesCalculadas = Array.from({ length: guiaTema?.total_sesiones || 0 }, (_, i) => i + 1)
        .filter(n => !sesionesProgramadas.includes(n));
      
      setSesionesPendientes(sesionesPendientesCalculadas);

      // Si hay sesiones pendientes, seleccionar la primera
      if (sesionesPendientesCalculadas.length > 0 && sesionesPendientesCalculadas[0] !== formData.numero_sesion) {
        setFormData(prev => ({ ...prev, numero_sesion: sesionesPendientesCalculadas[0] }));
      }

      return sesionesPendientesCalculadas;
    } catch (error) {
      console.error('Error cargando sesiones programadas:', error);
      return [];
    }
  };

  const [programarOtra, setProgramarOtra] = useState(false);

  const handleSubmit = async () => {
    if (!formData.id_grupo) {
      toast({
        title: "Error",
        description: "Debes seleccionar un grupo",
        variant: "destructive"
      });
      return;
    }

    if (!formData.fecha_programada) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha",
        variant: "destructive"
      });
      return;
    }

    if (!formData.numero_sesion || formData.numero_sesion < 1) {
      toast({
        title: "Error",
        description: "El número de sesión debe ser válido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('programar-sesion', {
        body: {
          id_tema: temaId,
          id_grupo: formData.id_grupo,
          numero_sesion: formData.numero_sesion,
          fecha_programada: formData.fecha_programada,
          duracion_minutos: formData.duracion_minutos,
          contexto_especifico: formData.contexto_especifico || null,
        }
      });

      if (error) throw error;

      toast({
        title: "Sesión programada",
        description: `La sesión ${formData.numero_sesion} se ha programado exitosamente`,
      });

      // Si el usuario quiere programar otra sesión, resetear el formulario pero mantener el grupo
      if (programarOtra) {
        // Recargar sesiones programadas y obtener el valor calculado directamente
        const sesionesPendientesActualizadas = await loadSesionesProgramadas();
        
        // Resetear formulario pero mantener grupo y actualizar número de sesión
        const grupoActual = formData.id_grupo;
        setFormData({
          id_grupo: grupoActual,
          numero_sesion: sesionesPendientesActualizadas.length > 0 ? sesionesPendientesActualizadas[0] : 1,
          fecha_programada: new Date().toISOString().split('T')[0],
          duracion_minutos: 90,
          contexto_especifico: "",
        });
      } else {
        onOpenChange(false);
        onSuccess?.();
      }
    } catch (error: any) {
      console.error('Error programando sesión:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo programar la sesión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const sesionSeleccionada = guiaTema?.estructura_sesiones?.find(
    s => s.numero === formData.numero_sesion
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Programar Sesión
          </DialogTitle>
          <DialogDescription>
            Programa una sesión específica para este tema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo</Label>
            <Select
              value={formData.id_grupo}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, id_grupo: value }));
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre} - {grupo.grado}° {grupo.seccion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {guiaTema && (
            <div className="space-y-2">
              <Label htmlFor="numero_sesion">Número de Sesión</Label>
              <Select
                value={formData.numero_sesion.toString()}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, numero_sesion: parseInt(value) }));
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona la sesión" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: guiaTema.total_sesiones }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      Sesión {num}
                      {sesionesPendientes.includes(num) && (
                        <span className="ml-2 text-xs text-muted-foreground">(Pendiente)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sesionSeleccionada && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p className="font-medium">
                    {sesionSeleccionada.titulo_preliminar || sesionSeleccionada.titulo || 'Sin título'}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {sesionSeleccionada.contexto_preliminar || sesionSeleccionada.contenido_clave || 'Sin contexto'}
                  </p>
                  {sesionSeleccionada.duracion_sugerida && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Duración sugerida: {sesionSeleccionada.duracion_sugerida} minutos
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha Programada</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha_programada}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_programada: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duracion">Duración (minutos)</Label>
              <Input
                id="duracion"
                type="number"
                min="30"
                step="15"
                value={formData.duracion_minutos}
                onChange={(e) => setFormData(prev => ({ ...prev, duracion_minutos: parseInt(e.target.value) || 90 }))}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contexto">Contexto Específico (Opcional)</Label>
            <Textarea
              id="contexto"
              placeholder="Contexto adicional para esta sesión específica..."
              value={formData.contexto_especifico}
              onChange={(e) => setFormData(prev => ({ ...prev, contexto_especifico: e.target.value }))}
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="programar-otra"
                checked={programarOtra}
                onCheckedChange={(checked) => setProgramarOtra(checked as boolean)}
                disabled={loading}
              />
              <label
                htmlFor="programar-otra"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Programar otra sesión después de esta
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Programando...' : 'Programar Sesión'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


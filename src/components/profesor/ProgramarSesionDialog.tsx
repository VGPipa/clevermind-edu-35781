import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface ProgramarSesionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  temaId: string;
  guiaTema?: {
    id: string;
    total_sesiones: number;
    estructura_sesiones?: Array<{
      numero: number;
      titulo: string;
      contenido_clave: string;
      duracion_sugerida?: number;
    }>;
  };
  gruposDisponibles?: Array<{
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
  }>;
  sesionPreseleccionada?: number;
  onSuccess?: () => void;
}

export function ProgramarSesionDialog({
  open,
  onOpenChange,
  temaId,
  guiaTema,
  gruposDisponibles = [],
  sesionPreseleccionada,
  onSuccess,
}: ProgramarSesionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [grupos, setGrupos] = useState(gruposDisponibles);
  const [sesionesPendientes, setSesionesPendientes] = useState<Array<{
    numero: number;
    titulo: string;
    contenido_clave: string;
    duracion_sugerida?: number;
  }>>([]);

  const [formData, setFormData] = useState({
    id_grupo: '',
    numero_sesion: sesionPreseleccionada || 1,
    fecha_programada: '',
    duracion_minutos: 120,
    contexto_especifico: '',
  });

  // Load grupos if not provided
  useEffect(() => {
    if (open && grupos.length === 0) {
      loadGrupos();
    }
  }, [open]);

  // Load sesiones pendientes when grupo and tema are selected
  useEffect(() => {
    if (open && formData.id_grupo && temaId && guiaTema) {
      loadSesionesPendientes();
    }
  }, [open, formData.id_grupo, temaId, guiaTema]);

  // Set preseleccionada when sesiones are loaded
  useEffect(() => {
    if (sesionesPendientes.length > 0 && sesionPreseleccionada) {
      const existe = sesionesPendientes.find(s => s.numero === sesionPreseleccionada);
      if (existe) {
        setFormData(prev => ({ ...prev, numero_sesion: sesionPreseleccionada }));
      } else if (sesionesPendientes.length > 0) {
        setFormData(prev => ({ ...prev, numero_sesion: sesionesPendientes[0].numero }));
      }
    } else if (sesionesPendientes.length > 0 && !formData.numero_sesion) {
      setFormData(prev => ({ ...prev, numero_sesion: sesionesPendientes[0].numero }));
    }
  }, [sesionesPendientes, sesionPreseleccionada]);

  const loadGrupos = async () => {
    setLoadingGrupos(true);
    try {
      // Get grupos from asignaciones
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
        `);

      if (asignaciones) {
        const gruposUnicos = new Map();
        asignaciones.forEach((a: any) => {
          if (a.grupos && !gruposUnicos.has(a.id_grupo)) {
            gruposUnicos.set(a.id_grupo, a.grupos);
          }
        });
        setGrupos(Array.from(gruposUnicos.values()));
      }
    } catch (error) {
      console.error('Error loading grupos:', error);
    } finally {
      setLoadingGrupos(false);
    }
  };

  const loadSesionesPendientes = async () => {
    if (!guiaTema || !formData.id_grupo) return;

    try {
      // Get existing sesiones for this tema and grupo
      const { data: clasesExistentes } = await supabase
        .from('clases')
        .select('numero_sesion')
        .eq('id_tema', temaId)
        .eq('id_grupo', formData.id_grupo);

      const numerosExistentes = new Set(clasesExistentes?.map(c => c.numero_sesion) || []);

      // Get available sesiones from estructura_sesiones
      if (guiaTema.estructura_sesiones && Array.isArray(guiaTema.estructura_sesiones)) {
        const disponibles = guiaTema.estructura_sesiones
          .filter((s: any) => !numerosExistentes.has(s.numero))
          .sort((a: any, b: any) => a.numero - b.numero);
        setSesionesPendientes(disponibles);
      } else {
        // Fallback: generate list from total_sesiones
        const disponibles = Array.from({ length: guiaTema.total_sesiones }, (_, i) => i + 1)
          .filter(n => !numerosExistentes.has(n))
          .map(n => ({
            numero: n,
            titulo: `Sesión ${n}`,
            contenido_clave: '',
          }));
        setSesionesPendientes(disponibles);
      }
    } catch (error) {
      console.error('Error loading sesiones pendientes:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.id_grupo) {
      toast({
        title: "Error",
        description: "Debes seleccionar un salón",
        variant: "destructive",
      });
      return;
    }

    if (!formData.fecha_programada) {
      toast({
        title: "Error",
        description: "Debes seleccionar una fecha",
        variant: "destructive",
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
        },
      });

      if (error) throw error;

      toast({
        title: "¡Sesión programada!",
        description: data.mensaje || "La sesión se ha programado exitosamente",
      });

      onSuccess?.();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        id_grupo: '',
        numero_sesion: 1,
        fecha_programada: '',
        duracion_minutos: 120,
        contexto_especifico: '',
      });
    } catch (error: any) {
      console.error('Error programando sesión:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo programar la sesión",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sesionSeleccionada = sesionesPendientes.find(s => s.numero === formData.numero_sesion);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Programar Sesión {guiaTema ? `(${formData.numero_sesion}/${guiaTema.total_sesiones})` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selector de Salón */}
          <div>
            <Label>Salón *</Label>
            {loadingGrupos ? (
              <div className="flex items-center gap-2 mt-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Cargando salones...</span>
              </div>
            ) : (
              <Select
                value={formData.id_grupo}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, id_grupo: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un salón" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nombre} - {grupo.grado}° {grupo.seccion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selector de Sesión (si hay sesiones pendientes) */}
          {formData.id_grupo && sesionesPendientes.length > 0 && (
            <div>
              <Label>Sesión a Programar *</Label>
              <Select
                value={formData.numero_sesion.toString()}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, numero_sesion: parseInt(value) }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sesionesPendientes.map((sesion) => (
                    <SelectItem key={sesion.numero} value={sesion.numero.toString()}>
                      Sesión {sesion.numero}: {sesion.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sesionSeleccionada && sesionSeleccionada.contenido_clave && (
                <p className="text-xs text-muted-foreground mt-1">
                  {sesionSeleccionada.contenido_clave}
                </p>
              )}
            </div>
          )}

          {/* Si no hay sesiones pendientes pero hay guía, permitir ingresar número manualmente */}
          {formData.id_grupo && sesionesPendientes.length === 0 && guiaTema && (
            <div>
              <Label>Número de Sesión *</Label>
              <Input
                type="number"
                min="1"
                max={guiaTema.total_sesiones}
                value={formData.numero_sesion}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_sesion: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Máximo: {guiaTema.total_sesiones} sesiones
              </p>
            </div>
          )}

          {/* Fecha Programada */}
          <div>
            <Label>Fecha Programada *</Label>
            <Input
              type="date"
              value={formData.fecha_programada}
              onChange={(e) => setFormData(prev => ({ ...prev, fecha_programada: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Duración */}
          <div>
            <Label>Duración (minutos) *</Label>
            <Input
              type="number"
              min="30"
              max="240"
              value={formData.duracion_minutos}
              onChange={(e) => setFormData(prev => ({ ...prev, duracion_minutos: parseInt(e.target.value) || 120 }))}
            />
            {sesionSeleccionada && sesionSeleccionada.duracion_sugerida && (
              <p className="text-xs text-muted-foreground mt-1">
                Duración sugerida: {sesionSeleccionada.duracion_sugerida} minutos
              </p>
            )}
          </div>

          {/* Contexto Específico */}
          <div>
            <Label>Contexto Específico (opcional)</Label>
            <Textarea
              value={formData.contexto_especifico}
              onChange={(e) => setFormData(prev => ({ ...prev, contexto_especifico: e.target.value }))}
              placeholder="Ajustes o consideraciones especiales para esta sesión..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Programar Sesión
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


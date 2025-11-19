import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BookOpen, Plus, X, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EditarGuiaTemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guiaTema: {
    id: string;
    id_tema: string;
    objetivos_generales: string;
    estructura_sesiones: Array<{
      numero: number;
      titulo: string;
      contenido_clave: string;
      duracion_sugerida?: number;
    }>;
    contenido: {
      recursos?: string[];
      estrategias_evaluacion?: string[];
      actividades_transversales?: string[];
      competencias?: string[];
    };
    metodologias: string[];
    contexto_grupo: string;
    total_sesiones: number;
  };
  temaNombre: string;
}

const METODOLOGIAS = [
  "Aprendizaje Basado en Proyectos",
  "Aprendizaje Cooperativo",
  "Clase Invertida (Flipped Classroom)",
  "Gamificación",
  "Aprendizaje por Descubrimiento",
  "Pensamiento Crítico y Debate",
  "Uso de TIC y Herramientas Digitales"
];

export function EditarGuiaTemaDialog({ open, onOpenChange, guiaTema, temaNombre }: EditarGuiaTemaDialogProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  const [objetivosGenerales, setObjetivosGenerales] = useState("");
  const [estructuraSesiones, setEstructuraSesiones] = useState<Array<{
    numero: number;
    titulo: string;
    contenido_clave: string;
    duracion_sugerida: number;
  }>>([]);
  const [recursos, setRecursos] = useState<string[]>([]);
  const [estrategiasEvaluacion, setEstrategiasEvaluacion] = useState<string[]>([]);
  const [actividadesTransversales, setActividadesTransversales] = useState<string[]>([]);
  const [metodologias, setMetodologias] = useState<string[]>([]);
  const [contextoGrupo, setContextoGrupo] = useState("");

  // Inicializar datos cuando se abre el diálogo
  useEffect(() => {
    if (open && guiaTema) {
      setObjetivosGenerales(guiaTema.objetivos_generales || "");
      setEstructuraSesiones((guiaTema.estructura_sesiones || []).map(s => ({
        ...s,
        duracion_sugerida: s.duracion_sugerida || 45
      })));
      setRecursos(guiaTema.contenido?.recursos || []);
      setEstrategiasEvaluacion(guiaTema.contenido?.estrategias_evaluacion || []);
      setActividadesTransversales(guiaTema.contenido?.actividades_transversales || []);
      setMetodologias(guiaTema.metodologias || []);
      setContextoGrupo(guiaTema.contexto_grupo || "");
    }
  }, [open, guiaTema]);

  const handleSave = async () => {
    setLoading(true);

    try {
      const contenidoActualizado = {
        ...guiaTema.contenido,
        recursos: recursos,
        estrategias_evaluacion: estrategiasEvaluacion,
        actividades_transversales: actividadesTransversales,
      };

      const { data, error } = await supabase.functions.invoke('actualizar-guia-tema', {
        body: {
          id_guia_tema: guiaTema.id,
          objetivos_generales: objetivosGenerales,
          estructura_sesiones: estructuraSesiones,
          contenido: contenidoActualizado,
          metodologias: metodologias,
          contexto_grupo: contextoGrupo
        }
      });

      if (error) throw error;

      toast({
        title: "¡Guía maestra actualizada!",
        description: "Los cambios se han guardado exitosamente.",
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error actualizando guía:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la guía maestra",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToMisTemas = () => {
    onOpenChange(false);
    navigate('/profesor/mis-temas');
  };

  const addRecurso = () => {
    setRecursos([...recursos, ""]);
  };

  const removeRecurso = (index: number) => {
    setRecursos(recursos.filter((_, i) => i !== index));
  };

  const updateRecurso = (index: number, value: string) => {
    const newRecursos = [...recursos];
    newRecursos[index] = value;
    setRecursos(newRecursos);
  };

  const addEstrategia = () => {
    setEstrategiasEvaluacion([...estrategiasEvaluacion, ""]);
  };

  const removeEstrategia = (index: number) => {
    setEstrategiasEvaluacion(estrategiasEvaluacion.filter((_, i) => i !== index));
  };

  const updateEstrategia = (index: number, value: string) => {
    const newEstrategias = [...estrategiasEvaluacion];
    newEstrategias[index] = value;
    setEstrategiasEvaluacion(newEstrategias);
  };

  const addActividad = () => {
    setActividadesTransversales([...actividadesTransversales, ""]);
  };

  const removeActividad = (index: number) => {
    setActividadesTransversales(actividadesTransversales.filter((_, i) => i !== index));
  };

  const updateActividad = (index: number, value: string) => {
    const newActividades = [...actividadesTransversales];
    newActividades[index] = value;
    setActividadesTransversales(newActividades);
  };

  const updateSesion = (index: number, field: string, value: any) => {
    const newSesiones = [...estructuraSesiones];
    newSesiones[index] = { ...newSesiones[index], [field]: value };
    setEstructuraSesiones(newSesiones);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Editar Guía Maestra: {temaNombre}
          </DialogTitle>
          <DialogDescription>
            Revisa y edita la guía maestra generada
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Objetivos Generales */}
          <div className="space-y-2">
            <Label htmlFor="objetivos">Objetivos Generales</Label>
            <Textarea
              id="objetivos"
              value={objetivosGenerales}
              onChange={(e) => setObjetivosGenerales(e.target.value)}
              disabled={loading}
              rows={4}
            />
          </div>

          {/* Estructura de Sesiones */}
          <div className="space-y-2">
            <Label>Estructura de Sesiones ({estructuraSesiones.length} sesiones)</Label>
            <div className="space-y-3 border rounded-lg p-4">
              {estructuraSesiones.map((sesion, index) => (
                <div key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">Sesión {sesion.numero}</span>
                  </div>
                  <div className="space-y-2">
                    <Input
                      placeholder="Título de la sesión"
                      value={sesion.titulo}
                      onChange={(e) => updateSesion(index, 'titulo', e.target.value)}
                      disabled={loading}
                    />
                    <Textarea
                      placeholder="Contenido clave"
                      value={sesion.contenido_clave}
                      onChange={(e) => updateSesion(index, 'contenido_clave', e.target.value)}
                      disabled={loading}
                      rows={2}
                    />
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Duración sugerida (min):</Label>
                      <Input
                        type="number"
                        value={sesion.duracion_sugerida || 90}
                        onChange={(e) => updateSesion(index, 'duracion_sugerida', parseInt(e.target.value))}
                        disabled={loading}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recursos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Recursos Recomendados</Label>
              <Button type="button" variant="outline" size="sm" onClick={addRecurso} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {recursos.map((recurso, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={recurso}
                    onChange={(e) => updateRecurso(index, e.target.value)}
                    disabled={loading}
                    placeholder="Recurso recomendado"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecurso(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Estrategias de Evaluación */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Estrategias de Evaluación</Label>
              <Button type="button" variant="outline" size="sm" onClick={addEstrategia} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {estrategiasEvaluacion.map((estrategia, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={estrategia}
                    onChange={(e) => updateEstrategia(index, e.target.value)}
                    disabled={loading}
                    placeholder="Estrategia de evaluación"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeEstrategia(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Actividades Transversales */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Actividades Transversales</Label>
              <Button type="button" variant="outline" size="sm" onClick={addActividad} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar
              </Button>
            </div>
            <div className="space-y-2">
              {actividadesTransversales.map((actividad, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={actividad}
                    onChange={(e) => updateActividad(index, e.target.value)}
                    disabled={loading}
                    placeholder="Actividad transversal"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeActividad(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Metodologías */}
          <div className="space-y-2">
            <Label>Metodologías Preferidas</Label>
            <div className="space-y-2">
              {METODOLOGIAS.map((metodologia) => (
                <div key={metodologia} className="flex items-center space-x-2">
                  <Checkbox
                    id={metodologia}
                    checked={metodologias.includes(metodologia)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setMetodologias([...metodologias, metodologia]);
                      } else {
                        setMetodologias(metodologias.filter(m => m !== metodologia));
                      }
                    }}
                    disabled={loading}
                  />
                  <label
                    htmlFor={metodologia}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {metodologia}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Contexto del Grupo */}
          <div className="space-y-2">
            <Label htmlFor="contexto">Contexto del Grupo</Label>
            <Textarea
              id="contexto"
              value={contextoGrupo}
              onChange={(e) => setContextoGrupo(e.target.value)}
              disabled={loading}
              rows={4}
              placeholder="Describe las características del grupo..."
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={handleGoToMisTemas}
              disabled={loading}
            >
              Ir a Mis Temas
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


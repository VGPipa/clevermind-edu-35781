import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle } from "lucide-react";
import { validateAsignacion, getCurrentAnioEscolar } from "@/lib/asignacionValidations";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Asignacion {
  id: string;
  anio_escolar: string;
  profesor: {
    id: string;
    nombre: string;
    apellido: string;
  };
  materia: {
    id: string;
    nombre: string;
  };
  grupo: {
    id: string;
    nombre: string;
    grado: string;
  };
}

interface EditAsignacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asignacion: Asignacion | null;
  profesores: any[];
  materias: any[];
  grupos: any[];
  onSuccess: () => void;
}

export const EditAsignacionDialog = ({
  open,
  onOpenChange,
  asignacion,
  profesores,
  materias,
  grupos,
  onSuccess,
}: EditAsignacionDialogProps) => {
  const [profesorId, setProfesorId] = useState<string>("");
  const [materiaId, setMateriaId] = useState<string>("");
  const [grupoId, setGrupoId] = useState<string>("");
  const [anioEscolar, setAnioEscolar] = useState<string>(getCurrentAnioEscolar());
  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const { toast } = useToast();

  // Poblar campos cuando se abre el diálogo
  useEffect(() => {
    if (asignacion && open) {
      setProfesorId(asignacion.profesor.id);
      setMateriaId(asignacion.materia.id);
      setGrupoId(asignacion.grupo.id);
      setAnioEscolar(asignacion.anio_escolar);
      setWarnings([]);
    }
  }, [asignacion, open]);

  // Filtrar materias por grado seleccionado
  const grupoSeleccionado = grupos.find(g => g.id === grupoId);
  const materiasFiltradas = materias.filter(m => {
    if (!grupoSeleccionado) return true;
    const planAnual = m.plan_anual as { grado: string } | null;
    return planAnual?.grado === grupoSeleccionado.grado;
  });

  // Filtrar grupos por grado de materia seleccionada
  const materiaSeleccionada = materias.find(m => m.id === materiaId);
  const gruposFiltrados = grupos.filter(g => {
    if (!materiaSeleccionada) return true;
    const planAnual = materiaSeleccionada.plan_anual as { grado: string } | null;
    return planAnual?.grado === g.grado;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!asignacion) return;
    
    if (!profesorId.trim() || !materiaId.trim() || !grupoId.trim() || !anioEscolar.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setWarnings([]);

    try {
      // Validar la asignación
      const validation = await validateAsignacion({
        id_profesor: profesorId,
        id_materia: materiaId,
        id_grupo: grupoId,
        anio_escolar: anioEscolar,
      }, asignacion.id);

      if (!validation.isValid) {
        toast({
          title: "Error de Validación",
          description: validation.error,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (validation.warnings) {
        setWarnings(validation.warnings);
      }

      // Actualizar la asignación
      const { error: updateError } = await supabase
        .from("asignaciones_profesor")
        .update({
          id_profesor: profesorId,
          id_materia: materiaId,
          id_grupo: grupoId,
          anio_escolar: anioEscolar,
        })
        .eq("id", asignacion.id);

      if (updateError) {
        console.error("Error al actualizar asignación:", updateError);
        
        if (updateError.code === '23505') {
          toast({
            title: "Error",
            description: "Ya existe una asignación idéntica",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "No se pudo actualizar la asignación. Por favor, intenta de nuevo.",
            variant: "destructive",
          });
        }
        
        setLoading(false);
        return;
      }

      toast({
        title: "Éxito",
        description: "Asignación actualizada correctamente",
      });

      setProfesorId("");
      setMateriaId("");
      setGrupoId("");
      setAnioEscolar(getCurrentAnioEscolar());
      setWarnings([]);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Error inesperado:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Generar opciones de años escolares (5 años hacia atrás y 2 hacia adelante)
  const currentYear = new Date().getFullYear();
  const aniosEscolares = Array.from({ length: 8 }, (_, i) => (currentYear - 5 + i).toString());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Asignación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {warnings.length > 0 && (
            <Alert variant="default" className="border-yellow-500 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                {warnings.map((warning, index) => (
                  <div key={index}>{warning}</div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="anio-escolar">Año Escolar</Label>
            <Select value={anioEscolar} onValueChange={setAnioEscolar}>
              <SelectTrigger id="anio-escolar">
                <SelectValue placeholder="Selecciona el año" />
              </SelectTrigger>
              <SelectContent>
                {aniosEscolares.map((anio) => (
                  <SelectItem key={anio} value={anio}>
                    {anio}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="profesor">Profesor</Label>
            <Select value={profesorId} onValueChange={setProfesorId}>
              <SelectTrigger id="profesor">
                <SelectValue placeholder="Selecciona un profesor" />
              </SelectTrigger>
              <SelectContent>
                {profesores.map((profesor) => (
                  <SelectItem key={profesor.id} value={profesor.id}>
                    {profesor.nombre} {profesor.apellido}
                    {profesor.especialidad && ` - ${profesor.especialidad}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="materia">Materia</Label>
            <Select value={materiaId} onValueChange={setMateriaId}>
              <SelectTrigger id="materia">
                <SelectValue placeholder="Selecciona una materia" />
              </SelectTrigger>
              <SelectContent>
                {materiasFiltradas.map((materia) => {
                  const planAnual = materia.plan_anual as { grado: string } | null;
                  return (
                    <SelectItem key={materia.id} value={materia.id}>
                      {materia.nombre} - {planAnual?.grado || 'Sin grado'}
                      {materia.horas_semanales && ` (${materia.horas_semanales}h/sem)`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger id="grupo">
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {gruposFiltrados.map((grupo) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre} ({grupo.grado} - {grupo.seccion})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AsignacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profesores: Array<{ id: string; nombre: string; apellido: string; especialidad: string }>;
  materias: Array<{ id: string; nombre: string; horas_semanales: number; grado: string }>;
  grupos: Array<{ id: string; nombre: string; grado: string; seccion: string; cantidad_alumnos: number }>;
  onSuccess: () => void;
}

export const AsignacionDialog = ({
  open,
  onOpenChange,
  profesores,
  materias,
  grupos,
  onSuccess,
}: AsignacionDialogProps) => {
  const [profesorId, setProfesorId] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!profesorId || !materiaId || !grupoId) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Verificar duplicados
    const { data: existing } = await supabase
      .from('asignaciones_profesor')
      .select('id')
      .eq('id_profesor', profesorId)
      .eq('id_materia', materiaId)
      .eq('id_grupo', grupoId)
      .eq('anio_escolar', '2025')
      .single();

    if (existing) {
      toast({
        title: "Error",
        description: "Esta asignación ya existe para el año 2025",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('asignaciones_profesor')
      .insert({
        id_profesor: profesorId,
        id_materia: materiaId,
        id_grupo: grupoId,
        anio_escolar: '2025',
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la asignación",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Asignación creada correctamente",
      });
      setProfesorId("");
      setMateriaId("");
      setGrupoId("");
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nueva Asignación</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="profesor">Profesor</Label>
            <Select value={profesorId} onValueChange={setProfesorId}>
              <SelectTrigger id="profesor">
                <SelectValue placeholder="Seleccionar profesor" />
              </SelectTrigger>
              <SelectContent>
                {profesores.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} {p.apellido} - {p.especialidad}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="materia">Materia</Label>
            <Select value={materiaId} onValueChange={setMateriaId}>
              <SelectTrigger id="materia">
                <SelectValue placeholder="Seleccionar materia" />
              </SelectTrigger>
              <SelectContent>
                {materias.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nombre} ({m.grado}) - {m.horas_semanales}h/sem
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={grupoId} onValueChange={setGrupoId}>
              <SelectTrigger id="grupo">
                <SelectValue placeholder="Seleccionar grupo" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.grado} - Sección {g.seccion} ({g.cantidad_alumnos} alumnos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear Asignación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

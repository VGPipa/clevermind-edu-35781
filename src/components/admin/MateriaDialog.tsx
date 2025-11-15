import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MateriaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materia?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    horas_semanales: number;
    orden: number;
    id_plan_anual: string;
  } | null;
  planAnualId: string;
  onSuccess: () => void;
}

export const MateriaDialog = ({
  open,
  onOpenChange,
  materia,
  planAnualId,
  onSuccess,
}: MateriaDialogProps) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [horasSemanales, setHorasSemanales] = useState<number>(0);
  const [orden, setOrden] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!materia;

  useEffect(() => {
    if (open) {
      if (materia) {
        setNombre(materia.nombre);
        setDescripcion(materia.descripcion || "");
        setHorasSemanales(materia.horas_semanales || 0);
        setOrden(materia.orden || 0);
      } else {
        setNombre("");
        setDescripcion("");
        setHorasSemanales(0);
        setOrden(0);
      }
    }
  }, [open, materia]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la materia es requerido",
        variant: "destructive",
      });
      return;
    }

    if (horasSemanales <= 0) {
      toast({
        title: "Error",
        description: "Las horas semanales deben ser mayor a 0",
        variant: "destructive",
      });
      return;
    }

    if (!planAnualId) {
      toast({
        title: "Error",
        description: "No se pudo obtener el plan anual",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && materia) {
        // Update existing materia
        const { error } = await supabase
          .from('materias')
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            horas_semanales: horasSemanales,
            orden: orden || 0,
          })
          .eq('id', materia.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Materia actualizada correctamente",
        });
      } else {
        // Get max orden for this plan
        const { data: existingMaterias } = await supabase
          .from('materias')
          .select('orden')
          .eq('id_plan_anual', planAnualId)
          .order('orden', { ascending: false })
          .limit(1);

        const nextOrden = existingMaterias && existingMaterias.length > 0
          ? (existingMaterias[0].orden || 0) + 1
          : 1;

        // Create new materia
        const { error } = await supabase
          .from('materias')
          .insert({
            id_plan_anual: planAnualId,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            horas_semanales: horasSemanales,
            orden: orden || nextOrden,
          });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Materia creada correctamente",
        });
      }

      // Reset form
      setNombre("");
      setDescripcion("");
      setHorasSemanales(0);
      setOrden(0);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la materia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Materia" : "Agregar Materia"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Matemáticas"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción de la materia..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="horas_semanales">Horas Semanales *</Label>
              <Input
                id="horas_semanales"
                type="number"
                min="1"
                value={horasSemanales}
                onChange={(e) => setHorasSemanales(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="orden">Orden</Label>
              <Input
                id="orden"
                type="number"
                min="0"
                value={orden}
                onChange={(e) => setOrden(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Guardando..." : isEditMode ? "Actualizar" : "Crear"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


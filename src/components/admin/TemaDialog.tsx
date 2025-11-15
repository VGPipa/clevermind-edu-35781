import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TemaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tema?: {
    id: string;
    nombre: string;
    descripcion: string | null;
    objetivos: string | null;
    duracion_estimada: number | null;
    orden: number | null;
    bimestre: number | null;
    id_materia: string;
  } | null;
  materiaId: string;
  onSuccess: () => void;
}

export const TemaDialog = ({
  open,
  onOpenChange,
  tema,
  materiaId,
  onSuccess,
}: TemaDialogProps) => {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [objetivos, setObjetivos] = useState("");
  const [duracionEstimada, setDuracionEstimada] = useState<number>(0);
  const [bimestre, setBimestre] = useState<string>("1");
  const [orden, setOrden] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditMode = !!tema;

  useEffect(() => {
    if (open) {
      if (tema) {
        setNombre(tema.nombre);
        setDescripcion(tema.descripcion || "");
        setObjetivos(tema.objetivos || "");
        setDuracionEstimada(tema.duracion_estimada || 0);
        setBimestre(tema.bimestre?.toString() || "1");
        setOrden(tema.orden || 0);
      } else {
        setNombre("");
        setDescripcion("");
        setObjetivos("");
        setDuracionEstimada(0);
        setBimestre("1");
        setOrden(0);
      }
    }
  }, [open, tema]);

  const handleSubmit = async () => {
    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del tema es requerido",
        variant: "destructive",
      });
      return;
    }

    if (!materiaId) {
      toast({
        title: "Error",
        description: "No se pudo obtener la materia",
        variant: "destructive",
      });
      return;
    }

    if (!bimestre || parseInt(bimestre) < 1 || parseInt(bimestre) > 4) {
      toast({
        title: "Error",
        description: "El bimestre debe ser entre 1 y 4",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && tema) {
        // Update existing tema
        const { error } = await supabase
          .from('temas')
          .update({
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            objetivos: objetivos.trim() || null,
            duracion_estimada: duracionEstimada || null,
            bimestre: parseInt(bimestre),
            orden: orden || 0,
          })
          .eq('id', tema.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tema actualizado correctamente",
        });
      } else {
        // Get max orden for this materia and bimestre
        const { data: existingTemas } = await supabase
          .from('temas')
          .select('orden')
          .eq('id_materia', materiaId)
          .eq('bimestre', parseInt(bimestre))
          .order('orden', { ascending: false })
          .limit(1);

        const nextOrden = existingTemas && existingTemas.length > 0
          ? (existingTemas[0].orden || 0) + 1
          : 1;

        // Create new tema
        const { error } = await supabase
          .from('temas')
          .insert({
            id_materia: materiaId,
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            objetivos: objetivos.trim() || null,
            duracion_estimada: duracionEstimada || null,
            bimestre: parseInt(bimestre),
            orden: orden || nextOrden,
          });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Tema creado correctamente",
        });
      }

      // Reset form
      setNombre("");
      setDescripcion("");
      setObjetivos("");
      setDuracionEstimada(0);
      setBimestre("1");
      setOrden(0);
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el tema",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Editar Tema" : "Agregar Tema"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Suma y Resta"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripción del tema..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="objetivos">Objetivos de Aprendizaje</Label>
            <Textarea
              id="objetivos"
              value={objetivos}
              onChange={(e) => setObjetivos(e.target.value)}
              placeholder="Objetivos que se esperan alcanzar con este tema..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bimestre">Bimestre *</Label>
              <Select value={bimestre} onValueChange={setBimestre}>
                <SelectTrigger id="bimestre">
                  <SelectValue placeholder="Seleccionar bimestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Bimestre 1</SelectItem>
                  <SelectItem value="2">Bimestre 2</SelectItem>
                  <SelectItem value="3">Bimestre 3</SelectItem>
                  <SelectItem value="4">Bimestre 4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="duracion_estimada">Duración (horas)</Label>
              <Input
                id="duracion_estimada"
                type="number"
                min="0"
                value={duracionEstimada}
                onChange={(e) => setDuracionEstimada(parseInt(e.target.value) || 0)}
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


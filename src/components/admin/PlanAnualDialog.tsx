import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlanAnualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planAnual?: {
    id: string;
    grado: string;
    anio_escolar: string;
    estado: string;
  } | null;
  onSuccess: () => void;
}

export const PlanAnualDialog = ({
  open,
  onOpenChange,
  planAnual,
  onSuccess,
}: PlanAnualDialogProps) => {
  const [grado, setGrado] = useState("");
  const [anioEscolar, setAnioEscolar] = useState("2025");
  const [estado, setEstado] = useState("activo");
  const [loading, setLoading] = useState(false);
  const [idInstitucion, setIdInstitucion] = useState<string | null>(null);
  const { toast } = useToast();

  const isEditMode = !!planAnual;

  useEffect(() => {
    if (open) {
      if (planAnual) {
        setGrado(planAnual.grado);
        setAnioEscolar(planAnual.anio_escolar);
        setEstado(planAnual.estado);
      } else {
        setGrado("");
        setAnioEscolar("2025");
        setEstado("activo");
      }
      // Get institution ID
      loadInstitution();
    }
  }, [open, planAnual]);

  const loadInstitution = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id_institucion')
        .eq('user_id', user.id)
        .single();
      
      if (profile?.id_institucion) {
        setIdInstitucion(profile.id_institucion);
      }
    }
  };

  const handleSubmit = async () => {
    if (!grado || !anioEscolar) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (!idInstitucion) {
      toast({
        title: "Error",
        description: "No se pudo obtener la institución. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isEditMode && planAnual) {
        // Check for duplicates (excluding current plan)
        const { data: existing } = await supabase
          .from('plan_anual')
          .select('id')
          .eq('grado', grado)
          .eq('anio_escolar', anioEscolar)
          .eq('id_institucion', idInstitucion)
          .neq('id', planAnual.id)
          .maybeSingle();

        if (existing) {
          toast({
            title: "Error",
            description: "Ya existe un plan anual para este grado y año escolar",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Update existing plan
        const { error } = await supabase
          .from('plan_anual')
          .update({
            grado,
            anio_escolar: anioEscolar,
            estado,
          })
          .eq('id', planAnual.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Plan anual actualizado correctamente",
        });
      } else {
        // Check for duplicates
        const { data: existing } = await supabase
          .from('plan_anual')
          .select('id')
          .eq('grado', grado)
          .eq('anio_escolar', anioEscolar)
          .eq('id_institucion', idInstitucion)
          .maybeSingle();

        if (existing) {
          toast({
            title: "Error",
            description: "Ya existe un plan anual para este grado y año escolar",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Create new plan
        const { error } = await supabase
          .from('plan_anual')
          .insert({
            id_institucion: idInstitucion,
            grado,
            anio_escolar: anioEscolar,
            estado,
          });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Plan anual creado correctamente",
        });
      }

      // Reset form
      setGrado("");
      setAnioEscolar("2025");
      setEstado("activo");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el plan anual",
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
            {isEditMode ? "Editar Plan Anual" : "Crear Plan Anual"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="grado">Grado *</Label>
            <Select value={grado} onValueChange={setGrado}>
              <SelectTrigger id="grado">
                <SelectValue placeholder="Seleccionar grado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1° Primaria">1° Primaria</SelectItem>
                <SelectItem value="2° Primaria">2° Primaria</SelectItem>
                <SelectItem value="3° Primaria">3° Primaria</SelectItem>
                <SelectItem value="4° Primaria">4° Primaria</SelectItem>
                <SelectItem value="5° Primaria">5° Primaria</SelectItem>
                <SelectItem value="6° Primaria">6° Primaria</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="anio_escolar">Año Escolar *</Label>
            <Input
              id="anio_escolar"
              type="text"
              value={anioEscolar}
              onChange={(e) => setAnioEscolar(e.target.value)}
              placeholder="2025"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={setEstado}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
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


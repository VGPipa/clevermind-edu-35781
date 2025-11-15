import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EditAsignacionDialog } from "./EditAsignacionDialog";

interface AsignacionesTableProps {
  asignaciones: any[];
  onRefresh: () => void;
  profesores: any[];
  materias: any[];
  grupos: any[];
}

export const AsignacionesTable = ({ asignaciones, onRefresh, profesores, materias, grupos }: AsignacionesTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editAsignacion, setEditAsignacion] = useState<any>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from("asignaciones_profesor")
      .delete()
      .eq("id", deleteId);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la asignación",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Éxito",
        description: "Asignación eliminada correctamente",
      });
      onRefresh();
    }

    setDeleteId(null);
  };

  if (asignaciones.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No se encontraron asignaciones
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesor</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Horas/Sem</TableHead>
              <TableHead>Año Escolar</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asignaciones.map((asignacion) => (
              <TableRow key={asignacion.id}>
                <TableCell className="font-medium">
                  <div>
                    <p>{asignacion.profesor.nombre} {asignacion.profesor.apellido}</p>
                    <p className="text-sm text-muted-foreground">{asignacion.profesor.email}</p>
                  </div>
                </TableCell>
                <TableCell>{asignacion.materia.nombre}</TableCell>
                <TableCell>
                  {asignacion.grupo.nombre}
                  <span className="text-sm text-muted-foreground ml-2">
                    ({asignacion.grupo.grado} - {asignacion.grupo.seccion})
                  </span>
                </TableCell>
                <TableCell>{asignacion.materia.horas_semanales}h</TableCell>
                <TableCell>{asignacion.anio_escolar}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditAsignacion(asignacion)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteId(asignacion.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditAsignacionDialog
        open={!!editAsignacion}
        onOpenChange={(open) => !open && setEditAsignacion(null)}
        asignacion={editAsignacion}
        profesores={profesores}
        materias={materias}
        grupos={grupos}
        onSuccess={() => {
          setEditAsignacion(null);
          onRefresh();
        }}
      />
    </>
  );
};

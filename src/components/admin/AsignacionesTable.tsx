import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Asignacion {
  id: string;
  profesor: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
    especialidad: string;
  };
  materia: {
    id: string;
    nombre: string;
    horas_semanales: number;
    grado: string;
  };
  grupo: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
    cantidad_alumnos: number;
  };
  anio_escolar: string;
}

interface AsignacionesTableProps {
  asignaciones: Asignacion[];
  onRefresh: () => void;
}

export const AsignacionesTable = ({ asignaciones, onRefresh }: AsignacionesTableProps) => {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('asignaciones_profesor')
      .delete()
      .eq('id', deleteId);

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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profesor</TableHead>
              <TableHead>Materia</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Horas/sem</TableHead>
              <TableHead>Estudiantes</TableHead>
              <TableHead>Año</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {asignaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No hay asignaciones registradas
                </TableCell>
              </TableRow>
            ) : (
              asignaciones.map((asignacion) => (
                <TableRow key={asignacion.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {asignacion.profesor.nombre} {asignacion.profesor.apellido}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {asignacion.profesor.especialidad}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{asignacion.materia.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {asignacion.materia.grado}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {asignacion.grupo.grado} - {asignacion.grupo.seccion}
                    </Badge>
                  </TableCell>
                  <TableCell>{asignacion.materia.horas_semanales}</TableCell>
                  <TableCell>{asignacion.grupo.cantidad_alumnos}</TableCell>
                  <TableCell>
                    <Badge>{asignacion.anio_escolar}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setDeleteId(asignacion.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar asignación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la asignación seleccionada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Users, AlertCircle } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface Grupo {
  id: string;
  nombre: string;
  grado: string;
  seccion: string;
  cantidad_alumnos: number;
  plan_diferente?: boolean;
}

interface GruposGradoProps {
  grupos: Grupo[];
  grado: string;
  onRefresh: () => void;
}

export function GruposGrado({ grupos, grado, onRefresh }: GruposGradoProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [grupoToDelete, setGrupoToDelete] = useState<Grupo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [seccion, setSeccion] = useState("");
  const [cantidadAlumnos, setCantidadAlumnos] = useState<number>(0);
  const [planDiferente, setPlanDiferente] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = () => {
    setEditingGrupo(null);
    setSeccion("");
    setCantidadAlumnos(0);
    setPlanDiferente(false);
    setCreateDialogOpen(true);
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setSeccion(grupo.seccion);
    setCantidadAlumnos(grupo.cantidad_alumnos);
    setPlanDiferente(grupo.plan_diferente || false);
    setEditDialogOpen(true);
  };

  const handleDelete = (grupo: Grupo) => {
    setGrupoToDelete(grupo);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!grupoToDelete) return;

    try {
      // Check if grupo has alumnos
      const { data: alumnosGrupo } = await supabase
        .from('alumnos_grupo')
        .select('id')
        .eq('id_grupo', grupoToDelete.id)
        .limit(1);

      if (alumnosGrupo && alumnosGrupo.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar un grupo que tiene alumnos asignados",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        return;
      }

      // Check if grupo has asignaciones
      const { data: asignaciones } = await supabase
        .from('asignaciones_profesor')
        .select('id')
        .eq('id_grupo', grupoToDelete.id)
        .limit(1);

      if (asignaciones && asignaciones.length > 0) {
        toast({
          title: "Error",
          description: "No se puede eliminar un grupo que tiene profesores asignados",
          variant: "destructive",
        });
        setDeleteDialogOpen(false);
        return;
      }

      const { error } = await supabase
        .from('grupos')
        .delete()
        .eq('id', grupoToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Grupo eliminado correctamente",
      });

      setDeleteDialogOpen(false);
      setGrupoToDelete(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error deleting grupo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el grupo",
        variant: "destructive",
      });
    }
  };

  const handleSaveGrupo = async () => {
    if (!seccion.trim()) {
      toast({
        title: "Error",
        description: "La sección es requerida",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id_institucion')
        .eq('user_id', user.id)
        .single();

      if (!profile?.id_institucion) throw new Error('Institución no encontrada');

      if (editingGrupo) {
        // Update existing grupo
        const { error } = await supabase
          .from('grupos')
          .update({
            seccion: seccion.trim(),
            cantidad_alumnos: cantidadAlumnos,
            nombre: `${grado} - Sección ${seccion.trim()}`,
            // Note: plan_diferente would need to be stored in a separate table or JSONB field
            // For now, we'll skip this as it requires schema changes
          })
          .eq('id', editingGrupo.id);

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Grupo actualizado correctamente",
        });
      } else {
        // Check if grupo already exists
        const { data: existing } = await supabase
          .from('grupos')
          .select('id')
          .eq('id_institucion', profile.id_institucion)
          .eq('grado', grado)
          .eq('seccion', seccion.trim())
          .maybeSingle();

        if (existing) {
          toast({
            title: "Error",
            description: "Ya existe un grupo con esta sección para este grado",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Create new grupo
        const { error } = await supabase
          .from('grupos')
          .insert({
            id_institucion: profile.id_institucion,
            grado: grado,
            seccion: seccion.trim(),
            cantidad_alumnos: cantidadAlumnos,
            nombre: `${grado} - Sección ${seccion.trim()}`,
          });

        if (error) throw error;

        toast({
          title: "Éxito",
          description: "Grupo creado correctamente",
        });
      }

      setEditDialogOpen(false);
      setCreateDialogOpen(false);
      setSeccion("");
      setCantidadAlumnos(0);
      setPlanDiferente(false);
      setEditingGrupo(null);
      onRefresh();
    } catch (error: any) {
      console.error('Error saving grupo:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el grupo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Grupos/Salones - {grado}</CardTitle>
              <CardDescription>
                {grupos.length} {grupos.length === 1 ? 'grupo' : 'grupos'} configurado(s)
              </CardDescription>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Grupo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {grupos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No hay grupos configurados para este grado</p>
              <p className="text-sm mt-1">Crea un grupo para comenzar</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sección</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Alumnos</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.map((grupo) => (
                    <TableRow key={grupo.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">{grupo.seccion}</Badge>
                      </TableCell>
                      <TableCell>{grupo.nombre}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          {grupo.cantidad_alumnos}
                        </div>
                      </TableCell>
                      <TableCell>
                        {grupo.plan_diferente ? (
                          <Badge variant="outline" className="text-warning">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Plan diferente
                          </Badge>
                        ) : (
                          <Badge variant="default">Plan estándar</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(grupo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(grupo)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
          setSeccion("");
          setCantidadAlumnos(0);
          setPlanDiferente(false);
          setEditingGrupo(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingGrupo ? "Editar Grupo" : "Agregar Grupo"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="grado">Grado</Label>
              <Input
                id="grado"
                value={grado}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="seccion">Sección *</Label>
              <Input
                id="seccion"
                value={seccion}
                onChange={(e) => setSeccion(e.target.value)}
                placeholder="Ej: A, B, C"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cantidad_alumnos">Cantidad de Alumnos</Label>
              <Input
                id="cantidad_alumnos"
                type="number"
                min="0"
                value={cantidadAlumnos}
                onChange={(e) => setCantidadAlumnos(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="plan_diferente"
                checked={planDiferente}
                onCheckedChange={(checked) => setPlanDiferente(checked as boolean)}
              />
              <Label htmlFor="plan_diferente" className="text-sm font-normal cursor-pointer">
                Este grupo tiene un plan diferente al estándar del grado
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveGrupo} disabled={loading}>
              {loading ? "Guardando..." : editingGrupo ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará el grupo "{grupoToDelete?.nombre}".
              Asegúrate de que no tenga alumnos o profesores asignados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


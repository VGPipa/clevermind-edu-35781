import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Calendar, Settings, Bell, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Configuracion() {
  const queryClient = useQueryClient();
  const [selectedAnioId, setSelectedAnioId] = useState<string | null>(null);
  const [anioDialogOpen, setAnioDialogOpen] = useState(false);
  const [periodoDialogOpen, setPeriodoDialogOpen] = useState(false);
  const [deleteAnioDialogOpen, setDeleteAnioDialogOpen] = useState(false);
  const [deletePeriodoDialogOpen, setDeletePeriodoDialogOpen] = useState(false);
  const [anioToDelete, setAnioToDelete] = useState<string | null>(null);
  const [periodoToDelete, setPeriodoToDelete] = useState<string | null>(null);
  const [editingAnio, setEditingAnio] = useState<any>(null);
  const [editingPeriodo, setEditingPeriodo] = useState<any>(null);

  const [anioForm, setAnioForm] = useState({
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: false,
  });

  const [periodoForm, setPeriodoForm] = useState({
    numero: 1,
    nombre: '',
    fecha_inicio: '',
    fecha_fin: '',
    activo: false,
  });

  const [alertasForm, setAlertasForm] = useState({
    rango_dias_clases_pendientes: 60,
    dias_urgente: 2,
    dias_proxima: 5,
    dias_programada: 14,
    dias_lejana: 999,
  });

  // Fetch academic years
  const { data: aniosData, isLoading: aniosLoading, refetch: refetchAnios } = useQuery({
    queryKey: ['anios-escolares-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-anios-escolares-admin');
      if (error) throw error;
      return data;
    },
  });

  // Fetch alert configuration
  const { data: alertasData, isLoading: alertasLoading, refetch: refetchAlertas } = useQuery({
    queryKey: ['configuracion-alertas-admin'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('manage-configuracion-alertas', {
        body: { action: 'get' },
      });
      if (error) throw error;
      return data;
    },
  });

  // Initialize alertas form when data loads
  useEffect(() => {
    if (alertasData && !alertasData.es_default) {
      setAlertasForm({
        rango_dias_clases_pendientes: alertasData.rango_dias_clases_pendientes,
        dias_urgente: alertasData.dias_urgente,
        dias_proxima: alertasData.dias_proxima,
        dias_programada: alertasData.dias_programada,
        dias_lejana: alertasData.dias_lejana,
      });
    }
  }, [alertasData]);

  const handleOpenAnioDialog = (anio?: any) => {
    if (anio) {
      setEditingAnio(anio);
      setAnioForm({
        nombre: anio.nombre,
        fecha_inicio: anio.fecha_inicio,
        fecha_fin: anio.fecha_fin,
        activo: anio.activo,
      });
    } else {
      setEditingAnio(null);
      setAnioForm({
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: false,
      });
    }
    setAnioDialogOpen(true);
  };

  const handleSaveAnio = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-anio-escolar', {
        body: {
          action: editingAnio ? 'update' : 'create',
          id: editingAnio?.id,
          ...anioForm,
        },
      });

      if (error) throw error;

      toast.success(editingAnio ? 'Año escolar actualizado' : 'Año escolar creado');
      setAnioDialogOpen(false);
      refetchAnios();
    } catch (error: any) {
      console.error('Error saving year:', error);
      toast.error(error.message || 'Error al guardar el año escolar');
    }
  };

  const handleDeleteAnio = async () => {
    if (!anioToDelete) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-anio-escolar', {
        body: {
          action: 'delete',
          id: anioToDelete,
        },
      });

      if (error) throw error;

      toast.success('Año escolar eliminado');
      setDeleteAnioDialogOpen(false);
      setAnioToDelete(null);
      refetchAnios();
    } catch (error: any) {
      console.error('Error deleting year:', error);
      toast.error(error.message || 'Error al eliminar el año escolar');
    }
  };

  const handleOpenPeriodoDialog = (periodo?: any) => {
    if (periodo) {
      setEditingPeriodo(periodo);
      setPeriodoForm({
        numero: periodo.numero,
        nombre: periodo.nombre,
        fecha_inicio: periodo.fecha_inicio,
        fecha_fin: periodo.fecha_fin,
        activo: periodo.activo,
      });
    } else {
      setEditingPeriodo(null);
      setPeriodoForm({
        numero: 1,
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: false,
      });
    }
    setPeriodoDialogOpen(true);
  };

  const handleSavePeriodo = async () => {
    if (!selectedAnioId) {
      toast.error('Selecciona un año escolar primero');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-periodo-academico', {
        body: {
          action: editingPeriodo ? 'update' : 'create',
          id: editingPeriodo?.id,
          id_anio_escolar: selectedAnioId,
          ...periodoForm,
        },
      });

      if (error) throw error;

      toast.success(editingPeriodo ? 'Periodo actualizado' : 'Periodo creado');
      setPeriodoDialogOpen(false);
      refetchAnios();
    } catch (error: any) {
      console.error('Error saving period:', error);
      toast.error(error.message || 'Error al guardar el periodo');
    }
  };

  const handleDeletePeriodo = async () => {
    if (!periodoToDelete) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-periodo-academico', {
        body: {
          action: 'delete',
          id: periodoToDelete,
        },
      });

      if (error) throw error;

      toast.success('Periodo eliminado');
      setDeletePeriodoDialogOpen(false);
      setPeriodoToDelete(null);
      refetchAnios();
    } catch (error: any) {
      console.error('Error deleting period:', error);
      toast.error(error.message || 'Error al eliminar el periodo');
    }
  };

  const handleSaveAlertas = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-configuracion-alertas', {
        body: {
          action: 'save',
          ...alertasForm,
        },
      });

      if (error) throw error;

      toast.success('Configuración de alertas guardada');
      refetchAlertas();
    } catch (error: any) {
      console.error('Error saving alerts config:', error);
      toast.error(error.message || 'Error al guardar la configuración');
    }
  };

  const selectedAnio = aniosData?.anios_escolares?.find((a: any) => a.id === selectedAnioId);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona años escolares, periodos académicos y configuración de alertas
          </p>
        </div>

        <Tabs defaultValue="anios" className="space-y-6">
          <TabsList>
            <TabsTrigger value="anios">
              <Calendar className="mr-2 h-4 w-4" />
              Años Escolares
            </TabsTrigger>
            <TabsTrigger value="alertas">
              <Bell className="mr-2 h-4 w-4" />
              Alertas
            </TabsTrigger>
          </TabsList>

          {/* Años Escolares Tab */}
          <TabsContent value="anios" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Años Escolares</h2>
              <Button onClick={() => handleOpenAnioDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Año Escolar
              </Button>
            </div>

            {aniosLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {aniosData?.anios_escolares?.map((anio: any) => (
                  <Card
                    key={anio.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAnioId === anio.id ? 'border-primary' : ''
                    } ${anio.activo ? 'bg-primary/5' : ''}`}
                    onClick={() => setSelectedAnioId(anio.id === selectedAnioId ? null : anio.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{anio.nombre}</CardTitle>
                        <div className="flex gap-2">
                          {anio.activo && <Badge variant="default">Activo</Badge>}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAnioDialog(anio);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAnioToDelete(anio.id);
                              setDeleteAnioDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {new Date(anio.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(anio.fecha_fin).toLocaleDateString('es-ES')}
                      </CardDescription>
                    </CardHeader>
                    {selectedAnioId === anio.id && (
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="font-semibold">Periodos Académicos</h3>
                            <Button
                              size="sm"
                              onClick={() => handleOpenPeriodoDialog()}
                            >
                              <Plus className="mr-2 h-3 w-3" />
                              Nuevo Periodo
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {anio.periodos?.map((periodo: any) => (
                              <div
                                key={periodo.id}
                                className="flex items-center justify-between p-2 border rounded-lg"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{periodo.nombre}</span>
                                    {periodo.activo && <Badge variant="outline" className="text-xs">Activo</Badge>}
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(periodo.fecha_inicio).toLocaleDateString('es-ES')} - {new Date(periodo.fecha_fin).toLocaleDateString('es-ES')}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleOpenPeriodoDialog(periodo)}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setPeriodoToDelete(periodo.id);
                                      setDeletePeriodoDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                            {(!anio.periodos || anio.periodos.length === 0) && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                No hay periodos académicos. Crea uno nuevo.
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
                {(!aniosData?.anios_escolares || aniosData.anios_escolares.length === 0) && (
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-center text-muted-foreground py-8">
                        No hay años escolares configurados. Crea uno nuevo para comenzar.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Año Escolar Dialog */}
            <Dialog open={anioDialogOpen} onOpenChange={setAnioDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingAnio ? 'Editar Año Escolar' : 'Nuevo Año Escolar'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingAnio ? 'Modifica los datos del año escolar' : 'Crea un nuevo año escolar para tu institución'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      value={anioForm.nombre}
                      onChange={(e) => setAnioForm({ ...anioForm, nombre: e.target.value })}
                      placeholder="Ej: 2024-2025"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                    <Input
                      id="fecha_inicio"
                      type="date"
                      value={anioForm.fecha_inicio}
                      onChange={(e) => setAnioForm({ ...anioForm, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fecha_fin">Fecha de Fin</Label>
                    <Input
                      id="fecha_fin"
                      type="date"
                      value={anioForm.fecha_fin}
                      onChange={(e) => setAnioForm({ ...anioForm, fecha_fin: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="activo"
                      checked={anioForm.activo}
                      onCheckedChange={(checked) => setAnioForm({ ...anioForm, activo: checked === true })}
                    />
                    <Label htmlFor="activo" className="text-sm font-normal">
                      Marcar como año escolar activo
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAnioDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveAnio}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Periodo Académico Dialog */}
            <Dialog open={periodoDialogOpen} onOpenChange={setPeriodoDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingPeriodo ? 'Editar Periodo Académico' : 'Nuevo Periodo Académico'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingPeriodo ? 'Modifica los datos del periodo' : 'Crea un nuevo periodo académico (bimestre/trimestre)'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="numero">Número</Label>
                    <Input
                      id="numero"
                      type="number"
                      min="1"
                      max="4"
                      value={periodoForm.numero}
                      onChange={(e) => setPeriodoForm({ ...periodoForm, numero: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodo_nombre">Nombre</Label>
                    <Input
                      id="periodo_nombre"
                      value={periodoForm.nombre}
                      onChange={(e) => setPeriodoForm({ ...periodoForm, nombre: e.target.value })}
                      placeholder="Ej: Bimestre I"
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodo_fecha_inicio">Fecha de Inicio</Label>
                    <Input
                      id="periodo_fecha_inicio"
                      type="date"
                      value={periodoForm.fecha_inicio}
                      onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodo_fecha_fin">Fecha de Fin</Label>
                    <Input
                      id="periodo_fecha_fin"
                      type="date"
                      value={periodoForm.fecha_fin}
                      onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="periodo_activo"
                      checked={periodoForm.activo}
                      onCheckedChange={(checked) => setPeriodoForm({ ...periodoForm, activo: checked === true })}
                    />
                    <Label htmlFor="periodo_activo" className="text-sm font-normal">
                      Marcar como periodo activo
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPeriodoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSavePeriodo}>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Dialogs */}
            <AlertDialog open={deleteAnioDialogOpen} onOpenChange={setDeleteAnioDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar año escolar?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán también todos los periodos académicos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAnio} className="bg-destructive">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deletePeriodoDialogOpen} onOpenChange={setDeletePeriodoDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar periodo académico?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeletePeriodo} className="bg-destructive">
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Alertas Tab */}
          <TabsContent value="alertas" className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Configuración de Alertas</h2>
              <p className="text-muted-foreground">
                Configura los rangos de días para las alertas de proximidad de clases
              </p>
            </div>

            {alertasLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Rangos de Alertas</CardTitle>
                  <CardDescription>
                    Define cuántos días antes de una clase se activa cada nivel de alerta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="rango_dias">Rango de días para clases pendientes</Label>
                    <Input
                      id="rango_dias"
                      type="number"
                      min="1"
                      value={alertasForm.rango_dias_clases_pendientes}
                      onChange={(e) => setAlertasForm({ ...alertasForm, rango_dias_clases_pendientes: parseInt(e.target.value) || 60 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Solo se mostrarán las clases dentro de este rango de días desde la fecha de referencia
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="dias_urgente">Días para alerta Urgente</Label>
                      <Input
                        id="dias_urgente"
                        type="number"
                        min="1"
                        value={alertasForm.dias_urgente}
                        onChange={(e) => setAlertasForm({ ...alertasForm, dias_urgente: parseInt(e.target.value) || 2 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Clases con {alertasForm.dias_urgente} días o menos
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="dias_proxima">Días para alerta Próxima</Label>
                      <Input
                        id="dias_proxima"
                        type="number"
                        min="1"
                        value={alertasForm.dias_proxima}
                        onChange={(e) => setAlertasForm({ ...alertasForm, dias_proxima: parseInt(e.target.value) || 5 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Clases con {alertasForm.dias_proxima} días o menos
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="dias_programada">Días para alerta Programada</Label>
                      <Input
                        id="dias_programada"
                        type="number"
                        min="1"
                        value={alertasForm.dias_programada}
                        onChange={(e) => setAlertasForm({ ...alertasForm, dias_programada: parseInt(e.target.value) || 14 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Clases con {alertasForm.dias_programada} días o menos
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="dias_lejana">Días para alerta Lejana</Label>
                      <Input
                        id="dias_lejana"
                        type="number"
                        min="1"
                        value={alertasForm.dias_lejana}
                        onChange={(e) => setAlertasForm({ ...alertasForm, dias_lejana: parseInt(e.target.value) || 999 })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Clases con más de {alertasForm.dias_programada} días
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSaveAlertas}>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Configuración
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}


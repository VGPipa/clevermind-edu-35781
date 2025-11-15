import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, CheckCircle2, History, Eye, Edit } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function EditarGuia() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Fetch clase data
  const { data: clase, isLoading: claseLoading } = useQuery({
    queryKey: ['clase', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clases')
        .select(`
          id,
          estado,
          id_guia_version_actual,
          temas!inner(nombre),
          grupos!inner(nombre, grado, seccion)
        `)
        .eq('id', claseId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!claseId,
  });

  // Fetch current guide version
  const { data: currentVersion, isLoading: versionLoading } = useQuery({
    queryKey: ['guia-version', clase?.id_guia_version_actual],
    queryFn: async () => {
      if (!clase?.id_guia_version_actual) return null;
      const { data, error } = await (supabase as any)
        .from('guias_clase_versiones')
        .select('*')
        .eq('id', clase.id_guia_version_actual)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clase?.id_guia_version_actual,
  });

  // Fetch all versions for history
  const { data: allVersions } = useQuery({
    queryKey: ['guia-versions', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('guias_clase_versiones')
        .select('*')
        .eq('id_clase', claseId!)
        .order('version_numero', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!claseId,
  });

  const [editedData, setEditedData] = useState({
    objetivos: '',
    estructura: [] as any[],
    preguntas_socraticas: [] as string[],
  });

  // Initialize edited data when version loads
  useEffect(() => {
    if (currentVersion && !editing) {
      setEditedData({
        objetivos: currentVersion.objetivos || '',
        estructura: Array.isArray(currentVersion.estructura) ? currentVersion.estructura : [],
        preguntas_socraticas: Array.isArray(currentVersion.preguntas_socraticas) 
          ? currentVersion.preguntas_socraticas 
          : [],
      });
    }
  }, [currentVersion, editing]);

  const handleStartEdit = () => {
    if (currentVersion) {
      setEditedData({
        objetivos: currentVersion.objetivos || '',
        estructura: Array.isArray(currentVersion.estructura) ? currentVersion.estructura : [],
        preguntas_socraticas: Array.isArray(currentVersion.preguntas_socraticas) 
          ? currentVersion.preguntas_socraticas 
          : [],
      });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!claseId || !currentVersion) return;

    setSaving(true);
    try {
      // Update current version
      const { error } = await (supabase as any)
        .from('guias_clase_versiones')
        .update({
          objetivos: editedData.objetivos,
          estructura: editedData.estructura,
          preguntas_socraticas: editedData.preguntas_socraticas,
        })
        .eq('id', currentVersion.id);

      if (error) throw error;

      toast.success("Guía actualizada exitosamente");
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['guia-version'] });
    } catch (error: any) {
      console.error('Error saving guide:', error);
      toast.error(error.message || "Error al guardar la guía");
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!claseId || !currentVersion) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('aprobar-guia', {
        body: {
          id_clase: claseId,
          id_version: currentVersion.id,
        },
      });

      if (error) throw error;

      toast.success("Guía aprobada exitosamente. Ahora puedes generar el quiz previo.");
      queryClient.invalidateQueries({ queryKey: ['clase'] });
      queryClient.invalidateQueries({ queryKey: ['guia-version'] });
      navigate('/profesor/dashboard');
    } catch (error: any) {
      console.error('Error approving guide:', error);
      toast.error(error.message || "Error al aprobar la guía");
    } finally {
      setSaving(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      borrador: "outline",
      aprobada: "default",
      final: "default",
    };
    return (
      <Badge variant={variants[estado] || "secondary"}>
        {estado === 'borrador' ? 'Borrador' : estado === 'aprobada' ? 'Aprobada' : 'Versión Final'}
      </Badge>
    );
  };

  if (claseLoading || versionLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!clase || !currentVersion) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Guía no encontrada</h2>
          <Button onClick={() => navigate('/profesor/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/profesor/dashboard')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Editar Guía de Clase</h1>
              <p className="text-muted-foreground">
                {clase.temas?.nombre} - {clase.grupos?.grado} {clase.grupos?.seccion}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <History className="mr-2 h-4 w-4" />
                  Historial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle>Historial de Versiones</DialogTitle>
                  <DialogDescription>
                    Versiones anteriores de esta guía de clase
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-3">
                    {allVersions?.map((version: any) => (
                      <Card
                        key={version.id}
                        className={`cursor-pointer hover:bg-accent ${
                          version.id === currentVersion.id ? 'border-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedVersion(version.id);
                          setShowHistory(false);
                        }}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Versión {version.version_numero}</span>
                                {getEstadoBadge(version.estado)}
                                {version.es_version_final && (
                                  <Badge variant="default">Final</Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(version.created_at).toLocaleDateString('es-ES', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                            {version.id === currentVersion.id && (
                              <Badge variant="outline">Actual</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
            {!editing ? (
              <Button onClick={handleStartEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar
                </Button>
              </div>
            )}
            {currentVersion.estado === 'borrador' && !editing && (
              <Button onClick={handleApprove} disabled={saving}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Aprobar Guía
              </Button>
            )}
          </div>
        </div>

        {/* Version Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Versión {currentVersion.version_numero}</CardTitle>
                <CardDescription>
                  {getEstadoBadge(currentVersion.estado)}
                  {currentVersion.es_version_final && (
                    <Badge variant="default" className="ml-2">Versión Final</Badge>
                  )}
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentVersion.generada_ia && (
                  <Badge variant="outline">Generada con IA</Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Objetivos */}
        <Card>
          <CardHeader>
            <CardTitle>Objetivos de Aprendizaje</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <Textarea
                value={editedData.objetivos}
                onChange={(e) => setEditedData({ ...editedData, objetivos: e.target.value })}
                rows={6}
                placeholder="Escribe los objetivos de aprendizaje..."
              />
            ) : (
              <div className="whitespace-pre-wrap text-sm">
                {currentVersion.objetivos || 'Sin objetivos definidos'}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estructura */}
        <Card>
          <CardHeader>
            <CardTitle>Estructura de la Clase</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-4">
                {editedData.estructura.map((actividad, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={actividad.tiempo || actividad.duracion || ''}
                        onChange={(e) => {
                          const newEstructura = [...editedData.estructura];
                          newEstructura[index] = {
                            ...actividad,
                            tiempo: parseInt(e.target.value) || 0,
                            duracion: parseInt(e.target.value) || 0,
                          };
                          setEditedData({ ...editedData, estructura: newEstructura });
                        }}
                        placeholder="Tiempo (min)"
                        className="w-24"
                      />
                      <Input
                        value={actividad.actividad || actividad.fase || actividad.etapa || ''}
                        onChange={(e) => {
                          const newEstructura = [...editedData.estructura];
                          newEstructura[index] = {
                            ...actividad,
                            actividad: e.target.value,
                            fase: e.target.value,
                            etapa: e.target.value,
                          };
                          setEditedData({ ...editedData, estructura: newEstructura });
                        }}
                        placeholder="Nombre de la actividad"
                        className="flex-1"
                      />
                    </div>
                    <Textarea
                      value={actividad.descripcion || actividad.description || actividad.actividades || ''}
                      onChange={(e) => {
                        const newEstructura = [...editedData.estructura];
                        newEstructura[index] = {
                          ...actividad,
                          descripcion: e.target.value,
                          description: e.target.value,
                          actividades: e.target.value,
                        };
                        setEditedData({ ...editedData, estructura: newEstructura });
                      }}
                      placeholder="Descripción de la actividad"
                      rows={2}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(currentVersion.estructura) && currentVersion.estructura.length > 0 ? (
                  currentVersion.estructura.map((actividad: any, index: number) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 w-20 text-center">
                        <p className="text-sm font-medium text-muted-foreground">Tiempo</p>
                        <p className="text-lg font-bold text-primary">
                          {actividad.tiempo || actividad.duracion || 0}'
                        </p>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">
                          {actividad.actividad || actividad.fase || actividad.etapa || `Actividad ${index + 1}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {actividad.descripcion || actividad.description || actividad.actividades || 'Sin descripción'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">Sin estructura definida</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preguntas Socráticas */}
        <Card>
          <CardHeader>
            <CardTitle>Preguntas Socráticas</CardTitle>
          </CardHeader>
          <CardContent>
            {editing ? (
              <div className="space-y-2">
                {editedData.preguntas_socraticas.map((pregunta, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={pregunta}
                      onChange={(e) => {
                        const newPreguntas = [...editedData.preguntas_socraticas];
                        newPreguntas[index] = e.target.value;
                        setEditedData({ ...editedData, preguntas_socraticas: newPreguntas });
                      }}
                      placeholder={`Pregunta ${index + 1}`}
                      rows={2}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newPreguntas = editedData.preguntas_socraticas.filter((_, i) => i !== index);
                        setEditedData({ ...editedData, preguntas_socraticas: newPreguntas });
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditedData({
                      ...editedData,
                      preguntas_socraticas: [...editedData.preguntas_socraticas, ''],
                    });
                  }}
                >
                  Agregar Pregunta
                </Button>
              </div>
            ) : (
              <ul className="space-y-3">
                {Array.isArray(currentVersion.preguntas_socraticas) &&
                currentVersion.preguntas_socraticas.length > 0 ? (
                  currentVersion.preguntas_socraticas.map((pregunta: string, index: number) => (
                    <li key={index} className="flex gap-3">
                      <span className="font-semibold text-primary flex-shrink-0">{index + 1}.</span>
                      <span className="text-sm">{pregunta}</span>
                    </li>
                  ))
                ) : (
                  <p className="text-muted-foreground">Sin preguntas socráticas definidas</p>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


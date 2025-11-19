import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TemaProgressCard } from "@/components/profesor/TemaProgressCard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, BookOpen } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function MisTemas() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [temas, setTemas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTema, setSelectedTema] = useState<any>(null);
  const [showGuiaMaestra, setShowGuiaMaestra] = useState(false);
  const [showProgramarDialog, setShowProgramarDialog] = useState(false);
  const [programarForm, setProgramarForm] = useState({
    numero_sesion: 1,
    fecha_programada: '',
    duracion_minutos: 90,
    contexto_especifico: ''
  });

  useEffect(() => {
    loadTemas();
  }, []);

  const loadTemas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-mis-temas');
      
      if (error) throw error;
      
      setTemas(data.temas || []);
    } catch (error: any) {
      console.error('Error cargando temas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los temas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProgramarSesion = async () => {
    if (!selectedTema) return;

    try {
      // Get asignacion for this tema
      const { data: asignaciones } = await supabase
        .from('asignaciones_profesor')
        .select('id_grupo')
        .eq('id_materia', selectedTema.tema.materias.id)
        .limit(1)
        .single();

      if (!asignaciones) {
        toast({
          title: "Error",
          description: "No se encontró asignación para este tema",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('programar-sesion', {
        body: {
          id_tema: selectedTema.tema.id,
          id_grupo: asignaciones.id_grupo,
          ...programarForm
        }
      });

      if (error) throw error;

      toast({
        title: "¡Sesión programada!",
        description: data.mensaje
      });

      setShowProgramarDialog(false);
      loadTemas(); // Reload to update progress
    } catch (error: any) {
      console.error('Error programando sesión:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo programar la sesión",
        variant: "destructive"
      });
    }
  };

  const temasActivos = temas.filter(t => t.estado !== 'completado');
  const temasCompletados = temas.filter(t => t.estado === 'completado');

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Mis Temas
          </h1>
          <p className="text-muted-foreground">
            Gestiona las guías maestras y sesiones de tus temas
          </p>
        </div>

        <Tabs defaultValue="activos" className="w-full">
          <TabsList>
            <TabsTrigger value="activos">
              Activos ({temasActivos.length})
            </TabsTrigger>
            <TabsTrigger value="completados">
              Completados ({temasCompletados.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activos" className="space-y-4 mt-6">
            {temasActivos.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No tienes temas activos. Ve a Planificación para iniciar un tema.
                </p>
                <Button onClick={() => navigate('/profesor/planificacion')} className="mt-4">
                  Ir a Planificación
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {temasActivos.map((tema) => (
                  <TemaProgressCard
                    key={tema.id}
                    tema={tema}
                    onVerGuiaMaestra={() => {
                      setSelectedTema(tema);
                      setShowGuiaMaestra(true);
                    }}
                    onProgramarSesion={() => {
                      setSelectedTema(tema);
                      const nextSesion = (tema.sesiones?.length || 0) + 1;
                      setProgramarForm({
                        ...programarForm,
                        numero_sesion: nextSesion <= tema.total_sesiones ? nextSesion : tema.total_sesiones
                      });
                      setShowProgramarDialog(true);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completados" className="space-y-4 mt-6">
            {temasCompletados.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No hay temas completados aún</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {temasCompletados.map((tema) => (
                  <TemaProgressCard
                    key={tema.id}
                    tema={tema}
                    onVerGuiaMaestra={() => {
                      setSelectedTema(tema);
                      setShowGuiaMaestra(true);
                    }}
                    onProgramarSesion={() => {}}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog Guía Maestra */}
        <Dialog open={showGuiaMaestra} onOpenChange={setShowGuiaMaestra}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Guía Maestra: {selectedTema?.tema.nombre}</DialogTitle>
            </DialogHeader>
            {selectedTema && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Objetivos Generales</h3>
                  <p className="text-sm">{selectedTema.guia_maestra.objetivos_generales}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Estructura de Sesiones</h3>
                  <div className="space-y-2">
                    {selectedTema.guia_maestra.estructura_sesiones?.map((sesion: any) => (
                      <div key={sesion.numero} className="border p-3 rounded">
                        <p className="font-medium">Sesión {sesion.numero}: {sesion.titulo}</p>
                        <p className="text-sm text-muted-foreground">{sesion.contenido_clave}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Duración sugerida: {sesion.duracion_sugerida} minutos
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedTema.guia_maestra.contenido.recursos && (
                  <div>
                    <h3 className="font-semibold mb-2">Recursos Recomendados</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {selectedTema.guia_maestra.contenido.recursos.map((recurso: string, i: number) => (
                        <li key={i}>{recurso}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog Programar Sesión */}
        <Dialog open={showProgramarDialog} onOpenChange={setShowProgramarDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Programar Sesión {programarForm.numero_sesion}/{selectedTema?.total_sesiones}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Número de Sesión</Label>
                <Input
                  type="number"
                  min="1"
                  max={selectedTema?.total_sesiones}
                  value={programarForm.numero_sesion}
                  onChange={(e) => setProgramarForm({ ...programarForm, numero_sesion: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Fecha Programada</Label>
                <Input
                  type="date"
                  value={programarForm.fecha_programada}
                  onChange={(e) => setProgramarForm({ ...programarForm, fecha_programada: e.target.value })}
                />
              </div>
              <div>
                <Label>Duración (minutos)</Label>
                <Input
                  type="number"
                  value={programarForm.duracion_minutos}
                  onChange={(e) => setProgramarForm({ ...programarForm, duracion_minutos: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label>Contexto Específico (opcional)</Label>
                <Textarea
                  value={programarForm.contexto_especifico}
                  onChange={(e) => setProgramarForm({ ...programarForm, contexto_especifico: e.target.value })}
                  placeholder="Ajustes o consideraciones especiales para esta sesión..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowProgramarDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleProgramarSesion}>
                  Programar Sesión
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
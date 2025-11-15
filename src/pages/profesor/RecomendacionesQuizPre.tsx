import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, Lightbulb, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RecomendacionesQuizPre() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedRecommendations, setSelectedRecommendations] = useState<Set<string>>(new Set());
  const [modificacionesManuales, setModificacionesManuales] = useState<string>("");
  const [crearVersionFinal, setCrearVersionFinal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Fetch clase data
  const { data: clase, isLoading: claseLoading } = useQuery({
    queryKey: ['clase', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clases')
        .select(`
          id,
          estado,
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

  // Fetch quiz pre
  const { data: quizPre } = useQuery({
    queryKey: ['quiz-pre', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quizzes')
        .select('id')
        .eq('id_clase', claseId!)
        .eq('tipo_evaluacion', 'pre')
        .eq('estado', 'publicado')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!claseId,
  });

  // Fetch recommendations
  const { data: recomendaciones, isLoading: recLoading, refetch: refetchRecs } = useQuery({
    queryKey: ['recomendaciones', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('recomendaciones')
        .select('*')
        .eq('id_clase', claseId!)
        .eq('tipo', 'quiz_pre')
        .eq('aplicada', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!claseId,
  });

  const handleProcessResponses = async () => {
    if (!claseId || !quizPre?.id) {
      toast.error("No hay quiz previo enviado para procesar");
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('procesar-respuestas-quiz-pre', {
        body: {
          id_clase: claseId,
          id_quiz_pre: quizPre.id,
        },
      });

      if (error) throw error;

      toast.success("Respuestas procesadas. Recomendaciones generadas.");
      refetchRecs();
      queryClient.invalidateQueries({ queryKey: ['clase'] });
    } catch (error: any) {
      console.error('Error processing responses:', error);
      toast.error(error.message || "Error al procesar las respuestas");
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleRecommendation = (recId: string) => {
    const newSelected = new Set(selectedRecommendations);
    if (newSelected.has(recId)) {
      newSelected.delete(recId);
    } else {
      newSelected.add(recId);
    }
    setSelectedRecommendations(newSelected);
  };

  const handleApplyRecommendations = async () => {
    if (!claseId) return;

    if (selectedRecommendations.size === 0 && !modificacionesManuales.trim() && !crearVersionFinal) {
      toast.error("Selecciona al menos una recomendación, agrega modificaciones manuales, o marca para crear versión final");
      return;
    }

    setApplying(true);
    try {
      const modificaciones = modificacionesManuales.trim() 
        ? JSON.parse(modificacionesManuales) 
        : null;

      const { data, error } = await supabase.functions.invoke('aplicar-recomendaciones-guia', {
        body: {
          id_clase: claseId,
          id_recomendaciones_aplicar: Array.from(selectedRecommendations),
          modificaciones_manuales: modificaciones,
          crear_version_final: crearVersionFinal,
        },
      });

      if (error) throw error;

      toast.success(
        crearVersionFinal 
          ? "Versión final creada exitosamente. Ahora puedes generar el quiz post."
          : "Recomendaciones aplicadas exitosamente"
      );
      
      queryClient.invalidateQueries({ queryKey: ['clase'] });
      queryClient.invalidateQueries({ queryKey: ['recomendaciones'] });
      queryClient.invalidateQueries({ queryKey: ['guia-version'] });
      
      navigate('/profesor/dashboard');
    } catch (error: any) {
      console.error('Error applying recommendations:', error);
      if (error.message?.includes('JSON')) {
        toast.error("Las modificaciones manuales deben estar en formato JSON válido");
      } else {
        toast.error(error.message || "Error al aplicar las recomendaciones");
      }
    } finally {
      setApplying(false);
    }
  };

  if (claseLoading || recLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!clase) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Clase no encontrada</h2>
          <Button onClick={() => navigate('/profesor/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </AppLayout>
    );
  }

  const hasRecommendations = recomendaciones && recomendaciones.length > 0;
  const hasProcessedQuiz = quizPre !== null;

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
              <h1 className="text-3xl font-bold">Recomendaciones del Quiz PRE</h1>
              <p className="text-muted-foreground">
                {clase.temas?.nombre} - {clase.grupos?.grado} {clase.grupos?.seccion}
              </p>
            </div>
          </div>
        </div>

        {/* Process Responses Button */}
        {!hasProcessedQuiz && (
          <Alert>
            <Lightbulb className="h-4 w-4" />
            <AlertDescription>
              Primero debes enviar el quiz previo a los alumnos y esperar sus respuestas.
              Luego podrás procesar las respuestas para generar recomendaciones.
            </AlertDescription>
          </Alert>
        )}

        {hasProcessedQuiz && !hasRecommendations && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No hay recomendaciones generadas</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Procesa las respuestas del quiz previo para generar recomendaciones automáticas
                </p>
                <Button onClick={handleProcessResponses} disabled={processing}>
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="mr-2 h-4 w-4" />
                      Procesar Respuestas y Generar Recomendaciones
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations List */}
        {hasRecommendations && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Recomendaciones Generadas ({recomendaciones.length})
                </CardTitle>
                <CardDescription>
                  Selecciona las recomendaciones que deseas aplicar a la guía de clase
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recomendaciones.map((rec: any) => (
                  <Card
                    key={rec.id}
                    className={`cursor-pointer transition-colors ${
                      selectedRecommendations.has(rec.id)
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent/50'
                    }`}
                    onClick={() => handleToggleRecommendation(rec.id)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedRecommendations.has(rec.id)}
                          onCheckedChange={() => handleToggleRecommendation(rec.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{rec.contenido}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(rec.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            {/* Manual Modifications */}
            <Card>
              <CardHeader>
                <CardTitle>Modificaciones Manuales (Opcional)</CardTitle>
                <CardDescription>
                  Si deseas hacer cambios adicionales a la guía, puedes especificarlos aquí en formato JSON
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Label htmlFor="modificaciones">Modificaciones en formato JSON</Label>
                <Textarea
                  id="modificaciones"
                  value={modificacionesManuales}
                  onChange={(e) => setModificacionesManuales(e.target.value)}
                  placeholder='{"objetivos": "nuevos objetivos", "estructura": [...], "preguntas_socraticas": [...]}'
                  rows={6}
                  className="font-mono text-xs mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Deja vacío si no deseas hacer modificaciones manuales
                </p>
              </CardContent>
            </Card>

            {/* Create Final Version Option */}
            <Card>
              <CardHeader>
                <CardTitle>Crear Versión Final</CardTitle>
                <CardDescription>
                  Marca esta opción si deseas crear la versión final de la guía después de aplicar los cambios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="version-final"
                    checked={crearVersionFinal}
                    onCheckedChange={(checked) => setCrearVersionFinal(checked === true)}
                  />
                  <Label
                    htmlFor="version-final"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Crear versión final de la guía
                  </Label>
                </div>
                {crearVersionFinal && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Una vez creada la versión final, podrás generar el quiz post.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Apply Button */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => navigate('/profesor/dashboard')}>
                Cancelar
              </Button>
              <Button
                onClick={handleApplyRecommendations}
                disabled={applying || (selectedRecommendations.size === 0 && !modificacionesManuales.trim() && !crearVersionFinal)}
              >
                {applying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {crearVersionFinal 
                      ? 'Aplicar y Crear Versión Final'
                      : 'Aplicar Recomendaciones'}
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}


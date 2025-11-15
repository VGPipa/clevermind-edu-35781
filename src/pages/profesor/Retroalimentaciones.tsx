import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, User, UsersRound, UserRound, Loader2, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Retroalimentaciones() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState<Set<string>>(new Set());

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

  // Fetch quiz post
  const { data: quizPost } = useQuery({
    queryKey: ['quiz-post', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('quizzes')
        .select('id, estado, fecha_envio')
        .eq('id_clase', claseId!)
        .eq('tipo_evaluacion', 'post')
        .eq('estado', 'publicado')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!claseId,
  });

  // Fetch all retroalimentaciones
  const { data: retroalimentaciones, isLoading: retroLoading, refetch: refetchRetro } = useQuery({
    queryKey: ['retroalimentaciones', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('retroalimentaciones')
        .select(`
          *,
          alumnos(id, nombre, apellido)
        `)
        .eq('id_clase', claseId!)
        .order('fecha_generacion', { ascending: false });

      if (error) throw error;

      // Group by type
      const grouped: Record<string, any[]> = {
        alumno: [],
        profesor_individual: [],
        profesor_grupal: [],
        padre: [],
      };

      (data || []).forEach((retro: any) => {
        if (retro.tipo in grouped) {
          grouped[retro.tipo].push(retro);
        }
      });

      return grouped;
    },
    enabled: !!claseId,
  });

  const handleGenerateFeedback = async () => {
    if (!claseId || !quizPost?.id) {
      toast.error("No hay quiz post enviado para generar retroalimentaciones");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generar-retroalimentaciones', {
        body: {
          id_clase: claseId,
          id_quiz_post: quizPost.id,
        },
      });

      if (error) throw error;

      toast.success("Retroalimentaciones generadas exitosamente");
      refetchRetro();
      queryClient.invalidateQueries({ queryKey: ['clase'] });
    } catch (error: any) {
      console.error('Error generating feedback:', error);
      toast.error(error.message || "Error al generar las retroalimentaciones");
    } finally {
      setGenerating(false);
    }
  };

  const handleSendFeedback = async (retroId: string, tipo: string, alumnoNombre?: string) => {
    setSending(new Set([...Array.from(sending), retroId]));
    try {
      const { error } = await (supabase as any)
        .from('retroalimentaciones')
        .update({
          enviada: true,
          fecha_envio: new Date().toISOString(),
        })
        .eq('id', retroId);

      if (error) throw error;

      toast.success(
        `Retroalimentación ${tipo === 'alumno' ? 'para el alumno' : tipo === 'padre' ? 'para los padres' : ''} enviada exitosamente`
      );
      refetchRetro();
    } catch (error: any) {
      console.error('Error sending feedback:', error);
      toast.error(error.message || "Error al enviar la retroalimentación");
    } finally {
      const newSending = new Set(sending);
      newSending.delete(retroId);
      setSending(newSending);
    }
  };

  const renderFeedbackContent = (contenido: any) => {
    if (!contenido) return <p className="text-muted-foreground">Sin contenido</p>;

    if (typeof contenido === 'string') {
      return <p className="text-sm whitespace-pre-wrap">{contenido}</p>;
    }

    return (
      <div className="space-y-3 text-sm">
        {contenido.fortalezas && (
          <div>
            <p className="font-semibold text-green-700">Fortalezas:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.fortalezas) 
                ? contenido.fortalezas.map((f: string, i: number) => <li key={i}>{f}</li>)
                : <li>{contenido.fortalezas}</li>}
            </ul>
          </div>
        )}
        {contenido.areas_mejora && (
          <div>
            <p className="font-semibold text-orange-700">Áreas de mejora:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.areas_mejora) 
                ? contenido.areas_mejora.map((a: string, i: number) => <li key={i}>{a}</li>)
                : <li>{contenido.areas_mejora}</li>}
            </ul>
          </div>
        )}
        {contenido.mensaje_motivador && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="font-semibold text-blue-900 mb-1">Mensaje:</p>
            <p className="text-blue-800">{contenido.mensaje_motivador}</p>
          </div>
        )}
        {contenido.sugerencias && (
          <div>
            <p className="font-semibold">Sugerencias:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.sugerencias) 
                ? contenido.sugerencias.map((s: string, i: number) => <li key={i}>{s}</li>)
                : <li>{contenido.sugerencias}</li>}
            </ul>
          </div>
        )}
        {contenido.resumen_general && (
          <div>
            <p className="font-semibold">Resumen:</p>
            <p className="text-muted-foreground">{contenido.resumen_general}</p>
          </div>
        )}
        {contenido.pros_clase && (
          <div>
            <p className="font-semibold text-green-700">Pros:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.pros_clase) 
                ? contenido.pros_clase.map((p: string, i: number) => <li key={i}>{p}</li>)
                : <li>{contenido.pros_clase}</li>}
            </ul>
          </div>
        )}
        {contenido.contras_clase && (
          <div>
            <p className="font-semibold text-orange-700">Contras:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.contras_clase) 
                ? contenido.contras_clase.map((c: string, i: number) => <li key={i}>{c}</li>)
                : <li>{contenido.contras_clase}</li>}
            </ul>
          </div>
        )}
        {contenido.aprendizajes_logrados && (
          <div>
            <p className="font-semibold text-green-700">Aprendizajes logrados:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.aprendizajes_logrados) 
                ? contenido.aprendizajes_logrados.map((a: string, i: number) => <li key={i}>{a}</li>)
                : <li>{contenido.aprendizajes_logrados}</li>}
            </ul>
          </div>
        )}
        {contenido.aprendizajes_pendientes && (
          <div>
            <p className="font-semibold text-orange-700">Aprendizajes pendientes:</p>
            <ul className="list-disc list-inside ml-2 text-muted-foreground">
              {Array.isArray(contenido.aprendizajes_pendientes) 
                ? contenido.aprendizajes_pendientes.map((a: string, i: number) => <li key={i}>{a}</li>)
                : <li>{contenido.aprendizajes_pendientes}</li>}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (claseLoading || retroLoading) {
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

  const hasQuizPost = quizPost !== null;
  const hasFeedback = retroalimentaciones && (
    retroalimentaciones.alumno.length > 0 ||
    retroalimentaciones.profesor_individual.length > 0 ||
    retroalimentaciones.profesor_grupal.length > 0 ||
    retroalimentaciones.padre.length > 0
  );

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
              <h1 className="text-3xl font-bold">Retroalimentaciones</h1>
              <p className="text-muted-foreground">
                {clase.temas?.nombre} - {clase.grupos?.grado} {clase.grupos?.seccion}
              </p>
            </div>
          </div>
          {hasQuizPost && !hasFeedback && (
            <Button onClick={handleGenerateFeedback} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generar Retroalimentaciones
                </>
              )}
            </Button>
          )}
        </div>

        {!hasQuizPost && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No hay quiz POST enviado</p>
                <p className="text-sm text-muted-foreground">
                  Primero debes enviar el quiz POST (PAUSE) a los alumnos para poder generar retroalimentaciones.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {hasQuizPost && !hasFeedback && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No hay retroalimentaciones generadas</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Genera las retroalimentaciones basadas en las respuestas del quiz POST
                </p>
                <Button onClick={handleGenerateFeedback} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Generar Retroalimentaciones
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasFeedback && (
          <Tabs defaultValue="alumno" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="alumno">
                <User className="mr-2 h-4 w-4" />
                Alumno ({retroalimentaciones.alumno.length})
              </TabsTrigger>
              <TabsTrigger value="profesor_individual">
                <UserRound className="mr-2 h-4 w-4" />
                Prof. Individual ({retroalimentaciones.profesor_individual.length})
              </TabsTrigger>
              <TabsTrigger value="profesor_grupal">
                <UsersRound className="mr-2 h-4 w-4" />
                Prof. Grupal ({retroalimentaciones.profesor_grupal.length})
              </TabsTrigger>
              <TabsTrigger value="padre">
                <Users className="mr-2 h-4 w-4" />
                Padres ({retroalimentaciones.padre.length})
              </TabsTrigger>
            </TabsList>

            {/* Alumno Tab */}
            <TabsContent value="alumno" className="space-y-4">
              {retroalimentaciones.alumno.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {retroalimentaciones.alumno.map((retro: any) => {
                      const alumno = retro.alumnos;
                      const nombreAlumno = alumno 
                        ? `${alumno.nombre || ''} ${alumno.apellido || ''}`.trim()
                        : 'Alumno';
                      
                      return (
                        <Card key={retro.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">{nombreAlumno}</CardTitle>
                                <CardDescription>
                                  {new Date(retro.fecha_generacion).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                {retro.enviada ? (
                                  <Badge variant="default">Enviada</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendFeedback(retro.id, 'alumno', nombreAlumno)}
                                    disabled={sending.has(retro.id)}
                                  >
                                    <Send className="mr-2 h-3 w-3" />
                                    {sending.has(retro.id) ? 'Enviando...' : 'Enviar'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {renderFeedbackContent(retro.contenido)}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      No hay retroalimentaciones para alumnos
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Profesor Individual Tab */}
            <TabsContent value="profesor_individual" className="space-y-4">
              {retroalimentaciones.profesor_individual.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {retroalimentaciones.profesor_individual.map((retro: any) => {
                      const alumno = retro.alumnos;
                      const nombreAlumno = alumno 
                        ? `${alumno.nombre || ''} ${alumno.apellido || ''}`.trim()
                        : 'Alumno';
                      
                      return (
                        <Card key={retro.id}>
                          <CardHeader>
                            <CardTitle className="text-base">Análisis: {nombreAlumno}</CardTitle>
                            <CardDescription>
                              {new Date(retro.fecha_generacion).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            {renderFeedbackContent(retro.contenido)}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      No hay retroalimentaciones individuales para el profesor
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Profesor Grupal Tab */}
            <TabsContent value="profesor_grupal" className="space-y-4">
              {retroalimentaciones.profesor_grupal.length > 0 ? (
                retroalimentaciones.profesor_grupal.map((retro: any) => (
                  <Card key={retro.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UsersRound className="h-5 w-5" />
                        Análisis Grupal del Salón
                      </CardTitle>
                      <CardDescription>
                        {new Date(retro.fecha_generacion).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {renderFeedbackContent(retro.contenido)}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      No hay retroalimentación grupal generada
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Padres Tab */}
            <TabsContent value="padre" className="space-y-4">
              {retroalimentaciones.padre.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4 pr-4">
                    {retroalimentaciones.padre.map((retro: any) => {
                      const alumno = retro.alumnos;
                      const nombreAlumno = alumno 
                        ? `${alumno.nombre || ''} ${alumno.apellido || ''}`.trim()
                        : 'Alumno';
                      
                      return (
                        <Card key={retro.id}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">Padres de {nombreAlumno}</CardTitle>
                                <CardDescription>
                                  {new Date(retro.fecha_generacion).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                {retro.enviada ? (
                                  <Badge variant="default">Enviada</Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendFeedback(retro.id, 'padre', nombreAlumno)}
                                    disabled={sending.has(retro.id)}
                                  >
                                    <Send className="mr-2 h-3 w-3" />
                                    {sending.has(retro.id) ? 'Enviando...' : 'Enviar a Padres'}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {renderFeedbackContent(retro.contenido)}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      No hay retroalimentaciones para padres
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}


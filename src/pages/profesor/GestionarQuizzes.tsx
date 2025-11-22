import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Edit, Eye, Plus, Clock, FileText, Lock } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GestionarQuizzes() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sendingQuiz, setSendingQuiz] = useState<string | null>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<string | null>(null);
  const [closingQuiz, setClosingQuiz] = useState<string | null>(null);

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

  // Fetch quizzes for this class
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['quizzes-clase', claseId],
    queryFn: async () => {
      const { data: quizzesData, error } = await (supabase as any)
        .from('quizzes')
        .select('*')
        .eq('id_clase', claseId!)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch questions for each quiz
      const quizzesWithQuestions = await Promise.all(
        (quizzesData || []).map(async (quiz: any) => {
          const { data: preguntas } = await (supabase as any)
            .from('preguntas')
            .select('*')
            .eq('id_quiz', quiz.id)
            .order('orden', { ascending: true });

          return {
            ...quiz,
            preguntas: preguntas || [],
          };
        })
      );

      return quizzesWithQuestions;
    },
    enabled: !!claseId,
  });

  const handleSendQuiz = async (quizId: string, tipo: string) => {
    setSendingQuiz(quizId);
    try {
      const { data, error } = await supabase.functions.invoke('enviar-quiz', {
        body: { id_quiz: quizId },
      });

      if (error) throw error;

      toast.success(
        `Quiz ${tipo === 'pre' ? 'PRE' : 'POST'} enviado exitosamente a los alumnos`
      );
      queryClient.invalidateQueries({ queryKey: ['quizzes-clase'] });
      queryClient.invalidateQueries({ queryKey: ['clase'] });
    } catch (error: any) {
      console.error('Error sending quiz:', error);
      toast.error(error.message || "Error al enviar el quiz");
    } finally {
      setSendingQuiz(null);
    }
  };

  const handleGenerateQuiz = async (tipo: 'pre' | 'post') => {
    if (!claseId) return;

    try {
      const { data, error } = await supabase.functions.invoke('generar-evaluacion', {
        body: {
          id_clase: claseId,
          tipo: tipo,
        },
      });

      if (error) throw error;

      toast.success(`Quiz ${tipo === 'pre' ? 'PRE' : 'POST'} generado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['quizzes-clase'] });
    } catch (error: any) {
      console.error('Error generating quiz:', error);
      toast.error(error.message || "Error al generar el quiz");
    }
  };

  const handleCloseQuiz = async (quizId: string, tipo: string) => {
    if (!confirm(`¿Estás seguro de que deseas cerrar este quiz ${tipo === 'pre' ? 'PRE' : 'POST'}? Los alumnos ya no podrán enviar respuestas.`)) {
      return;
    }

    setClosingQuiz(quizId);
    try {
      const { error } = await (supabase as any)
        .from('quizzes')
        .update({ estado: 'cerrado' })
        .eq('id', quizId);

      if (error) throw error;

      toast.success(`Quiz ${tipo === 'pre' ? 'PRE' : 'POST'} cerrado exitosamente`);
      queryClient.invalidateQueries({ queryKey: ['quizzes-clase'] });
    } catch (error: any) {
      console.error('Error closing quiz:', error);
      toast.error(error.message || "Error al cerrar el quiz");
    } finally {
      setClosingQuiz(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      borrador: "outline",
      aprobado: "secondary",
      publicado: "default",
      cerrado: "secondary",
    };
    const labels: Record<string, string> = {
      borrador: 'Borrador',
      aprobado: 'Aprobado',
      publicado: 'Enviado',
      cerrado: 'Cerrado',
    };
    return (
      <Badge variant={variants[estado] || "secondary"}>
        {labels[estado] || estado}
      </Badge>
    );
  };

  if (claseLoading || quizzesLoading) {
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

  const quizPre = quizzes?.find((q: any) => q.tipo_evaluacion === 'pre');
  const quizPost = quizzes?.find((q: any) => q.tipo_evaluacion === 'post');

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
              <h1 className="text-3xl font-bold">Gestionar Quizzes</h1>
              <p className="text-muted-foreground">
                {clase.temas?.nombre} - {clase.grupos?.grado} {clase.grupos?.seccion}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="pre" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pre">Quiz PRE</TabsTrigger>
            <TabsTrigger value="post">Quiz POST (PAUSE)</TabsTrigger>
          </TabsList>

          {/* Quiz PRE Tab */}
          <TabsContent value="pre" className="space-y-4">
            {quizPre ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {quizPre.titulo}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {getEstadoBadge(quizPre.estado)}
                        {quizPre.tiempo_limite_minutos && (
                          <span className="ml-2 text-sm">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {quizPre.tiempo_limite_minutos} minutos
                          </span>
                        )}
                        {quizPre.max_preguntas && (
                          <span className="ml-2 text-sm">
                            Máximo {quizPre.max_preguntas} preguntas
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Preguntas
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Preguntas del Quiz PRE</DialogTitle>
                            <DialogDescription>
                              {quizPre.preguntas.length} pregunta(s)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {quizPre.preguntas.map((preg: any, index: number) => (
                              <Card key={preg.id}>
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                      Pregunta {index + 1}
                                    </CardTitle>
                                    <Badge>{preg.tipo}</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="mb-2">{preg.texto_pregunta}</p>
                                  {preg.justificacion && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Retroalimentación:</strong> {preg.justificacion}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {quizPre.estado === 'borrador' || quizPre.estado === 'aprobado' ? (
                        <Button
                          onClick={() => handleSendQuiz(quizPre.id, 'pre')}
                          disabled={sendingQuiz === quizPre.id}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {sendingQuiz === quizPre.id ? 'Enviando...' : 'Enviar a Alumnos'}
                        </Button>
                      ) : quizPre.estado === 'publicado' ? (
                        <div className="flex gap-2">
                          <Badge variant="default">
                            {quizPre.fecha_envio
                              ? `Enviado: ${new Date(quizPre.fecha_envio).toLocaleDateString('es-ES')}`
                              : 'Enviado'}
                          </Badge>
                          <Button
                            variant="outline"
                            onClick={() => handleCloseQuiz(quizPre.id, 'pre')}
                            disabled={closingQuiz === quizPre.id}
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            {closingQuiz === quizPre.id ? 'Cerrando...' : 'Cerrar Quiz'}
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">
                          {quizPre.estado === 'cerrado' ? 'Cerrado' : 'Ya enviado'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quizPre.instrucciones && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">{quizPre.instrucciones}</p>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>Total de preguntas: {quizPre.preguntas.length}</p>
                    {quizPre.fecha_envio && (
                      <p>
                        Fecha de envío: {new Date(quizPre.fecha_envio).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No hay quiz PRE generado</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Genera el quiz previo después de aprobar la guía de clase
                    </p>
                    <Button onClick={() => handleGenerateQuiz('pre')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Generar Quiz PRE
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quiz POST Tab */}
          <TabsContent value="post" className="space-y-4">
            {quizPost ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {quizPost.titulo} (PAUSE)
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {getEstadoBadge(quizPost.estado)}
                        {quizPost.tiempo_limite_minutos && (
                          <span className="ml-2 text-sm">
                            <Clock className="inline h-3 w-3 mr-1" />
                            {quizPost.tiempo_limite_minutos} minutos
                          </span>
                        )}
                        {quizPost.max_preguntas && (
                          <span className="ml-2 text-sm">
                            {quizPost.preguntas.length} preguntas
                          </span>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Preguntas
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>Preguntas del Quiz POST (PAUSE)</DialogTitle>
                            <DialogDescription>
                              {quizPost.preguntas.length} pregunta(s)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {quizPost.preguntas.map((preg: any, index: number) => (
                              <Card key={preg.id}>
                                <CardHeader>
                                  <div className="flex items-center justify-between">
                                    <CardTitle className="text-base">
                                      Pregunta {index + 1}
                                    </CardTitle>
                                    <Badge>{preg.tipo}</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent>
                                  <p className="mb-2">{preg.texto_pregunta}</p>
                                  {preg.justificacion && (
                                    <p className="text-sm text-muted-foreground">
                                      <strong>Retroalimentación:</strong> {preg.justificacion}
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                      {quizPost.estado === 'borrador' || quizPost.estado === 'aprobado' ? (
                        <Button
                          onClick={() => handleSendQuiz(quizPost.id, 'post')}
                          disabled={sendingQuiz === quizPost.id}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          {sendingQuiz === quizPost.id ? 'Enviando...' : 'Enviar a Alumnos'}
                        </Button>
                      ) : quizPost.estado === 'publicado' ? (
                        <div className="flex gap-2">
                          <Badge variant="default">
                            {quizPost.fecha_envio
                              ? `Enviado: ${new Date(quizPost.fecha_envio).toLocaleDateString('es-ES')}`
                              : 'Enviado'}
                          </Badge>
                          <Button
                            variant="outline"
                            onClick={() => handleCloseQuiz(quizPost.id, 'post')}
                            disabled={closingQuiz === quizPost.id}
                          >
                            <Lock className="mr-2 h-4 w-4" />
                            {closingQuiz === quizPost.id ? 'Cerrando...' : 'Cerrar Quiz'}
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary">
                          {quizPost.estado === 'cerrado' ? 'Cerrado' : 'Ya enviado'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {quizPost.instrucciones && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">{quizPost.instrucciones}</p>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>Total de preguntas: {quizPost.preguntas.length}</p>
                    {quizPost.fecha_envio && (
                      <p>
                        Fecha de envío: {new Date(quizPost.fecha_envio).toLocaleString('es-ES')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No hay quiz POST generado</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Genera el quiz post después de crear la versión final de la guía
                    </p>
                    <Button onClick={() => handleGenerateQuiz('post')}>
                      <Plus className="mr-2 h-4 w-4" />
                      Generar Quiz POST
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


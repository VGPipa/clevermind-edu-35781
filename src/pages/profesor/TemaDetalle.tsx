import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, BookOpen, Edit, Plus, Calendar, CheckCircle2, Clock, Users, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EditarGuiaTemaDialog } from "@/components/profesor/EditarGuiaTemaDialog";
import { ProgramarSesionDialog } from "@/components/profesor/ProgramarSesionDialog";
import { SesionCard } from "@/components/profesor/SesionCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TemaDetalle() {
  const { temaId } = useParams<{ temaId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showEditarGuia, setShowEditarGuia] = useState(false);
  const [showProgramarSesion, setShowProgramarSesion] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tema-detalle', temaId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-tema-detalle', {
        body: { tema_id: temaId, id: temaId },
      });
      if (error) throw error;
      return data;
    },
    enabled: !!temaId,
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar el tema</p>
          <Button onClick={() => navigate('/profesor/planificacion')} className="mt-4">
            Volver a Planificación
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { tema, guia_maestra, salones, progreso_general, tiene_guia_maestra, grupos_disponibles } = data;

  // Parse contenido si viene como string JSON
  let contenidoParseado = null;
  if (guia_maestra?.contenido) {
    try {
      contenidoParseado = typeof guia_maestra.contenido === 'string' 
        ? JSON.parse(guia_maestra.contenido) 
        : guia_maestra.contenido;
    } catch (e) {
      console.error('Error parseando contenido:', e);
      contenidoParseado = guia_maestra.contenido;
    }
  }

  const guiaMaestraConContenido = guia_maestra ? {
    ...guia_maestra,
    contenido: contenidoParseado || guia_maestra.contenido || {}
  } : null;

  // Debug temporal: verificar estructura de guía maestra
  if (guiaMaestraConContenido) {
    console.log('🔍 Guía maestra completa:', guiaMaestraConContenido);
    console.log('📦 Contenido:', guiaMaestraConContenido.contenido);
    console.log('📋 Estrategias:', guiaMaestraConContenido.contenido?.estrategias_evaluacion);
    console.log('🎯 Actividades:', guiaMaestraConContenido.contenido?.actividades_transversales);
    console.log('🏆 Competencias:', guiaMaestraConContenido.contenido?.competencias);
    console.log('👥 Contexto:', guiaMaestraConContenido.contexto_grupo);
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header con Breadcrumbs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profesor/planificacion')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-black dark:text-white">
                {tema.nombre}
              </h1>
              <p className="text-muted-foreground mt-1">
                {tema.materia.nombre} • {tema.materia.grado}° • Bimestre {tema.bimestre}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {tiene_guia_maestra && (
              <Button
                variant="outline"
                onClick={() => setShowEditarGuia(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar Guía
              </Button>
            )}
            {tiene_guia_maestra && (
              <Button onClick={() => setShowProgramarSesion(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Programar Sesión
              </Button>
            )}
          </div>
        </div>

        {/* Información del Tema */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Tema</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">Descripción</h3>
              <p className="text-sm text-muted-foreground">
                {tema.descripcion || 'Sin descripción'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Objetivos</h3>
              <p className="text-sm text-muted-foreground">
                {tema.objetivos || 'Sin objetivos definidos'}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Duración: {tema.duracion_estimada} semanas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progreso General */}
        {tiene_guia_maestra && (
          <Card>
            <CardHeader>
              <CardTitle>Progreso General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progreso del Tema</span>
                  <span className="font-medium">{progreso_general.porcentaje}%</span>
                </div>
                <Progress value={progreso_general.porcentaje} className="h-2" />
              </div>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {progreso_general.sesiones_completadas}
                  </div>
                  <p className="text-xs text-muted-foreground">Completadas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {progreso_general.sesiones_programadas}
                  </div>
                  <p className="text-xs text-muted-foreground">Programadas</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {progreso_general.sesiones_pendientes}
                  </div>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {progreso_general.total_sesiones}
                  </div>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs: Guía Maestra y Sesiones */}
        <Tabs defaultValue={tiene_guia_maestra ? "guia" : "sesiones"} className="w-full">
          <TabsList>
            {tiene_guia_maestra && <TabsTrigger value="guia">Guía Maestra</TabsTrigger>}
            <TabsTrigger value="sesiones">Sesiones</TabsTrigger>
          </TabsList>

          {tiene_guia_maestra && (
            <TabsContent value="guia" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Guía Maestra</CardTitle>
                  <CardDescription>
                    Objetivos, estructura de sesiones y recursos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-h-[80vh] overflow-y-auto">
                  {/* Objetivos Generales */}
                  {guiaMaestraConContenido?.objetivos_generales && (
                    <div>
                      <h3 className="font-semibold mb-2">Objetivos Generales</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {guiaMaestraConContenido.objetivos_generales}
                      </p>
                    </div>
                  )}

                  {/* Estructura de Sesiones */}
                  {guiaMaestraConContenido?.estructura_sesiones && Array.isArray(guiaMaestraConContenido.estructura_sesiones) && (
                    <div>
                      <h3 className="font-semibold mb-3">Estructura de Sesiones</h3>
                      <div className="space-y-2">
                        {guiaMaestraConContenido.estructura_sesiones.map((sesion: any, index: number) => (
                          <Card key={index} className="border-l-4 border-l-primary">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline">Sesión {sesion.numero}</Badge>
                                    <span className="font-medium">{sesion.titulo}</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {sesion.contenido_clave}
                                  </p>
                                  {sesion.duracion_sugerida && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Duración sugerida: {sesion.duracion_sugerida} minutos
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recursos */}
                  {guiaMaestraConContenido?.contenido?.recursos && Array.isArray(guiaMaestraConContenido.contenido.recursos) && guiaMaestraConContenido.contenido.recursos.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Recursos Recomendados</h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {guiaMaestraConContenido.contenido.recursos.map((recurso: string, i: number) => (
                          <li key={i}>{recurso}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Metodologías */}
                  {guiaMaestraConContenido?.metodologias && Array.isArray(guiaMaestraConContenido.metodologias) && guiaMaestraConContenido.metodologias.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Metodologías</h3>
                      <div className="flex flex-wrap gap-2">
                        {guiaMaestraConContenido.metodologias.map((metodologia: string, i: number) => (
                          <Badge key={i} variant="outline">{metodologia}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Estrategias de Evaluación */}
                  {guiaMaestraConContenido?.contenido?.estrategias_evaluacion && Array.isArray(guiaMaestraConContenido.contenido.estrategias_evaluacion) && guiaMaestraConContenido.contenido.estrategias_evaluacion.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Estrategias de Evaluación</h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {guiaMaestraConContenido.contenido.estrategias_evaluacion.map((estrategia: string, i: number) => (
                          <li key={i}>{estrategia}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Actividades Transversales */}
                  {guiaMaestraConContenido?.contenido?.actividades_transversales && Array.isArray(guiaMaestraConContenido.contenido.actividades_transversales) && guiaMaestraConContenido.contenido.actividades_transversales.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Actividades Transversales</h3>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        {guiaMaestraConContenido.contenido.actividades_transversales.map((actividad: string, i: number) => (
                          <li key={i}>{actividad}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Competencias */}
                  {guiaMaestraConContenido?.contenido?.competencias && Array.isArray(guiaMaestraConContenido.contenido.competencias) && guiaMaestraConContenido.contenido.competencias.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Competencias</h3>
                      <div className="flex flex-wrap gap-2">
                        {guiaMaestraConContenido.contenido.competencias.map((competencia: string, i: number) => (
                          <Badge key={i} variant="outline">{competencia}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contexto del Grupo */}
                  {guiaMaestraConContenido?.contexto_grupo && (
                    <div>
                      <h3 className="font-semibold mb-2">Contexto del Grupo</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {guiaMaestraConContenido.contexto_grupo}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="sesiones" className="space-y-4">
            {salones.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">
                    No hay sesiones programadas aún
                  </p>
                  {tiene_guia_maestra && (
                    <Button
                      className="mt-4"
                      onClick={() => setShowProgramarSesion(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Programar Primera Sesión
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              salones.map((salon: any) => (
                <Card key={salon.grupo.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {salon.grupo.nombre}
                        </CardTitle>
                        <CardDescription>
                          {salon.grupo.grado}° - Sección {salon.grupo.seccion}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {salon.progreso.porcentaje}% completado
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {salon.sesiones.map((sesion: any) => {
                        const navigateToGestion = () => {
                          if (sesion?.tiene_guia) {
                            navigate(`/profesor/editar-guia/${sesion.id}`);
                          } else {
                            navigate(`/profesor/generar-clase?clase=${sesion.id}`);
                          }
                        };

                        return (
                          <SesionCard
                            key={sesion.id}
                            sesion={sesion}
                            temaNombre={tema.nombre}
                            onVerDetalle={navigateToGestion}
                            onEditar={sesion.tiene_guia ? () => navigate(`/profesor/editar-guia/${sesion.id}`) : undefined}
                            onGestionarQuizzes={sesion.tiene_guia ? () => navigate(`/profesor/gestionar-quizzes/${sesion.id}`) : undefined}
                            onVerRetroalimentaciones={sesion.tiene_guia ? () => navigate(`/profesor/retroalimentaciones/${sesion.id}`) : undefined}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {tiene_guia_maestra && guia_maestra && (
        <>
          <EditarGuiaTemaDialog
            open={showEditarGuia}
            onOpenChange={setShowEditarGuia}
            guiaTema={guia_maestra}
            temaNombre={tema.nombre}
          />
          <ProgramarSesionDialog
            open={showProgramarSesion}
            onOpenChange={setShowProgramarSesion}
            temaId={tema.id}
            guiaTema={guia_maestra}
            gruposDisponibles={grupos_disponibles}
            onSuccess={() => {
              refetch();
              toast({
                title: "Sesión programada",
                description: "La sesión se ha programado exitosamente",
              });
            }}
          />
        </>
      )}
    </AppLayout>
  );
}


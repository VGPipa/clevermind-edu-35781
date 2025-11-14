import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ClaseData {
  id: string;
  fecha_programada: string;
  duracion_minutos: number;
  metodologia: string | null;
  contexto: string | null;
  grupo_edad: string | null;
  temas: {
    id: string;
    nombre: string;
    id_materia: string;
  };
  grupos: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
    cantidad_alumnos: number;
  };
  materia_nombre: string;
}

interface GuiaData {
  id: string;
  id_clase: string;
  contenido: any;
  objetivos: string | null;
  estructura: any;
  preguntas_socraticas: any;
  recursos: any;
  fecha_generacion: string;
  updated_at: string;
  generada_ia: boolean;
}

export default function VerGuiaClase() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();

  const { data: clase, isLoading: claseLoading } = useQuery<ClaseData>({
    queryKey: ['clase', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('clases')
        .select(`
          id,
          fecha_programada,
          duracion_minutos,
          metodologia,
          contexto,
          grupo_edad,
          temas!inner(id, nombre, id_materia),
          grupos!inner(id, nombre, grado, seccion, cantidad_alumnos)
        `)
        .eq('id', claseId!)
        .single();
      if (error) throw error;
      if (!data) throw new Error('Clase no encontrada');

      // Get materia name
      const { data: materia } = await (supabase as any)
        .from('materias')
        .select('nombre')
        .eq('id', data.temas[0].id_materia)
        .single();

      return {
        ...data,
        temas: data.temas[0],
        grupos: data.grupos[0],
        materia_nombre: materia?.nombre || 'Sin materia',
      } as ClaseData;
    },
    enabled: !!claseId
  });

  const { data: guia, isLoading: guiaLoading } = useQuery<GuiaData>({
    queryKey: ['guia-clase', claseId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('guias_clase')
        .select('*')
        .eq('id_clase', claseId!)
        .single();
      if (error) throw error;
      return data as GuiaData;
    },
    enabled: !!claseId
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  if (claseLoading || guiaLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (!clase || !guia) {
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

  const contenido = guia.contenido as any;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => navigate('/profesor/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
            <h1 className="text-4xl font-bold">Guía de Clase</h1>
            <p className="text-muted-foreground mt-2">
              {clase.materia_nombre} - {clase.temas.nombre}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Ver Evaluaciones
            </Button>
          </div>
        </div>

        {/* Información de la clase */}
        <Card>
          <CardHeader>
            <CardTitle>Información General</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grupo</p>
              <p className="text-lg">{clase.grupos.grado} {clase.grupos.seccion}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha</p>
              <p className="text-lg">{formatDate(clase.fecha_programada)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Duración</p>
              <p className="text-lg">{clase.duracion_minutos} minutos</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estudiantes</p>
              <p className="text-lg">{clase.grupos.cantidad_alumnos}</p>
            </div>
          </CardContent>
        </Card>

        {/* Metodología y Contexto */}
        {(clase.metodologia || clase.contexto) && (
          <Card>
            <CardHeader>
              <CardTitle>Metodología y Contexto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clase.metodologia && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Metodología</p>
                  <p>{clase.metodologia}</p>
                </div>
              )}
              {clase.contexto && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Contexto Específico</p>
                  <p className="text-sm">{clase.contexto}</p>
                </div>
              )}
              {clase.grupo_edad && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Grupo de Edad</p>
                  <p>{clase.grupo_edad} años</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Objetivos */}
        {contenido?.objetivos && (
          <Card>
            <CardHeader>
              <CardTitle>Objetivos de Aprendizaje</CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(contenido.objetivos) ? (
                <ul className="list-disc list-inside space-y-2">
                  {contenido.objetivos.map((obj: string, index: number) => (
                    <li key={index} className="text-sm">{obj}</li>
                  ))}
                </ul>
              ) : (
                <p className="whitespace-pre-wrap">{contenido.objetivos}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estructura de la clase */}
        {contenido?.estructura && (
          <Card>
            <CardHeader>
              <CardTitle>Estructura de la Clase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contenido.estructura.map((actividad: any, index: number) => (
                  <div key={index} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 w-20 text-center">
                      <p className="text-sm font-medium text-muted-foreground">Tiempo</p>
                      <p className="text-lg font-bold text-primary">{actividad.time || actividad.duracion}'</p>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">
                        {actividad.activity || actividad.fase || actividad.etapa}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {actividad.description || actividad.descripcion || actividad.actividades}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preguntas Socráticas */}
        {contenido?.preguntas_socraticas && contenido.preguntas_socraticas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preguntas Socráticas Sugeridas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {contenido.preguntas_socraticas.map((pregunta: string, index: number) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-semibold text-primary flex-shrink-0">{index + 1}.</span>
                    <span className="text-sm">{pregunta}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recursos */}
        {contenido?.recursos && Object.keys(contenido.recursos).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recursos Necesarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(contenido.recursos).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium text-sm capitalize">{key}:</span>
                    <span className="text-sm text-muted-foreground">
                      {Array.isArray(value) ? value.join(', ') : value}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

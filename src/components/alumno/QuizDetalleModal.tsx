import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { formatPeruDateTime } from "@/lib/timezone";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import type { QuizData } from "@/hooks/use-mis-clases-alumno";

interface PreguntaDetalle {
  id: string;
  texto_pregunta: string;
  tipo: string;
  opciones: any;
  respuesta_correcta: string;
  justificacion: string | null;
  respuesta_alumno: string | null;
  es_correcta: boolean | null;
  tiempo_segundos: number | null;
}

interface QuizDetalleModalProps {
  quiz: QuizData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuizDetalleModal({ quiz, open, onOpenChange }: QuizDetalleModalProps) {
  const [preguntas, setPreguntas] = useState<PreguntaDetalle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!quiz || !open) return;

    const cargarDetalles = async () => {
      setLoading(true);
      try {
        // Obtener preguntas del quiz
        const { data: preguntasData, error: preguntasError } = await supabase
          .from("preguntas")
          .select("*")
          .eq("id_quiz", quiz.id)
          .order("orden", { ascending: true });

        if (preguntasError) {
          console.error("Error obteniendo preguntas:", preguntasError);
          setLoading(false);
          return;
        }

        // Obtener respuestas detalle del alumno
        const respuestaId = quiz.respuesta_alumno?.id;
        if (!respuestaId) {
          setPreguntas(
            (preguntasData || []).map((p: any) => ({
              id: p.id,
              texto_pregunta: p.texto_pregunta,
              tipo: p.tipo,
              opciones: p.opciones,
              respuesta_correcta: p.respuesta_correcta,
              justificacion: p.justificacion,
              respuesta_alumno: null,
              es_correcta: null,
              tiempo_segundos: null,
            }))
          );
          setLoading(false);
          return;
        }

        const { data: respuestasDetalle, error: respuestasError } = await supabase
          .from("respuestas_detalle")
          .select("*")
          .eq("id_respuesta_alumno", respuestaId);

        if (respuestasError) {
          console.error("Error obteniendo respuestas detalle:", respuestasError);
        }

        // Combinar preguntas con respuestas
        const preguntasConRespuestas = (preguntasData || []).map((pregunta: any) => {
          const respuestaDetalle = (respuestasDetalle || []).find(
            (rd: any) => rd.id_pregunta === pregunta.id
          );

          return {
            id: pregunta.id,
            texto_pregunta: pregunta.texto_pregunta,
            tipo: pregunta.tipo,
            opciones: pregunta.opciones,
            respuesta_correcta: pregunta.respuesta_correcta,
            justificacion: pregunta.justificacion,
            respuesta_alumno: respuestaDetalle?.respuesta_alumno || null,
            es_correcta: respuestaDetalle?.es_correcta || null,
            tiempo_segundos: respuestaDetalle?.tiempo_segundos || null,
          };
        });

        setPreguntas(preguntasConRespuestas);
      } catch (error) {
        console.error("Error cargando detalles del quiz:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDetalles();
  }, [quiz, open]);

  if (!quiz) return null;

  const nota = quiz.respuesta_alumno?.calificacion?.nota_numerica;
  const porcentaje = quiz.respuesta_alumno?.calificacion?.porcentaje_aciertos;
  const correctas = preguntas.filter((p) => p.es_correcta === true).length;
  const total = preguntas.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{quiz.titulo}</DialogTitle>
          <DialogDescription>
            {quiz.clase.tema.materia.nombre} - {quiz.clase.tema.nombre}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">Cargando detalles...</div>
        ) : (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Resumen */}
              {nota !== null && nota !== undefined && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Nota Final</span>
                    <Badge className="text-lg px-3 py-1">{nota.toFixed(1)}</Badge>
                  </div>
                  {porcentaje !== null && porcentaje !== undefined && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Porcentaje de Aciertos</span>
                      <span>{porcentaje.toFixed(1)}%</span>
                    </div>
                  )}
                  {total > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Respuestas Correctas</span>
                      <span>
                        {correctas} de {total}
                      </span>
                    </div>
                  )}
                  {quiz.respuesta_alumno?.fecha_envio && (
                    <div className="text-xs text-muted-foreground">
                      Completado: {formatPeruDateTime(quiz.respuesta_alumno.fecha_envio)}
                    </div>
                  )}
                </div>
              )}

              {/* Preguntas */}
              <div className="space-y-4">
                <h3 className="font-semibold">Desglose por Pregunta</h3>
                {preguntas.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No hay preguntas disponibles
                  </div>
                ) : (
                  preguntas.map((pregunta, index) => (
                    <div
                      key={pregunta.id}
                      className="p-4 rounded-lg border space-y-3"
                      style={{
                        borderColor:
                          pregunta.es_correcta === true
                            ? "rgb(34 197 94)"
                            : pregunta.es_correcta === false
                              ? "rgb(239 68 68)"
                              : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm text-muted-foreground">
                              Pregunta {index + 1}
                            </span>
                            {pregunta.es_correcta === true && (
                              <Badge className="bg-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Correcta
                              </Badge>
                            )}
                            {pregunta.es_correcta === false && (
                              <Badge variant="destructive">
                                <XCircle className="h-3 w-3 mr-1" />
                                Incorrecta
                              </Badge>
                            )}
                            {pregunta.tiempo_segundos && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {pregunta.tiempo_segundos}s
                              </Badge>
                            )}
                          </div>
                          <p className="font-medium">{pregunta.texto_pregunta}</p>
                        </div>
                      </div>

                      {pregunta.opciones && (
                        <div className="space-y-1 text-sm">
                          {Object.entries(pregunta.opciones as Record<string, string>).map(
                            ([key, value]) => (
                              <div
                                key={key}
                                className={`p-2 rounded ${
                                  key === pregunta.respuesta_correcta
                                    ? "bg-green-100 border border-green-300"
                                    : key === pregunta.respuesta_alumno
                                      ? "bg-red-100 border border-red-300"
                                      : "bg-muted/50"
                                }`}
                              >
                                <span className="font-medium">{key}:</span> {value}
                                {key === pregunta.respuesta_correcta && (
                                  <Badge className="ml-2 bg-green-600">Correcta</Badge>
                                )}
                                {key === pregunta.respuesta_alumno &&
                                  key !== pregunta.respuesta_correcta && (
                                    <Badge variant="destructive" className="ml-2">
                                      Tu respuesta
                                    </Badge>
                                  )}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      {pregunta.respuesta_alumno && (
                        <div className="text-sm">
                          <span className="font-medium">Tu respuesta: </span>
                          <span>{pregunta.respuesta_alumno}</span>
                        </div>
                      )}

                      {pregunta.justificacion && (
                        <div className="p-2 rounded bg-blue-50 border border-blue-200 text-sm">
                          <span className="font-medium">Justificación: </span>
                          {pregunta.justificacion}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}


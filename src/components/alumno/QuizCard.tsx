import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Target, Play, Eye } from "lucide-react";
import { formatPeruDateTime } from "@/lib/timezone";
import type { QuizData } from "@/hooks/use-mis-clases-alumno";

interface QuizCardProps {
  quiz: QuizData;
  onComenzar?: () => void;
  onVerResultados?: () => void;
  onVerDetalle?: () => void;
}

export function QuizCard({ quiz, onComenzar, onVerResultados, onVerDetalle }: QuizCardProps) {
  const estaCompletado = quiz.respuesta_alumno?.estado === "completado";
  const estaEnProgreso = quiz.respuesta_alumno?.estado === "en_progreso";
  const estaDisponible = quiz.estado === "publicado" && !estaCompletado && !estaEnProgreso;

  const tipoTexto = quiz.tipo_evaluacion === "evaluacion" ? "Evaluación" : "Quiz";
  const tipoBadge = quiz.tipo_evaluacion === "evaluacion" ? "destructive" : "secondary";

  return (
    <Card className={estaCompletado ? "opacity-75" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{quiz.titulo}</CardTitle>
              {estaCompletado && <CheckCircle2 className="h-4 w-4 text-success" />}
            </div>
            <CardDescription>{quiz.clase.tema.materia.nombre}</CardDescription>
          </div>
          <Badge variant={tipoBadge}>{tipoTexto}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {estaCompletado && quiz.respuesta_alumno?.calificacion ? (
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nota obtenida</span>
              <Badge className="bg-success text-success-foreground">
                ⭐ {quiz.respuesta_alumno.calificacion.nota_numerica?.toFixed(1) || "N/A"}
              </Badge>
            </div>
            {quiz.respuesta_alumno.calificacion.porcentaje_aciertos !== null && (
              <div className="mt-2 text-xs text-muted-foreground">
                Aciertos: {quiz.respuesta_alumno.calificacion.porcentaje_aciertos.toFixed(1)}%
              </div>
            )}
            {quiz.respuesta_alumno.fecha_envio && (
              <div className="mt-1 text-xs text-muted-foreground">
                Completado: {formatPeruDateTime(quiz.respuesta_alumno.fecha_envio)}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {quiz.preguntas_count > 0 && (
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {quiz.preguntas_count} preguntas
                </div>
              )}
              {quiz.tiempo_limite && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {quiz.tiempo_limite} min
                </div>
              )}
            </div>

            {quiz.fecha_limite && (
              <div className="p-2 rounded bg-muted/50 text-xs text-center">
                <span className="text-muted-foreground">Disponible hasta: </span>
                <span className="font-medium">{formatPeruDateTime(quiz.fecha_limite)}</span>
              </div>
            )}

            {estaEnProgreso && (
              <div className="p-2 rounded bg-blue-50 border border-blue-200 text-xs text-center">
                <span className="text-blue-700">En progreso</span>
              </div>
            )}

            <div className="flex gap-2">
              {estaDisponible && onComenzar && (
                <Button className="flex-1 bg-gradient-primary" size="sm" onClick={onComenzar}>
                  <Play className="mr-2 h-3 w-3" />
                  Comenzar Quiz
                </Button>
              )}
              {estaCompletado && onVerResultados && (
                <Button className="flex-1" variant="outline" size="sm" onClick={onVerResultados}>
                  <Eye className="mr-2 h-3 w-3" />
                  Ver Resultados
                </Button>
              )}
              {onVerDetalle && (
                <Button variant="ghost" size="sm" onClick={onVerDetalle}>
                  Detalles
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}


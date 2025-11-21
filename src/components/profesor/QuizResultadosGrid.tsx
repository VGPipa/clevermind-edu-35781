import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText } from "lucide-react";
import { formatPeruDateTime } from "@/lib/timezone";
import type { QuizConResultados } from "@/hooks/use-mis-clases-profesor";

interface QuizResultadosGridProps {
  quizzes: QuizConResultados[];
  onVerDetalle?: (quizId: string) => void;
}

export function QuizResultadosGrid({ quizzes, onVerDetalle }: QuizResultadosGridProps) {
  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay quizzes disponibles
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <Card key={quiz.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">{quiz.titulo}</CardTitle>
                <CardDescription>
                  {quiz.clase.tema.materia.nombre} • {quiz.clase.grupo.nombre}
                </CardDescription>
              </div>
              <Badge variant={quiz.tipo === "previo" ? "secondary" : "default"}>
                {quiz.tipo === "previo" ? "Pre" : "Post"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Promedio:</span>
                <span className="font-medium">
                  {quiz.estadisticas.promedio !== null
                    ? quiz.estadisticas.promedio.toFixed(1)
                    : "-"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completación:</span>
                <span className="font-medium">
                  {Math.round(quiz.estadisticas.tasa_completacion)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Preguntas:</span>
                <span className="font-medium">{quiz.estadisticas.total_preguntas}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Alumnos:</span>
                <span className="font-medium">{quiz.resultados_alumnos.length}</span>
              </div>
            </div>

            {quiz.fecha_limite && (
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Límite: {formatPeruDateTime(quiz.fecha_limite)}
              </div>
            )}

            {onVerDetalle && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => onVerDetalle(quiz.id)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Detalle
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


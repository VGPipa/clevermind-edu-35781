import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Calendar } from "lucide-react";
import { formatPeruDateTime } from "@/lib/timezone";
import type { MateriaData } from "@/hooks/use-mis-clases-alumno";

interface MateriaCardProps {
  materia: MateriaData;
  onClick?: () => void;
}

export function MateriaCard({ materia, onClick }: MateriaCardProps) {
  const profesorNombre = materia.profesor
    ? `${materia.profesor.nombre || ""} ${materia.profesor.apellido || ""}`.trim()
    : "Sin asignar";

  const proximaClaseTexto = materia.proxima_clase
    ? formatPeruDateTime(materia.proxima_clase.fecha_programada || "")
    : "Sin programar";

  return (
    <Card
      className="hover:shadow-elegant transition-all hover:-translate-y-1 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{materia.nombre}</CardTitle>
            <CardDescription className="text-xs mt-1">{profesorNombre}</CardDescription>
          </div>
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{materia.progreso}%</span>
          </div>
          <Progress value={materia.progreso} className="h-1.5" />
        </div>

        {materia.promedio_nota !== null && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Promedio</span>
            <span className="font-medium">{materia.promedio_nota.toFixed(1)}</span>
          </div>
        )}

        {materia.quizzes_pendientes > 0 && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Quizzes pendientes</span>
            <span className="font-medium text-orange-600">{materia.quizzes_pendientes}</span>
          </div>
        )}

        <div className="pt-2 space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3 text-primary" />
            <span className="font-medium">{proximaClaseTexto}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


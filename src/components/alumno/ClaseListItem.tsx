import { Badge } from "@/components/ui/badge";
import { formatPeruDateTime } from "@/lib/timezone";
import { Calendar, CheckCircle2, Clock, FileText } from "lucide-react";
import type { ClaseData } from "@/hooks/use-mis-clases-alumno";

interface ClaseListItemProps {
  clase: ClaseData;
  onVerDetalle?: () => void;
  onVerRetroalimentaciones?: () => void;
}

export function ClaseListItem({
  clase,
  onVerDetalle,
  onVerRetroalimentaciones,
}: ClaseListItemProps) {
  const fecha = clase.fecha_ejecutada || clase.fecha_programada;
  const fechaTexto = fecha ? formatPeruDateTime(fecha) : "Sin fecha";
  const esHoy = fecha
    ? new Date(fecha).toDateString() === new Date().toDateString()
    : false;
  const esPasada = clase.fecha_ejecutada || (fecha && new Date(fecha) < new Date());

  const estadoBadgeVariant =
    clase.estado === "completada" || clase.estado === "ejecutada"
      ? "default"
      : clase.estado === "programada" || clase.estado === "clase_programada"
        ? "secondary"
        : "outline";

  const profesorNombre = clase.profesor
    ? `${clase.profesor.nombre || ""} ${clase.profesor.apellido || ""}`.trim()
    : "";

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/50 hover:bg-accent/10 transition-colors">
      <div className="mt-1">
        <Badge variant={esHoy ? "default" : "outline"} className="mb-1">
          {esHoy ? "Hoy" : esPasada ? "Pasada" : fechaTexto}
        </Badge>
        {clase.numero_sesion && (
          <div className="text-xs font-medium text-muted-foreground mt-1">
            Sesión {clase.numero_sesion}
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-medium">{clase.tema.materia.nombre}</h3>
          <Badge variant={estadoBadgeVariant}>{clase.estado || "Sin estado"}</Badge>
        </div>
        {profesorNombre && (
          <p className="text-sm text-muted-foreground mb-1">{profesorNombre}</p>
        )}
        <p className="text-sm mb-2">📚 {clase.tema.nombre}</p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
          {clase.quiz_pre && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>
                Quiz Pre:{" "}
                {clase.quiz_pre.estado === "publicado" ? (
                  <span className="text-blue-600">Disponible</span>
                ) : (
                  <span>{clase.quiz_pre.estado || "No disponible"}</span>
                )}
              </span>
            </div>
          )}
          {clase.quiz_post && (
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>
                Quiz Post:{" "}
                {clase.quiz_post.estado === "publicado" ? (
                  <span className="text-blue-600">Disponible</span>
                ) : clase.resultado_quiz_post ? (
                  <span className="text-green-600">
                    {clase.resultado_quiz_post.nota?.toFixed(1) || "Completado"}
                  </span>
                ) : (
                  <span>{clase.quiz_post.estado || "No disponible"}</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onVerDetalle && (
            <button
              onClick={onVerDetalle}
              className="text-xs text-primary hover:underline"
            >
              Ver detalles
            </button>
          )}
          {clase.tiene_retroalimentaciones && onVerRetroalimentaciones && (
            <button
              onClick={onVerRetroalimentaciones}
              className="text-xs text-secondary hover:underline"
            >
              Ver retroalimentaciones
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { AlumnoResultado } from "@/hooks/use-mis-clases-profesor";

interface AlumnoResultadoRowProps {
  alumno: AlumnoResultado;
  onVerDetalle?: () => void;
  onGenerarRetro?: () => void;
}

export function AlumnoResultadoRow({
  alumno,
  onVerDetalle,
  onGenerarRetro,
}: AlumnoResultadoRowProps) {
  const tieneAlertas =
    alumno.alertas?.bajoRendimiento ||
    alumno.alertas?.noCompleto ||
    alumno.alertas?.bajaParticipacion;

  return (
    <TableRow>
      <TableCell className="font-medium">
        {alumno.nombre} {alumno.apellido}
      </TableCell>
      <TableCell>
        {alumno.nota_quiz_pre !== null ? (
          <span className="text-sm">{alumno.nota_quiz_pre.toFixed(1)}</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {alumno.nota_quiz_post !== null ? (
          <Badge
            variant={
              alumno.nota_quiz_post >= 11
                ? "default"
                : alumno.nota_quiz_post >= 6
                  ? "secondary"
                  : "destructive"
            }
          >
            {alumno.nota_quiz_post.toFixed(1)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {alumno.porcentaje_aciertos_post !== null ? (
          <span className="text-sm">{alumno.porcentaje_aciertos_post.toFixed(1)}%</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {alumno.estado_quiz_post === "completado" ? (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        ) : (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pendiente
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {alumno.tiempo_promedio !== null ? (
          <span className="text-sm">{Math.round(alumno.tiempo_promedio)}s</span>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>
      <TableCell>
        {tieneAlertas && (
          <div className="flex gap-1">
            {alumno.alertas?.bajoRendimiento && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Bajo rendimiento
              </Badge>
            )}
            {alumno.alertas?.noCompleto && (
              <Badge variant="outline" className="text-xs">
                No completó
              </Badge>
            )}
          </div>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {onVerDetalle && (
            <button
              onClick={onVerDetalle}
              className="text-xs text-primary hover:underline"
            >
              Ver detalle
            </button>
          )}
          {onGenerarRetro && (
            <button
              onClick={onGenerarRetro}
              className="text-xs text-secondary hover:underline"
            >
              Retroalimentación
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, TrendingDown } from "lucide-react";
import type { AlumnoAtencion } from "@/hooks/use-mis-clases-profesor";

interface AlumnosAtencionTableProps {
  alumnos: AlumnoAtencion[];
}

export function AlumnosAtencionTable({ alumnos }: AlumnosAtencionTableProps) {
  if (alumnos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay alumnos que necesiten atención en este momento
      </div>
    );
  }

  const getTipoAlertaBadge = (tipo: string) => {
    switch (tipo) {
      case "bajo_rendimiento":
        return (
          <Badge variant="destructive">
            <TrendingDown className="h-3 w-3 mr-1" />
            Bajo Rendimiento
          </Badge>
        );
      case "quizzes_pendientes":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Quizzes Pendientes
          </Badge>
        );
      case "baja_participacion":
        return (
          <Badge variant="secondary">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Baja Participación
          </Badge>
        );
      default:
        return <Badge variant="outline">{tipo}</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alumno</TableHead>
            <TableHead>Grupo</TableHead>
            <TableHead>Materia</TableHead>
            <TableHead>Promedio</TableHead>
            <TableHead>Quizzes Pendientes</TableHead>
            <TableHead>Tipo de Alerta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alumnos.map((alumno) => (
            <TableRow key={`${alumno.id}-${alumno.materia.id}`}>
              <TableCell className="font-medium">
                {alumno.nombre} {alumno.apellido}
              </TableCell>
              <TableCell>{alumno.grupo.nombre}</TableCell>
              <TableCell>{alumno.materia.nombre}</TableCell>
              <TableCell>
                {alumno.promedio_nota !== null ? (
                  <Badge
                    variant={
                      alumno.promedio_nota >= 11
                        ? "default"
                        : alumno.promedio_nota >= 6
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {alumno.promedio_nota.toFixed(1)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {alumno.quizzes_pendientes > 0 ? (
                  <Badge variant="outline">{alumno.quizzes_pendientes}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell>{getTipoAlertaBadge(alumno.tipo_alerta)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


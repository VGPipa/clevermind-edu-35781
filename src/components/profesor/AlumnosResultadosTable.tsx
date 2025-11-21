import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Eye, MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AlumnoResultado {
  id: string;
  nombre: string;
  apellido: string;
  grado?: string | null;
  seccion?: string | null;
  promedio_nota?: number | null;
  promedio_aciertos?: number | null;
  quizzes_completados?: number;
  quizzes_pendientes?: number;
  alertas?: {
    bajoRendimiento?: boolean;
    pocaParticipacion?: boolean;
  };
  ultima_retroalimentacion?: {
    tipo: string;
    resumen?: string;
    fecha?: string;
  } | null;
}

interface AlumnosResultadosTableProps {
  alumnos: AlumnoResultado[];
  grupoNombre?: string;
  onVerDetalle?: (alumnoId: string) => void;
  onGenerarRetro?: (alumnoId: string) => void;
}

export function AlumnosResultadosTable({
  alumnos,
  grupoNombre,
  onVerDetalle,
  onGenerarRetro,
}: AlumnosResultadosTableProps) {
  if (alumnos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resultados de Alumnos</CardTitle>
          <CardDescription>
            {grupoNombre ? `Alumnos del grupo ${grupoNombre}` : "Alumnos del salón"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de alumnos disponibles aún
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resultados de Alumnos</CardTitle>
        <CardDescription>
          {grupoNombre ? `Alumnos del grupo ${grupoNombre}` : "Alumnos del salón"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alumno</TableHead>
                <TableHead>Prom. Nota</TableHead>
                <TableHead>Prom. Aciertos</TableHead>
                <TableHead>Quizzes</TableHead>
                <TableHead>Alertas</TableHead>
                <TableHead>Última Retro</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alumnos.map((alumno) => {
                const alertas: string[] = [];
                if (alumno.alertas?.bajoRendimiento) alertas.push("Bajo rendimiento");
                if (alumno.alertas?.pocaParticipacion) alertas.push("Baja participación");

                const totalQuizzes = (alumno.quizzes_completados ?? 0) + (alumno.quizzes_pendientes ?? 0);

                return (
                  <TableRow key={alumno.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {alumno.nombre} {alumno.apellido}
                        </span>
                        {(alumno.grado || alumno.seccion) && (
                          <span className="text-xs text-muted-foreground">
                            {alumno.grado ?? ""}° {alumno.seccion ?? ""}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {typeof alumno.promedio_nota === "number" ? (
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
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof alumno.promedio_aciertos === "number" ? (
                        <span>{alumno.promedio_aciertos.toFixed(0)}%</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {alumno.quizzes_completados ?? 0}/{totalQuizzes}
                        </span>
                        {alumno.quizzes_pendientes && alumno.quizzes_pendientes > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {alumno.quizzes_pendientes} pendientes
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {alertas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {alertas.map((alerta) => (
                            <Badge key={alerta} variant="destructive" className="text-[11px]">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {alerta}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[11px]">
                          Sin alertas
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {alumno.ultima_retroalimentacion ? (
                        <div className="flex flex-col">
                          <span className="text-xs capitalize">
                            {alumno.ultima_retroalimentacion.tipo.replace("_", " ")}
                          </span>
                          {alumno.ultima_retroalimentacion.fecha && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(alumno.ultima_retroalimentacion.fecha).toLocaleDateString(
                                "es-ES",
                                {
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onVerDetalle && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onVerDetalle(alumno.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {onGenerarRetro && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onGenerarRetro(alumno.id)}
                            className="h-8 w-8 p-0"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  FileText,
  MessageSquare,
  Lightbulb,
  Download,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatPeruDateTime } from "@/lib/timezone";
import { MetricasClase } from "./MetricasClase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlumnoResultadoRow } from "./AlumnoResultadoRow";
import type { ClaseConResultados } from "@/hooks/use-mis-clases-profesor";

interface ClaseResultadosCardProps {
  clase: ClaseConResultados;
  onVerGuia?: () => void;
  onGestionarQuizzes?: () => void;
  onVerRetroalimentaciones?: () => void;
  onVerRecomendaciones?: () => void;
  onExportar?: () => void;
}

export function ClaseResultadosCard({
  clase,
  onVerGuia,
  onGestionarQuizzes,
  onVerRetroalimentaciones,
  onVerRecomendaciones,
  onExportar,
}: ClaseResultadosCardProps) {
  const [expanded, setExpanded] = useState(false);

  const estadoBadgeVariant =
    clase.estado === "completada" || clase.estado === "ejecutada"
      ? "default"
      : clase.estado === "programada" || clase.estado === "clase_programada"
        ? "secondary"
        : "outline";

  const fecha = clase.fecha_ejecutada || clase.fecha_programada;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{clase.tema.nombre}</CardTitle>
              <Badge variant={estadoBadgeVariant}>{clase.estado || "Sin estado"}</Badge>
            </div>
            <CardDescription>
              {clase.tema.materia.nombre} • {clase.grupo.nombre} ({clase.grupo.grado}°{" "}
              {clase.grupo.seccion})
            </CardDescription>
            {clase.numero_sesion && (
              <div className="text-sm text-muted-foreground mt-1">
                Sesión {clase.numero_sesion}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="ml-2"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          {fecha && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatPeruDateTime(fecha)}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {clase.metricas?.total_alumnos || 0} alumnos
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-6">
          {/* Métricas agregadas */}
          {clase.metricas && <MetricasClase metricas={clase.metricas} />}

          {/* Resultados por alumno */}
          {clase.resultados_alumnos.length > 0 ? (
            <div>
              <h4 className="font-semibold mb-4">Resultados por Alumno</h4>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alumno</TableHead>
                      <TableHead>Quiz Pre</TableHead>
                      <TableHead>Quiz Post</TableHead>
                      <TableHead>Aciertos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Tiempo</TableHead>
                      <TableHead>Alertas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clase.resultados_alumnos.map((alumno) => (
                      <AlumnoResultadoRow
                        key={alumno.id}
                        alumno={alumno}
                        onVerDetalle={() => {
                          console.log("Ver detalle alumno:", alumno.id);
                        }}
                        onGenerarRetro={() => {
                          console.log("Generar retroalimentación:", alumno.id);
                        }}
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay resultados de alumnos disponibles aún
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {onVerGuia && (
              <Button variant="outline" size="sm" onClick={onVerGuia}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Guía
              </Button>
            )}
            {onGestionarQuizzes && (
              <Button variant="outline" size="sm" onClick={onGestionarQuizzes}>
                Gestionar Quizzes
              </Button>
            )}
            {clase.tiene_retroalimentaciones && onVerRetroalimentaciones && (
              <Button variant="outline" size="sm" onClick={onVerRetroalimentaciones}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Ver Retroalimentaciones
              </Button>
            )}
            {clase.tiene_recomendaciones && onVerRecomendaciones && (
              <Button variant="outline" size="sm" onClick={onVerRecomendaciones}>
                <Lightbulb className="h-4 w-4 mr-2" />
                Ver Recomendaciones
              </Button>
            )}
            {onExportar && (
              <Button variant="outline" size="sm" onClick={onExportar}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { ResultadoMateria } from "@/hooks/use-mis-clases-alumno";

interface ResultadosTableProps {
  resultados: ResultadoMateria[];
}

export function ResultadosTable({ resultados }: ResultadosTableProps) {
  if (resultados.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay resultados disponibles aún
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Materia</TableHead>
            <TableHead>Promedio</TableHead>
            <TableHead>Quizzes Completados</TableHead>
            <TableHead>Última Calificación</TableHead>
            <TableHead>Tendencia</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultados.map((resultado) => (
            <TableRow key={resultado.materia_id}>
              <TableCell className="font-medium">{resultado.materia_nombre}</TableCell>
              <TableCell>
                {resultado.promedio_nota !== null ? (
                  <span className="font-medium">{resultado.promedio_nota.toFixed(1)}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>{resultado.quizzes_completados}</TableCell>
              <TableCell>
                {resultado.ultima_calificacion !== null ? (
                  <Badge variant="outline">{resultado.ultima_calificacion.toFixed(1)}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {resultado.tendencia === "up" && (
                  <Badge variant="default" className="bg-green-600">
                    <ArrowUp className="h-3 w-3 mr-1" />
                    Mejorando
                  </Badge>
                )}
                {resultado.tendencia === "down" && (
                  <Badge variant="destructive">
                    <ArrowDown className="h-3 w-3 mr-1" />
                    Bajando
                  </Badge>
                )}
                {resultado.tendencia === "stable" && (
                  <Badge variant="secondary">
                    <Minus className="h-3 w-3 mr-1" />
                    Estable
                  </Badge>
                )}
                {resultado.tendencia === null && (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}


import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, FileText } from "lucide-react";

interface Tema {
  id: string;
  nombre: string;
  descripcion: string | null;
  objetivos: string | null;
  duracion_estimada: number | null;
  bimestre: number | null;
  orden: number | null;
}

interface TemasTableProps {
  temas: Tema[];
  bimestre?: number;
}

export function TemasTable({ temas, bimestre }: TemasTableProps) {
  const temasFiltrados = bimestre 
    ? temas.filter(t => t.bimestre === bimestre)
    : temas;

  if (temasFiltrados.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>No hay temas {bimestre ? `para el bimestre ${bimestre}` : 'configurados'}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Orden</TableHead>
            <TableHead>Nombre del Tema</TableHead>
            <TableHead>Bimestre</TableHead>
            <TableHead>Duración</TableHead>
            <TableHead>Objetivos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {temasFiltrados.map((tema) => (
            <TableRow key={tema.id}>
              <TableCell className="font-medium w-20">
                <Badge variant="outline">{tema.orden || '-'}</Badge>
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{tema.nombre}</div>
                  {tema.descripcion && (
                    <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {tema.descripcion}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="default">
                  Bimestre {tema.bimestre || '-'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {tema.duracion_estimada ? `${tema.duracion_estimada}h` : '-'}
                </div>
              </TableCell>
              <TableCell>
                {tema.objetivos ? (
                  <div className="flex items-start gap-1 text-sm">
                    <Target className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{tema.objetivos}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

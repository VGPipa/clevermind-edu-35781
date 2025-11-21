import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetricasClase } from "./MetricasClase";
import { DistribucionNotasChart } from "./DistribucionNotasChart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlumnoResultadoRow } from "./AlumnoResultadoRow";
import type { ClaseConResultados } from "@/hooks/use-mis-clases-profesor";

interface DetalleClaseModalProps {
  clase: ClaseConResultados | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetalleClaseModal({ clase, open, onOpenChange }: DetalleClaseModalProps) {
  if (!clase) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{clase.tema.nombre}</DialogTitle>
          <DialogDescription>
            {clase.tema.materia.nombre} • {clase.grupo.nombre} • Sesión {clase.numero_sesion || "N/A"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] pr-4">
          <div className="space-y-6">
            {/* Métricas */}
            {clase.metricas && <MetricasClase metricas={clase.metricas} />}

            {/* Gráfico de distribución */}
            <DistribucionNotasChart clase={clase} />

            {/* Tabla completa de resultados */}
            <div>
              <h3 className="font-semibold mb-4">Resultados Completos por Alumno</h3>
              <div className="rounded-md border">
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
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


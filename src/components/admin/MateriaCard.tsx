import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Clock, Users, CheckCircle2, AlertCircle, ChevronDown, Edit, Trash2, Copy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MateriaCardProps {
  materia: {
    id: string;
    nombre: string;
    descripcion: string | null;
    horas_semanales: number;
    total_temas: number;
    temas_por_bimestre: {
      1: any[];
      2: any[];
      3: any[];
      4: any[];
    };
    profesores_asignados: number;
    clases_programadas: number;
    clases_ejecutadas: number;
    estado: 'completo' | 'pendiente';
    grado: string;
  };
  onExpandir?: () => void;
  expanded?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function MateriaCard({ materia, onExpandir, expanded, onEdit, onDelete, onDuplicate, selected, onSelect }: MateriaCardProps) {
  const getBimestreCount = (bimestre: number) => {
    return materia.temas_por_bimestre[bimestre as 1 | 2 | 3 | 4]?.length || 0;
  };

  const progresoEjecucion = materia.clases_programadas > 0 
    ? (materia.clases_ejecutadas / materia.clases_programadas) * 100 
    : 0;

  return (
    <Card className={`hover:shadow-lg transition-all duration-300 ${
      materia.estado === 'pendiente' ? 'border-warning' : 'border-success/30'
    }`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {onSelect && (
                <Checkbox
                  checked={selected}
                  onCheckedChange={onSelect}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <BookOpen className={`h-5 w-5 ${
                materia.estado === 'completo' ? 'text-success' : 'text-warning'
              }`} />
              <CardTitle className="text-lg">{materia.nombre}</CardTitle>
              <Badge variant={materia.estado === 'completo' ? 'default' : 'outline'}>
                {materia.estado === 'completo' ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Completo</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Pendiente</>
                )}
              </Badge>
            </div>
            {materia.descripcion && (
              <p className="text-sm text-muted-foreground mt-2">{materia.descripcion}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                className="h-8 w-8"
                title="Duplicar"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive hover:text-destructive"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onExpandir && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onExpandir}
                className="h-8 w-8"
              >
                <ChevronDown className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{materia.total_temas}</div>
              <div className="text-xs text-muted-foreground">Temas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{materia.horas_semanales}</div>
              <div className="text-xs text-muted-foreground">Hrs/Semana</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{materia.profesores_asignados}</div>
              <div className="text-xs text-muted-foreground">Profesores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">{materia.clases_ejecutadas}</div>
              <div className="text-xs text-muted-foreground">Clases Ejecutadas</div>
            </div>
          </div>

          {/* Distribución por bimestres */}
          {materia.total_temas > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Distribución por Bimestres</div>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(bim => (
                  <div key={bim} className="text-center p-2 bg-muted rounded-md">
                    <div className="text-lg font-semibold">{getBimestreCount(bim)}</div>
                    <div className="text-xs text-muted-foreground">Bim {bim}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progreso de ejecución */}
          {materia.clases_programadas > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso de Clases</span>
                <span className="font-medium">{Math.round(progresoEjecucion)}%</span>
              </div>
              <Progress value={progresoEjecucion} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{materia.clases_ejecutadas} ejecutadas</span>
                <span>{materia.clases_programadas} programadas</span>
              </div>
            </div>
          )}

          {/* Mensaje si no tiene temas */}
          {materia.total_temas === 0 && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
              <div className="flex items-center gap-2 text-warning">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Esta materia no tiene temas configurados</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

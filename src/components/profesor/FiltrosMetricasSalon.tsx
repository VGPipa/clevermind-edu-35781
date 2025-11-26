import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FiltrosDisponibles } from "@/types/metricas-salon";

interface FiltrosMetricasSalonProps {
  filtros: FiltrosDisponibles;
  materiaSeleccionada: string | null;
  temaSeleccionado: string | null;
  claseSeleccionada: string | null;
  onMateriaChange: (materiaId: string | null) => void;
  onTemaChange: (temaId: string | null) => void;
  onClaseChange: (claseId: string | null) => void;
}

export function FiltrosMetricasSalon({
  filtros,
  materiaSeleccionada,
  temaSeleccionado,
  claseSeleccionada,
  onMateriaChange,
  onTemaChange,
  onClaseChange,
}: FiltrosMetricasSalonProps) {
  if (!filtros) {
    return null;
  }

  // Filtrar temas por materia seleccionada
  const temasFiltrados = materiaSeleccionada
    ? filtros.temas?.filter((t) => t.id_materia === materiaSeleccionada) || []
    : filtros.temas || [];

  // Filtrar clases por tema seleccionado
  const clasesFiltradas = temaSeleccionado
    ? filtros.clases?.filter((c) => c.id_tema === temaSeleccionado) || []
    : filtros.clases || [];

  // Resetear filtros dependientes cuando cambia el padre
  const handleMateriaChange = (value: string) => {
    onMateriaChange(value === "todos" ? null : value);
    onTemaChange(null);
    onClaseChange(null);
  };

  const handleTemaChange = (value: string) => {
    onTemaChange(value === "todos" ? null : value);
    onClaseChange(null);
  };

  const handleClaseChange = (value: string) => {
    onClaseChange(value === "todos" ? null : value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {/* Filtro Materia */}
          <div className="space-y-2">
            <Label>Materia</Label>
            <Select
              value={materiaSeleccionada || "todos"}
              onValueChange={handleMateriaChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las materias</SelectItem>
                {filtros.materias?.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id}>
                    {materia.nombre}
                  </SelectItem>
                )) || []}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Tema */}
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select
              value={temaSeleccionado || "todos"}
              onValueChange={handleTemaChange}
              disabled={!materiaSeleccionada && (filtros.materias?.length || 0) > 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los temas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los temas</SelectItem>
                {temasFiltrados.map((tema) => (
                  <SelectItem key={tema.id} value={tema.id}>
                    {tema.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro Clase */}
          <div className="space-y-2">
            <Label>Clase / Sesión</Label>
            <Select
              value={claseSeleccionada || "todos"}
              onValueChange={handleClaseChange}
              disabled={!temaSeleccionado && (filtros.temas?.length || 0) > 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las clases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las clases</SelectItem>
                {clasesFiltradas.map((clase) => (
                  <SelectItem key={clase.id} value={clase.id}>
                    Sesión {clase.numero_sesion || "N/A"}
                    {clase.fecha_programada &&
                      ` - ${new Date(clase.fecha_programada).toLocaleDateString("es-ES", {
                        month: "short",
                        day: "numeric",
                      })}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


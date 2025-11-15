import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface FechaSelectorProps {
  fechaReferencia: string;
  onFechaChange: (fecha: string) => void;
  anioEscolar?: {
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  } | null;
}

export function FechaSelector({ fechaReferencia, onFechaChange, anioEscolar }: FechaSelectorProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleToday = () => {
    const today = new Date().toISOString().split('T')[0];
    onFechaChange(today);
  };

  const fechaActual = new Date().toISOString().split('T')[0];
  const isToday = fechaReferencia === fechaActual;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Label htmlFor="fecha-referencia" className="text-sm font-medium">
          Ver desde:
        </Label>
        <Input
          id="fecha-referencia"
          type="date"
          value={fechaReferencia}
          onChange={(e) => onFechaChange(e.target.value)}
          className="w-auto"
        />
        <Button
          variant={isToday ? "default" : "outline"}
          size="sm"
          onClick={handleToday}
        >
          Hoy
        </Button>
      </div>
      {anioEscolar && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            Año escolar: <strong>{anioEscolar.nombre}</strong>
          </span>
        </div>
      )}
    </div>
  );
}


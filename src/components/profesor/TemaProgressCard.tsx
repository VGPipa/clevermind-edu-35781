import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Calendar, CheckCircle2, Clock } from "lucide-react";

interface TemaProgressCardProps {
  tema: any;
  onVerGuiaMaestra: () => void;
  onProgramarSesion: () => void;
}

export function TemaProgressCard({ tema, onVerGuiaMaestra, onProgramarSesion }: TemaProgressCardProps) {
  const getEstadoBadge = () => {
    if (tema.estado === 'completado') {
      return <Badge className="bg-green-500 text-white">Completado</Badge>;
    } else if (tema.estado === 'en_progreso') {
      return <Badge className="bg-blue-500 text-white">En Progreso</Badge>;
    } else {
      return <Badge className="bg-orange-500 text-white">Iniciado</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {tema.tema.nombre}
            </CardTitle>
            <CardDescription>
              {tema.tema.materias.nombre} - {tema.tema.materias.plan_anual.grado}
            </CardDescription>
          </div>
          {getEstadoBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Progreso General</span>
            <span className="font-semibold">{tema.progreso.porcentaje}%</span>
          </div>
          <Progress value={tema.progreso.porcentaje} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-2xl font-bold">{tema.progreso.completadas}</span>
            </div>
            <p className="text-xs text-muted-foreground">Completadas</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-blue-600">
              <Calendar className="h-4 w-4" />
              <span className="text-2xl font-bold">{tema.progreso.programadas}</span>
            </div>
            <p className="text-xs text-muted-foreground">Programadas</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1 text-orange-600">
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-bold">{tema.progreso.pendientes}</span>
            </div>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="font-semibold mb-1">Total: {tema.total_sesiones} sesiones</p>
          {tema.tema.descripcion && (
            <p className="line-clamp-2">{tema.tema.descripcion}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onVerGuiaMaestra} className="flex-1">
            Ver Guía Maestra
          </Button>
          <Button onClick={onProgramarSesion} className="flex-1">
            Programar Sesión
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
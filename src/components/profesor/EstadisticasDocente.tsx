import { BookOpen, Users, GraduationCap, Clock, CheckCircle2, Calendar } from "lucide-react";
import { StatsCard } from "./StatsCard";

interface EstadisticasDocenteProps {
  estadisticas: {
    total_materias: number;
    total_grupos: number;
    total_estudiantes: number;
    horas_semanales_totales: number;
    clases_programadas_mes: number;
    clases_completadas_total: number;
  };
}

export const EstadisticasDocente = ({ estadisticas }: EstadisticasDocenteProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <StatsCard
        title="Materias Asignadas"
        value={estadisticas.total_materias}
        icon={BookOpen}
      />
      
      <StatsCard
        title="Grupos a Cargo"
        value={estadisticas.total_grupos}
        icon={GraduationCap}
      />
      
      <StatsCard
        title="Total Estudiantes"
        value={estadisticas.total_estudiantes}
        icon={Users}
      />
      
      <StatsCard
        title="Horas Semanales"
        value={estadisticas.horas_semanales_totales}
        icon={Clock}
      />
      
      <StatsCard
        title="Clases Este Mes"
        value={estadisticas.clases_programadas_mes}
        icon={Calendar}
      />
      
      <StatsCard
        title="Clases Completadas"
        value={estadisticas.clases_completadas_total}
        icon={CheckCircle2}
      />
    </div>
  );
};

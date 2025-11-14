import { StatsCard } from "@/components/profesor/StatsCard";
import { Users, BookOpen, GraduationCap, CheckCircle2 } from "lucide-react";

interface AsignacionesStatsProps {
  estadisticas: {
    total_asignaciones: number;
    profesores_asignados: number;
    materias_cubiertas: number;
    grupos_completos: number;
  };
}

export const AsignacionesStats = ({ estadisticas }: AsignacionesStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="Total Asignaciones"
        value={estadisticas.total_asignaciones}
        icon={CheckCircle2}
      />
      
      <StatsCard
        title="Profesores Asignados"
        value={estadisticas.profesores_asignados}
        icon={Users}
      />
      
      <StatsCard
        title="Materias Cubiertas"
        value={estadisticas.materias_cubiertas}
        icon={BookOpen}
      />
      
      <StatsCard
        title="Grupos Completos"
        value={estadisticas.grupos_completos}
        icon={GraduationCap}
      />
    </div>
  );
};

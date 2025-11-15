import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Calendar, CalendarDays } from "lucide-react";

interface AlertaBadgeProps {
  nivel: 'urgente' | 'proxima' | 'programada' | 'lejana';
  diasRestantes: number;
}

export function AlertaBadge({ nivel, diasRestantes }: AlertaBadgeProps) {
  const config = {
    urgente: {
      label: 'Urgente',
      variant: 'destructive' as const,
      icon: AlertTriangle,
      className: 'bg-red-500 text-white',
    },
    proxima: {
      label: 'Próxima',
      variant: 'default' as const,
      icon: Clock,
      className: 'bg-orange-500 text-white',
    },
    programada: {
      label: 'Programada',
      variant: 'default' as const,
      icon: Calendar,
      className: 'bg-blue-500 text-white',
    },
    lejana: {
      label: 'Lejana',
      variant: 'secondary' as const,
      icon: CalendarDays,
      className: 'bg-gray-500 text-white',
    },
  };

  const { label, icon: Icon, className } = config[nivel];

  return (
    <Badge className={className} variant={config[nivel].variant}>
      <Icon className="mr-1 h-3 w-3" />
      {label}
      {diasRestantes >= 0 && (
        <span className="ml-1">({diasRestantes}d)</span>
      )}
    </Badge>
  );
}


import { Play, FileText, Brain, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ClaseActionsMenuProps {
  clase: {
    id: string;
    estado: string;
    tiene_guia?: boolean;
  };
}

export const ClaseActionsMenu = ({ clase }: ClaseActionsMenuProps) => {
  const navigate = useNavigate();

  const getAction = () => {
    if (!clase.tiene_guia) {
      return {
        label: 'Generar guía',
        onClick: () => navigate(`/profesor/generar-clase?clase=${clase.id}`),
        icon: FileText,
        variant: 'action' as const,
      };
    }

    switch (clase.estado) {
      case 'borrador':
        return {
          label: 'Continuar',
          onClick: () => navigate(`/profesor/generar-clase?clase=${clase.id}`),
          icon: FileText,
          variant: 'action' as const,
        };
      case 'editando_guia':
        return {
          label: 'Editar guía',
          onClick: () => navigate(`/profesor/editar-guia/${clase.id}`),
          icon: FileText,
          variant: 'action' as const,
        };
      case 'guia_aprobada':
      case 'quiz_pre_generando':
        return {
          label: 'Quiz PRE',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: Brain,
          variant: 'default' as const,
        };
      case 'quiz_pre_enviado':
      case 'analizando_quiz_pre':
        return {
          label: 'Resultados PRE',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: BarChart3,
          variant: 'outline' as const,
        };
      case 'modificando_guia':
        return {
          label: 'Modificar guía',
          onClick: () => navigate(`/profesor/editar-guia/${clase.id}`),
          icon: FileText,
          variant: 'default' as const,
        };
      case 'guia_final':
      case 'clase_programada':
        return {
          label: 'Ver guía',
          onClick: () => navigate(`/profesor/ver-guia/${clase.id}`),
          icon: FileText,
          variant: 'outline' as const,
        };
      case 'en_clase':
        return {
          label: 'En clase',
          onClick: () => navigate(`/profesor/ver-guia/${clase.id}`),
          icon: Play,
          variant: 'default' as const,
        };
      case 'quiz_post_generando':
        return {
          label: 'Quiz POST',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: Brain,
          variant: 'default' as const,
        };
      case 'quiz_post_enviado':
      case 'analizando_resultados':
        return {
          label: 'Resultados POST',
          onClick: () => navigate(`/profesor/gestionar-quizzes/${clase.id}`),
          icon: BarChart3,
          variant: 'outline' as const,
        };
      case 'completada':
        return {
          label: 'Ver resumen',
          onClick: () => navigate(`/profesor/ver-guia/${clase.id}`),
          icon: CheckCircle2,
          variant: 'outline' as const,
        };
      default:
        return {
          label: 'Ver detalles',
          onClick: () => navigate(`/profesor/ver-guia/${clase.id}`),
          icon: Clock,
          variant: 'outline' as const,
        };
    }
  };

  const action = getAction();
  const Icon = action.icon;

  return (
    <Button
      size="sm"
      variant={action.variant}
      onClick={action.onClick}
      className="w-full"
    >
      <Icon className="h-4 w-4 mr-2" />
      {action.label}
    </Button>
  );
};

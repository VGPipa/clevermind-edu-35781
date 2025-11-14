import { User, Mail, Briefcase, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PerfilHeaderProps {
  profesor: {
    nombre: string;
    apellido: string;
    email: string;
    especialidad: string;
    activo: boolean;
    avatar_url: string | null;
    created_at: string;
  };
}

export const PerfilHeader = ({ profesor }: PerfilHeaderProps) => {
  const initials = `${profesor.nombre?.charAt(0) || ''}${profesor.apellido?.charAt(0) || ''}`.toUpperCase();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profesor.avatar_url || undefined} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl font-bold">
                {profesor.nombre} {profesor.apellido}
              </h2>
              <Badge variant={profesor.activo ? "default" : "secondary"}>
                {profesor.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{profesor.email}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Especialidad: {profesor.especialidad}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Desde: {format(new Date(profesor.created_at), "MMMM yyyy", { locale: es })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

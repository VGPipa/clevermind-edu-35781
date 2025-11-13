import { Home, Users, BookOpen, FileText, Settings, BarChart3, Calendar, GraduationCap, UserCircle, LogOut, Sparkles } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AppSidebarProps {
  role: string;
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({ role, userName, userEmail }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error al cerrar sesión");
    } else {
      toast.success("Sesión cerrada correctamente");
      navigate("/auth");
    }
  };

  const adminItems = [
    { title: "Dashboard", icon: Home, url: "/admin/dashboard" },
    { title: "Plan Anual", icon: BookOpen, url: "/admin/plan-anual" },
    { title: "Usuarios", icon: Users, url: "/admin/usuarios" },
    { title: "Reportes", icon: BarChart3, url: "/admin/reportes" },
    { title: "Configuración", icon: Settings, url: "/admin/configuracion" },
  ];

  const profesorItems = [
    { title: "Dashboard", icon: Home, url: "/profesor/dashboard" },
    { title: "Planificación", icon: Calendar, url: "/profesor/planificacion" },
    { title: "Generar Clase", icon: FileText, url: "/profesor/generar-clase" },
    { title: "Métricas", icon: BarChart3, url: "/profesor/metricas" },
    { title: "Capacitación IA", icon: Sparkles, url: "/profesor/capacitacion" },
  ];

  const alumnoItems = [
    { title: "Dashboard", icon: Home, url: "/alumno/dashboard" },
    { title: "Mis Clases", icon: GraduationCap, url: "/alumno/clases" },
  ];

  const apoderadoItems = [
    { title: "Dashboard", icon: Home, url: "/apoderado/dashboard" },
  ];

  const getMenuItems = () => {
    switch (role) {
      case "admin":
        return adminItems;
      case "profesor":
        return profesorItems;
      case "alumno":
        return alumnoItems;
      case "apoderado":
        return apoderadoItems;
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-sidebar-foreground">EduThink</h2>
            <p className="text-xs text-sidebar-foreground/70 capitalize">{role}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menú Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userName?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {userName || "Usuario"}
            </p>
            <p className="text-xs text-sidebar-foreground/70 truncate">
              {userEmail}
            </p>
          </div>
        </div>
        <SidebarMenuButton onClick={handleLogout} className="w-full">
          <LogOut />
          <span>Cerrar Sesión</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}

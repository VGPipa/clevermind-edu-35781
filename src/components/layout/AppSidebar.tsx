import { Home, Users, BookOpen, FileText, Settings, BarChart3, Calendar, GraduationCap, LogOut, Sparkles } from "lucide-react";
import { AnimatedSidebar, SidebarBody, SidebarLink, useSidebar } from "@/components/ui/sidebar-animated";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  role: string;
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({ role, userName, userEmail }: AppSidebarProps) {
  const navigate = useNavigate();

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
    { title: "Dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" />, url: "/admin/dashboard" },
    { title: "Plan Anual", icon: <BookOpen className="h-5 w-5 flex-shrink-0" />, url: "/admin/plan-anual" },
    { title: "Usuarios", icon: <Users className="h-5 w-5 flex-shrink-0" />, url: "/admin/usuarios" },
    { title: "Reportes", icon: <BarChart3 className="h-5 w-5 flex-shrink-0" />, url: "/admin/reportes" },
    { title: "Configuración", icon: <Settings className="h-5 w-5 flex-shrink-0" />, url: "/admin/configuracion" },
  ];

  const profesorItems = [
    { title: "Dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" />, url: "/profesor/dashboard" },
    { title: "Planificación", icon: <Calendar className="h-5 w-5 flex-shrink-0" />, url: "/profesor/planificacion" },
    { title: "Generar Clase", icon: <FileText className="h-5 w-5 flex-shrink-0" />, url: "/profesor/generar-clase" },
    { title: "Métricas", icon: <BarChart3 className="h-5 w-5 flex-shrink-0" />, url: "/profesor/metricas" },
    { title: "Capacitación IA", icon: <Sparkles className="h-5 w-5 flex-shrink-0" />, url: "/profesor/capacitacion" },
  ];

  const alumnoItems = [
    { title: "Dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" />, url: "/alumno/dashboard" },
    { title: "Mis Clases", icon: <GraduationCap className="h-5 w-5 flex-shrink-0" />, url: "/alumno/clases" },
  ];

  const apoderadoItems = [
    { title: "Dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" />, url: "/apoderado/dashboard" },
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

  const Logo = () => {
    return (
      <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-lg text-sidebar-foreground whitespace-nowrap">
          EduThink
        </span>
      </div>
    );
  };

  const LogoIcon = () => {
    return (
      <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
      </div>
    );
  };

  return (
    <AnimatedSidebar>
      <SidebarBody className="justify-between gap-10">
        <SidebarContent menuItems={menuItems} Logo={Logo} LogoIcon={LogoIcon} />
        <BottomSection userName={userName} userEmail={userEmail} handleLogout={handleLogout} />
      </SidebarBody>
    </AnimatedSidebar>
  );
}

function SidebarContent({ menuItems, Logo, LogoIcon }: { menuItems: any[]; Logo: () => JSX.Element; LogoIcon: () => JSX.Element }) {
  const { open } = useSidebar();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <div className="md:block hidden">
        {open ? <Logo /> : <LogoIcon />}
      </div>
      <div className="md:hidden">
        <LogoIcon />
      </div>
      <div className="mt-8 flex flex-col gap-2">
        {menuItems.map((item, idx) => (
          <SidebarLink
            key={idx}
            link={{
              label: item.title,
              href: item.url,
              icon: item.icon,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BottomSection({ userName, userEmail, handleLogout }: { userName?: string; userEmail?: string; handleLogout: () => void }) {
  const { open } = useSidebar();

  return (
    <div className="flex flex-col gap-2 pb-2">
      <div className={cn(
        "flex items-center gap-3",
        open ? "px-2" : "justify-center px-0"
      )}>
        <Avatar className="h-9 w-9 flex-shrink-0">
          <AvatarImage src="" />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {userName?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <motion.div
          className="flex-1 min-w-0"
          animate={{
            display: open ? "block" : "none",
            opacity: open ? 1 : 0,
          }}
        >
          <p className="text-sm font-medium text-sidebar-foreground truncate">
            {userName || "Usuario"}
          </p>
          <p className="text-xs text-sidebar-foreground/70 truncate">
            {userEmail}
          </p>
        </motion.div>
      </div>
      <div
        onClick={handleLogout}
        className={cn(
          "flex items-center gap-2 py-2 rounded-lg cursor-pointer text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-150",
          open ? "px-2 justify-start" : "px-0 justify-center"
        )}
      >
        <LogOut className="h-5 w-5 flex-shrink-0" />
        <motion.span
          className="text-sm whitespace-pre"
          animate={{
            display: open ? "inline-block" : "none",
            opacity: open ? 1 : 0,
          }}
        >
          Cerrar Sesión
        </motion.span>
      </div>
    </div>
  );
}

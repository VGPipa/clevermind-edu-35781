import { Home, Users, BookOpen, FileText, Settings, BarChart3, Calendar, GraduationCap, LogOut, Sparkles } from "lucide-react";
import { Sidebar, SidebarBody, SidebarLink, useSidebarAnimated } from "@/components/ui/sidebar-animated";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  role: string;
  userName?: string;
  userEmail?: string;
}

export function AppSidebar({ role, userName, userEmail }: AppSidebarProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(true); // Start open on desktop

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
    { label: "Dashboard", href: "/admin/dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
    { label: "Plan Anual", href: "/admin/plan-anual", icon: <BookOpen className="h-5 w-5 flex-shrink-0" /> },
    { label: "Usuarios", href: "/admin/usuarios", icon: <Users className="h-5 w-5 flex-shrink-0" /> },
    { label: "Reportes", href: "/admin/reportes", icon: <BarChart3 className="h-5 w-5 flex-shrink-0" /> },
    { label: "Configuración", href: "/admin/configuracion", icon: <Settings className="h-5 w-5 flex-shrink-0" /> },
  ];

  const profesorItems = [
    { label: "Dashboard", href: "/profesor/dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
    { label: "Planificación", href: "/profesor/planificacion", icon: <Calendar className="h-5 w-5 flex-shrink-0" /> },
    { label: "Generar Clase", href: "/profesor/generar-clase", icon: <FileText className="h-5 w-5 flex-shrink-0" /> },
    { label: "Métricas", href: "/profesor/metricas", icon: <BarChart3 className="h-5 w-5 flex-shrink-0" /> },
    { label: "Capacitación IA", href: "/profesor/capacitacion", icon: <Sparkles className="h-5 w-5 flex-shrink-0" /> },
  ];

  const alumnoItems = [
    { label: "Dashboard", href: "/alumno/dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
    { label: "Mis Clases", href: "/alumno/clases", icon: <GraduationCap className="h-5 w-5 flex-shrink-0" /> },
  ];

  const apoderadoItems = [
    { label: "Dashboard", href: "/apoderado/dashboard", icon: <Home className="h-5 w-5 flex-shrink-0" /> },
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
    const { open } = useSidebarAnimated();
    return (
      <Link
        to="/"
        className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20"
      >
        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "font-bold text-lg text-sidebar-foreground whitespace-pre",
            !open && "hidden"
          )}
        >
          EduThink
        </motion.span>
      </Link>
    );
  };

  const LogoIcon = () => {
    return (
      <Link
        to="/"
        className="font-normal flex space-x-2 items-center text-sm text-sidebar-foreground py-1 relative z-20"
      >
        <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
      </Link>
    );
  };

  const SidebarContent = () => {
    const { open } = useSidebarAnimated();
    
    return (
      <>
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-2 mb-2">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "text-xs text-sidebar-foreground/70 capitalize",
                !open && "hidden"
              )}
            >
              {role}
            </motion.p>
          </div>
          <div className="mt-4 flex flex-col gap-1">
            {menuItems.map((item, idx) => (
              <SidebarLink key={idx} link={item} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 p-2 rounded-md">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userName?.charAt(0).toUpperCase() || userEmail?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex-1 min-w-0",
                !open && "hidden"
              )}
            >
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {userName || "Usuario"}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {userEmail}
              </p>
            </motion.div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-start gap-2 group/sidebar py-2 px-2 rounded-md transition-colors hover:bg-destructive/10 hover:text-destructive text-sidebar-foreground text-sm"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: open ? 1 : 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "whitespace-pre",
                !open && "hidden"
              )}
            >
              Cerrar Sesión
            </motion.span>
          </button>
        </div>
      </>
    );
  };

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <SidebarContent />
      </SidebarBody>
    </Sidebar>
  );
}

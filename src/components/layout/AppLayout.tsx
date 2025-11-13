import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { toast } from "sonner";
import { User, Session } from "@supabase/supabase-js";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          navigate("/auth");
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      // Fetch user role and profile
      const fetchUserData = async () => {
        try {
          const { data: roleData, error: roleError } = await supabase
            // @ts-ignore - Supabase types not yet synced
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .single();

          if (roleError) {
            console.error("Error fetching role:", roleError);
            toast.error("Error al cargar el rol del usuario");
            setLoading(false);
            return;
          }

          const { data: profileData } = await supabase
            // @ts-ignore - Supabase types not yet synced
            .from("profiles")
            .select("nombre, apellido")
            .eq("user_id", user.id)
            .single();

          setRole((roleData as any)?.role || "");
          setUserName(
            (profileData as any)?.nombre
              ? `${(profileData as any).nombre} ${(profileData as any).apellido || ""}`.trim()
              : ""
          );
          setLoading(false);
        } catch (error) {
          console.error("Error:", error);
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !role) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar role={role} userName={userName} userEmail={user.email} />
        <main className="flex-1 overflow-auto bg-background p-6">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

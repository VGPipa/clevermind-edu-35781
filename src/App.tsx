import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminPlanAnual from "./pages/admin/PlanAnual";
import AdminAsignaciones from "./pages/admin/Asignaciones";
import AdminConfiguracion from "./pages/admin/Configuracion";
import ProfesorDashboard from "./pages/profesor/Dashboard";
import ProfesorPlanificacion from "./pages/profesor/Planificacion";
import ProfesorGenerarClase from "./pages/profesor/GenerarClase";
import ProfesorVerGuiaClase from "./pages/profesor/VerGuiaClase";
import ProfesorEditarGuia from "./pages/profesor/EditarGuia";
import ProfesorGestionarQuizzes from "./pages/profesor/GestionarQuizzes";
import ProfesorRecomendacionesQuizPre from "./pages/profesor/RecomendacionesQuizPre";
import ProfesorRetroalimentaciones from "./pages/profesor/Retroalimentaciones";
import ProfesorMetricas from "./pages/profesor/Metricas";
import ProfesorCapacitacion from "./pages/profesor/Capacitacion";
import ProfesorEvaluacionInicial from "./pages/profesor/EvaluacionInicial";
import ProfesorNodoAprendizaje from "./pages/profesor/NodoAprendizaje";
import ProfesorPerfil from "./pages/profesor/Perfil";
import AlumnoDashboard from "./pages/alumno/Dashboard";
import AlumnoClases from "./pages/alumno/Clases";
import ApoderadoDashboard from "./pages/apoderado/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/plan-anual" element={<AdminPlanAnual />} />
          <Route path="/admin/asignaciones" element={<AdminAsignaciones />} />
          <Route path="/admin/configuracion" element={<AdminConfiguracion />} />
          
          {/* Profesor Routes */}
          <Route path="/profesor/dashboard" element={<ProfesorDashboard />} />
          <Route path="/profesor/planificacion" element={<ProfesorPlanificacion />} />
          <Route path="/profesor/perfil" element={<ProfesorPerfil />} />
          <Route path="/profesor/generar-clase" element={<ProfesorGenerarClase />} />
          <Route path="/profesor/ver-guia/:claseId" element={<ProfesorVerGuiaClase />} />
          <Route path="/profesor/editar-guia/:claseId" element={<ProfesorEditarGuia />} />
          <Route path="/profesor/gestionar-quizzes/:claseId" element={<ProfesorGestionarQuizzes />} />
          <Route path="/profesor/recomendaciones-quiz-pre/:claseId" element={<ProfesorRecomendacionesQuizPre />} />
          <Route path="/profesor/retroalimentaciones/:claseId" element={<ProfesorRetroalimentaciones />} />
          <Route path="/profesor/metricas" element={<ProfesorMetricas />} />
          <Route path="/profesor/capacitacion" element={<ProfesorCapacitacion />} />
          <Route path="/profesor/capacitacion/evaluacion-inicial" element={<ProfesorEvaluacionInicial />} />
          <Route path="/profesor/capacitacion/nodo/:nodoId" element={<ProfesorNodoAprendizaje />} />
          
          {/* Alumno Routes */}
          <Route path="/alumno/dashboard" element={<AlumnoDashboard />} />
          <Route path="/alumno/clases" element={<AlumnoClases />} />
          
          {/* Apoderado Routes */}
          <Route path="/apoderado/dashboard" element={<ApoderadoDashboard />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

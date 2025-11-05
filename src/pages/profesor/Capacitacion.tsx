import { AppLayout } from "@/components/layout/AppLayout";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, Circle, Play, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ProfesorCapacitacion() {
  const navigate = useNavigate();
  const [hasCompletedInitial, setHasCompletedInitial] = useState(false);
  const [userLevel, setUserLevel] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  // Cargar perfil del usuario
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // @ts-ignore
        const { data } = await supabase
          // @ts-ignore
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        setUserProfile(data);
      }
    }
    loadProfile();
  }, []);

  // Verificar si completó la evaluación inicial
  useEffect(() => {
    const evaluationData = localStorage.getItem("evaluacion_inicial");
    if (evaluationData) {
      const data = JSON.parse(evaluationData);
      setHasCompletedInitial(data.completed);
      setUserLevel(data.nivel);
    }
  }, []);

  // Progreso global
  const globalProgress = {
    completedNodes: 12,
    totalNodes: 45,
    averageGrade: 4.5,
  };

  // Cursos disponibles
  const courses = [
    {
      id: 1,
      title: "Fundamentos de IA para Educadores",
      status: "en_desarrollo",
      progress: 27,
      averageGrade: 4.5,
      modules: [
        {
          id: 1,
          title: "IA para Planificación Educativa",
          color: "from-primary to-primary/80",
          nodes: [
            { 
              id: 1, 
              title: "Introducción a Prompts", 
              status: userLevel === "Avanzado" ? "completed" : (userLevel === "Intermedio" ? "available" : "available")
            },
            { 
              id: 2, 
              title: "Crear Objetivos de Aprendizaje", 
              status: userLevel === "Avanzado" ? "completed" : (userLevel === "Intermedio" ? "available" : "locked")
            },
            { 
              id: 3, 
              title: "Planificación de Unidades", 
              status: userLevel === "Avanzado" ? "available" : "locked"
            },
            { id: 4, title: "Secuencias Didácticas", status: "locked" },
            { id: 5, title: "Adaptación Curricular", status: "locked" },
          ],
        },
        {
          id: 2,
          title: "IA para Creación de Contenido",
          color: "from-secondary to-secondary/80",
          nodes: [
            { id: 6, title: "Crear Rúbricas con IA", status: "locked" },
            { id: 7, title: "Guías de Aprendizaje", status: "locked" },
            { id: 8, title: "Material Didáctico", status: "locked" },
            { id: 9, title: "Actividades Interactivas", status: "locked" },
            { id: 10, title: "Recursos Multimedia", status: "locked" },
          ],
        },
        {
          id: 3,
          title: "IA para Evaluación",
          color: "from-accent to-accent/80",
          nodes: [
            { id: 11, title: "Diseño de Evaluaciones", status: "locked" },
            { id: 12, title: "Rúbricas de Evaluación", status: "locked" },
            { id: 13, title: "Feedback Personalizado", status: "locked" },
            { id: 14, title: "Análisis de Resultados", status: "locked" },
          ],
        },
      ],
    },
    {
      id: 2,
      title: "IA Avanzada para Personalización del Aprendizaje",
      status: "en_definicion",
      progress: 0,
      averageGrade: 0,
      modules: [],
    },
    {
      id: 3,
      title: "Ética y Privacidad en el Uso de IA Educativa",
      status: "en_definicion",
      progress: 0,
      averageGrade: 0,
      modules: [],
    },
    {
      id: 4,
      title: "Integración de IA en el Aula: Casos Prácticos",
      status: "en_definicion",
      progress: 0,
      averageGrade: 0,
      modules: [],
    },
  ];


  const handleNodeClick = (nodeId: number, status: string) => {
    if (status === "locked") return;
    navigate(`/profesor/capacitacion/nodo/${nodeId}`);
  };

  const getNodeIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-6 w-6 text-success" />;
      case "available":
        return <Play className="h-6 w-6 text-primary" />;
      case "locked":
        return <Lock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  if (!hasCompletedInitial) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="h-20 w-20 mx-auto rounded-full bg-primary flex items-center justify-center">
                <Play className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">¡Bienvenido a Capacitación IA!</h1>
                <p className="text-muted-foreground">
                  Descubre cómo usar la IA para potenciar tu enseñanza
                </p>
              </div>
              <div className="bg-muted p-6 rounded-lg text-left space-y-3">
                <h3 className="font-semibold text-lg">¿Qué aprenderás?</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <span>Crear prompts efectivos para planificación</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <span>Generar contenido educativo de calidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <span>Diseñar evaluaciones personalizadas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success mt-0.5" />
                    <span>Adaptar materiales a diferentes niveles</span>
                  </li>
                </ul>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-primary text-lg px-8"
                onClick={() => navigate("/profesor/capacitacion/evaluacion-inicial")}
              >
                Comenzar Evaluación Inicial
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header con foto y progreso global */}
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {userProfile?.nombre?.[0]}{userProfile?.apellido?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4 text-center md:text-left">
                <div>
                  <h1 className="text-3xl font-bold">
                    {userProfile?.nombre} {userProfile?.apellido}
                  </h1>
                  {userLevel && (
                    <Badge variant="secondary" className="mt-2">
                      Nivel: {userLevel}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progreso Global</span>
                    <span className="font-semibold">
                      {Math.round((globalProgress.completedNodes / globalProgress.totalNodes) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={(globalProgress.completedNodes / globalProgress.totalNodes) * 100} 
                    className="h-3"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {globalProgress.completedNodes} de {globalProgress.totalNodes} nodos completados
                    </span>
                    <span className="font-semibold">
                      Nota promedio: {globalProgress.averageGrade.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de cursos */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Mis Cursos</h2>
          
          {courses.map((course) => (
            <Card key={course.id}>
              <Collapsible
                open={expandedCourse === course.id}
                onOpenChange={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-semibold text-xl hover:bg-transparent hover:text-primary justify-start"
                          disabled={course.status === "en_definicion"}
                        >
                          <CardTitle className="text-left">{course.title}</CardTitle>
                          {course.status === "en_desarrollo" && (
                            expandedCourse === course.id ? 
                            <ChevronUp className="ml-2 h-5 w-5" /> : 
                            <ChevronDown className="ml-2 h-5 w-5" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <div className="flex flex-wrap gap-4 mt-3">
                        <Badge variant={course.status === "en_desarrollo" ? "default" : "secondary"}>
                          {course.status === "en_desarrollo" ? "En Desarrollo" : "En Definición"}
                        </Badge>
                        
                        {course.status === "en_desarrollo" && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Progreso:</span>
                              <span className="font-semibold">{course.progress}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Nota promedio:</span>
                              <span className="font-semibold">{course.averageGrade.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {course.status === "en_desarrollo" && (
                    <Progress value={course.progress} className="mt-4 h-2" />
                  )}
                </CardHeader>

                {course.status === "en_desarrollo" && course.modules.length > 0 && (
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-6">
                      {course.modules.map((module) => (
                        <div key={module.id} className="space-y-3">
                          <div className={`p-4 rounded-lg bg-gradient-to-r ${module.color}`}>
                            <h3 className="text-lg font-bold text-white">{module.title}</h3>
                            <p className="text-sm text-white/80">
                              {module.nodes.filter(n => n.status === "completed").length}/{module.nodes.length} completados
                            </p>
                          </div>
                          
                          <div className="space-y-2 pl-4">
                            {module.nodes.map((node, nodeIdx) => (
                              <div key={node.id}>
                                <Button
                                  variant={node.status === "available" ? "default" : "outline"}
                                  className={`w-full justify-start gap-3 h-auto py-3 ${
                                    node.status === "locked" ? "cursor-not-allowed opacity-60" : ""
                                  } ${node.status === "completed" ? "bg-success/10 border-success hover:bg-success/20" : ""}`}
                                  onClick={() => handleNodeClick(node.id, node.status)}
                                  disabled={node.status === "locked"}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {getNodeIcon(node.status)}
                                    <div className="text-left">
                                      <p className="font-medium">{node.title}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {node.status === "completed" && "✓ Completado"}
                                        {node.status === "available" && "Disponible"}
                                        {node.status === "locked" && "🔒 Bloqueado"}
                                      </p>
                                    </div>
                                  </div>
                                  {node.status === "completed" && (
                                    <Badge className="bg-success">+100 XP</Badge>
                                  )}
                                </Button>
                                {nodeIdx < module.nodes.length - 1 && (
                                  <div className="h-6 w-0.5 bg-border mx-auto ml-8" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                )}
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

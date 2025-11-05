import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Flame, Star, Trophy, Lock, CheckCircle2, Circle, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ProfesorCapacitacion() {
  const navigate = useNavigate();
  const [hasCompletedInitial, setHasCompletedInitial] = useState(false); // En producción esto vendría de la DB

  // Mock data - en producción vendría de Supabase
  const userProgress = {
    xp: 2450,
    nextLevelXp: 3000,
    level: 5,
    streak: 7,
    completedNodes: 12,
    totalNodes: 45,
  };

  const modules = [
    {
      id: 1,
      title: "IA para Planificación Educativa",
      color: "from-primary to-primary-dark",
      nodes: [
        { id: 1, title: "Introducción a Prompts", status: "completed" },
        { id: 2, title: "Crear Objetivos de Aprendizaje", status: "completed" },
        { id: 3, title: "Planificación de Unidades", status: "available" },
        { id: 4, title: "Secuencias Didácticas", status: "locked" },
        { id: 5, title: "Adaptación Curricular", status: "locked" },
      ],
    },
    {
      id: 2,
      title: "IA para Creación de Contenido",
      color: "from-secondary to-secondary-light",
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
      color: "from-accent to-orange-600",
      nodes: [
        { id: 11, title: "Diseño de Evaluaciones", status: "locked" },
        { id: 12, title: "Rúbricas de Evaluación", status: "locked" },
        { id: 13, title: "Feedback Personalizado", status: "locked" },
        { id: 14, title: "Análisis de Resultados", status: "locked" },
      ],
    },
    {
      id: 4,
      title: "IA para Personalización del Aprendizaje",
      color: "from-purple-500 to-purple-700",
      nodes: [
        { id: 15, title: "Perfiles de Aprendizaje", status: "locked" },
        { id: 16, title: "Adaptación de Contenido", status: "locked" },
        { id: 17, title: "Rutas Personalizadas", status: "locked" },
      ],
    },
  ];

  const portfolioItems = [
    { id: 1, title: "Rúbrica: Sistema Solar 5° Básico", type: "Rúbrica", date: "2025-01-15", rating: 5 },
    { id: 2, title: "Plan de Clase: Fotosíntesis", type: "Plan", date: "2025-01-14", rating: 4 },
    { id: 3, title: "Evaluación: Matemáticas U1", type: "Evaluación", date: "2025-01-13", rating: 5 },
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
              <div className="h-20 w-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                <Star className="h-10 w-10 text-white" />
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
      <div className="space-y-6">
        {/* Header con gamificación */}
        <Card className="bg-gradient-primary text-white">
          <CardContent className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {userProgress.level}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Nivel {userProgress.level}</h2>
                  <p className="text-white/80">Maestro de IA en Formación</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-300" />
                  <div>
                    <p className="text-sm text-white/80">XP</p>
                    <p className="font-bold">{userProgress.xp}/{userProgress.nextLevelXp}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <div>
                    <p className="text-sm text-white/80">Racha</p>
                    <p className="font-bold">{userProgress.streak} días</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                  <div>
                    <p className="text-sm text-white/80">Nodos</p>
                    <p className="font-bold">{userProgress.completedNodes}/{userProgress.totalNodes}</p>
                  </div>
                </div>
              </div>
            </div>
            <Progress 
              value={(userProgress.xp / userProgress.nextLevelXp) * 100} 
              className="mt-4 h-2 bg-white/20"
            />
          </CardContent>
        </Card>

        {/* Tabs de navegación */}
        <Tabs defaultValue="ruta" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="ruta">Mi Ruta</TabsTrigger>
            <TabsTrigger value="portafolio">Mi Portafolio</TabsTrigger>
            <TabsTrigger value="progreso">Mi Progreso</TabsTrigger>
          </TabsList>

          {/* Tab: Mi Ruta */}
          <TabsContent value="ruta" className="space-y-8 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Ruta de Aprendizaje</h2>
              <Progress 
                value={(userProgress.completedNodes / userProgress.totalNodes) * 100} 
                className="w-48 h-2"
              />
            </div>

            {modules.map((module, moduleIdx) => (
              <Card key={module.id} className="overflow-hidden">
                <div className={`p-4 bg-gradient-to-r ${module.color} text-white`}>
                  <h3 className="text-xl font-bold">{module.title}</h3>
                  <p className="text-sm text-white/80">
                    {module.nodes.filter(n => n.status === "completed").length}/{module.nodes.length} completados
                  </p>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {module.nodes.map((node, nodeIdx) => (
                      <div key={node.id}>
                        <Button
                          variant={node.status === "available" ? "default" : "outline"}
                          className={`w-full justify-start gap-3 h-auto py-4 ${
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
                          <div className="h-8 w-0.5 bg-border mx-auto" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Tab: Mi Portafolio */}
          <TabsContent value="portafolio" className="space-y-6 mt-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Mi Portafolio</h2>
              <p className="text-muted-foreground">Todos los productos que has creado con IA</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {portfolioItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Badge>{item.type}</Badge>
                      <h3 className="font-semibold">{item.title}</h3>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < item.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">Ver</Button>
                        <Button size="sm" variant="outline" className="flex-1">Descargar</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab: Mi Progreso */}
          <TabsContent value="progreso" className="space-y-6 mt-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Mi Progreso</h2>
              <p className="text-muted-foreground">Estadísticas y logros</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Estadísticas Generales</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progreso Total</span>
                        <span className="font-medium">{Math.round((userProgress.completedNodes / userProgress.totalNodes) * 100)}%</span>
                      </div>
                      <Progress value={(userProgress.completedNodes / userProgress.totalNodes) * 100} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-primary">{userProgress.completedNodes}</p>
                        <p className="text-sm text-muted-foreground">Nodos Completados</p>
                      </div>
                      <div className="text-center p-4 bg-muted rounded-lg">
                        <p className="text-2xl font-bold text-secondary">{portfolioItems.length}</p>
                        <p className="text-sm text-muted-foreground">Productos Creados</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Certificados</h3>
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Completa todos los módulos para desbloquear tu certificado</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

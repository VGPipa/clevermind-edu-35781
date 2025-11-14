import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, FileText, CheckCircle2, AlertCircle, Edit, Trash2, Plus, Target, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProgressBar } from "@/components/profesor/ProgressBar";

const STEPS = [
  { id: 1, label: "Contexto" },
  { id: 2, label: "Generar Guía" },
  { id: 3, label: "Evaluación Pre" },
  { id: 4, label: "Evaluación Post" },
  { id: 5, label: "Validar" },
];

const METODOLOGIAS = [
  "Aprendizaje Basado en Casos",
  "Método Socrático",
  "Resolución de Problemas",
  "Debate Estructurado",
  "Análisis Comparativo",
];

const EDAD_GRUPOS = ["5-6", "7-8", "9-10", "11-12", "13-14", "15-16", "17+"];

export default function GenerarClase() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [metodologiasSeleccionadas, setMetodologiasSeleccionadas] = useState<string[]>([]);
  const [edadSeleccionada, setEdadSeleccionada] = useState("");
  
  const [formData, setFormData] = useState({
    areaAcademica: "",
    temaCurricular: "",
    areasTransversales: "",
    duracionClase: "90",
    contextoEspecifico: "",
  });

  const [guiaGenerada, setGuiaGenerada] = useState<any>(null);
  const [preguntasPre, setPreguntasPre] = useState<any[]>([]);
  const [preguntasPost, setPreguntasPost] = useState<any[]>([]);

  const toggleMetodologia = (metodologia: string) => {
    if (metodologiasSeleccionadas.includes(metodologia)) {
      setMetodologiasSeleccionadas(metodologiasSeleccionadas.filter(m => m !== metodologia));
    } else {
      setMetodologiasSeleccionadas([...metodologiasSeleccionadas, metodologia]);
    }
  };

  const handleGenerarGuia = async () => {
    if (!formData.areaAcademica || !formData.temaCurricular) {
      toast.error("Por favor completa los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      // Simular generación con IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setGuiaGenerada({
        objetivos: [
          "Desarrollar pensamiento crítico mediante análisis de casos",
          "Aplicar metodología socrática en la resolución de problemas",
          "Fomentar el debate estructurado entre estudiantes"
        ],
        estructura: [
          { fase: "Introducción", tiempo: "15 min", actividad: "Presentación del tema y activación de conocimientos previos" },
          { fase: "Desarrollo", tiempo: "50 min", actividad: "Trabajo en grupos con casos de estudio" },
          { fase: "Cierre", tiempo: "25 min", actividad: "Debate plenario y conclusiones" }
        ],
        preguntasSocraticas: [
          "¿Por qué crees que esto es importante?",
          "¿Qué evidencia apoya tu conclusión?",
          "¿Cómo se relaciona esto con lo que ya sabemos?"
        ]
      });

      // Generar preguntas de evaluación
      setPreguntasPre([
        { id: 1, texto: "¿Qué conocimientos previos tienes sobre el tema?", puntos: 5, tipo: "Abierta" },
        { id: 2, texto: "Identifica los conceptos clave del tema", puntos: 10, tipo: "Múltiple" },
        { id: 3, texto: "¿Cómo aplicarías esto en tu vida diaria?", puntos: 15, tipo: "Desarrollo" },
      ]);

      setPreguntasPost([
        { id: 1, texto: "Analiza críticamente el caso presentado", puntos: 20, tipo: "Análisis" },
        { id: 2, texto: "Compara y contrasta las diferentes perspectivas", puntos: 25, tipo: "Comparación" },
        { id: 3, texto: "Propón una solución innovadora al problema", puntos: 30, tipo: "Síntesis" },
      ]);

      setCurrentStep(2);
      toast.success("Guía generada exitosamente");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Error al generar la guía de clase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Generar Guía de Clase con IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Crea guías pedagógicas personalizadas en segundos
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Información de la Clase
              </CardTitle>
              <CardDescription>Completa los datos para generar tu guía</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Área Académica *</Label>
              <Select value={formData.areaAcademica} onValueChange={(value) => setFormData({...formData, areaAcademica: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matematicas">Matemáticas</SelectItem>
                  <SelectItem value="lenguaje">Lenguaje</SelectItem>
                  <SelectItem value="ciencias">Ciencias</SelectItem>
                  <SelectItem value="historia">Historia</SelectItem>
                  <SelectItem value="arte">Arte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tema Curricular *</Label>
              <Select value={formData.temaCurricular} onValueChange={(value) => setFormData({...formData, temaCurricular: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tema" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fracciones">Fracciones</SelectItem>
                  <SelectItem value="ecosistemas">Ecosistemas</SelectItem>
                  <SelectItem value="literatura">Literatura</SelectItem>
                  <SelectItem value="historia-chile">Historia de Chile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Áreas Transversales (Opcional)</Label>
            <Input 
              placeholder="Ej: Medio ambiente, tecnología, ciudadanía"
              value={formData.areasTransversales}
              onChange={(e) => setFormData({...formData, areasTransversales: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label>Metodologías de Pensamiento Crítico</Label>
            <div className="flex flex-wrap gap-2">
              {METODOLOGIAS.map((metodologia) => (
                <Badge
                  key={metodologia}
                  variant={metodologiasSeleccionadas.includes(metodologia) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => toggleMetodologia(metodologia)}
                >
                  {metodologia}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Duración de la Clase (minutos)</Label>
              <Input 
                type="number"
                value={formData.duracionClase}
                onChange={(e) => setFormData({...formData, duracionClase: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Grupo de Edad</Label>
              <div className="grid grid-cols-4 gap-2">
                {EDAD_GRUPOS.map((edad) => (
                  <Button
                    key={edad}
                    variant={edadSeleccionada === edad ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEdadSeleccionada(edad)}
                  >
                    {edad}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Contexto Específico</Label>
            <Textarea 
              placeholder="Describe el contexto de tus estudiantes, conocimientos previos, etc."
              rows={4}
              value={formData.contextoEspecifico}
              onChange={(e) => setFormData({...formData, contextoEspecifico: e.target.value})}
            />
          </div>

              <Button 
                className="w-full bg-gradient-primary" 
                size="lg"
                onClick={handleGenerarGuia}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generar Guía con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {!guiaGenerada ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Listo para generar tu guía</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Completa el formulario y presiona "Generar Guía con IA" para crear una planificación pedagógica personalizada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Guía Generada
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mr-2">{guiaGenerada.materia}</Badge>
                    <Badge variant="outline">{guiaGenerada.grado}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {guiaGenerada.tema}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {guiaGenerada.duracion} min
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{ __html: guiaGenerada.contenido }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      Editar
                    </Button>
                    <Button className="flex-1">
                      Guardar Guía
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">💡 Consejos para mejores resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Sé específico con los objetivos de aprendizaje</p>
                <p>✓ Menciona el nivel previo de conocimientos de tus alumnos</p>
                <p>✓ Indica si hay recursos específicos que quieras incluir</p>
                <p>✓ Señala cualquier adaptación necesaria para NEE</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

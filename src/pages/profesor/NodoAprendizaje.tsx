import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getNodeContent } from "@/data/nodosContent";
import { 
  Sparkles, 
  RotateCcw, 
  Lightbulb, 
  Copy, 
  Download, 
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Trophy
} from "lucide-react";

export default function ProfesorNodoAprendizaje() {
  const { nodoId } = useParams();
  const navigate = useNavigate();
  
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [attemptCount, setAttemptCount] = useState(0);
  const [feedback, setFeedback] = useState<any>(null);
  const [microEvalAnswers, setMicroEvalAnswers] = useState<Record<string, string>>({});
  const [isEvalComplete, setIsEvalComplete] = useState(false);
  const [nodoData, setNodoData] = useState<any>(null);

  useEffect(() => {
    const nodeContent = getNodeContent(parseInt(nodoId || "1"));
    if (!nodeContent) {
      toast.error("Nodo no encontrado");
      navigate("/profesor/capacitacion");
      return;
    }
    setNodoData(nodeContent);
  }, [nodoId, navigate]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor escribe un prompt");
      return;
    }

    setIsGenerating(true);
    setAttemptCount(attemptCount + 1);

    // Simulación de llamada a IA - en producción usaría Supabase Edge Function
    setTimeout(() => {
      const mockContent = `# Rúbrica de Evaluación: El Sistema Solar
      
## Proyecto de Ciencias Naturales - 5° Básico

### Criterio 1: Contenido Científico
- **Sobresaliente (4)**: Información completa, precisa y ampliada con investigación adicional
- **Bueno (3)**: Información correcta y completa sobre todos los planetas
- **Suficiente (2)**: Información básica con algunos errores menores
- **Insuficiente (1)**: Información incompleta o con errores significativos

### Criterio 2: Presentación Visual
- **Sobresaliente (4)**: Diseño creativo, organizado y visualmente atractivo
- **Bueno (3)**: Presentación clara y ordenada
- **Suficiente (2)**: Presentación básica pero comprensible
- **Insuficiente (1)**: Presentación desorganizada o difícil de seguir

### Criterio 3: Creatividad e Innovación
- **Sobresaliente (4)**: Incluye elementos únicos y creativos que destacan
- **Bueno (3)**: Muestra originalidad en algunos aspectos
- **Suficiente (2)**: Cumple lo básico sin elementos creativos
- **Insuficiente (1)**: Carece de esfuerzo creativo`;

      setGeneratedContent(mockContent);
      
      // Evaluación automática del prompt
      const rating = evaluatePrompt(prompt);
      setFeedback(rating);
      setIsGenerating(false);

      if (rating.total === 5) {
        toast.success("¡Excelente! Has creado un prompt perfecto");
      }
    }, 2000);
  };

  const evaluatePrompt = (text: string): any => {
    if (!nodoData) return { total: 0, suggestions: [] };
    
    const criteria = nodoData.evaluationCriteria;
    const lowerText = text.toLowerCase();
    
    const hasRole = criteria.hasRole.some((term: string) => lowerText.includes(term.toLowerCase()));
    const hasContext = criteria.hasContext.some((term: string) => lowerText.includes(term.toLowerCase()));
    const hasFormat = criteria.hasFormat.some((term: string) => lowerText.includes(term.toLowerCase()));
    const hasCriteria = criteria.hasCriteria.some((term: string) => lowerText.includes(term.toLowerCase()));
    const hasLevels = criteria.hasLevels.some((term: string) => lowerText.includes(term.toLowerCase()));

    return {
      rol: hasRole ? 5 : 2,
      contexto: hasContext ? 5 : 3,
      formato: hasFormat ? 5 : 1,
      criterios: hasCriteria ? 5 : 2,
      total: (hasRole && hasContext && hasFormat && hasCriteria && hasLevels) ? 5 : 3,
      suggestions: [
        !hasRole && "Agrega el rol de la IA (ej: 'Eres un profesor de...')",
        !hasContext && "Especifica el nivel educativo y contexto",
        !hasCriteria && "Detalla los elementos específicos que necesitas",
        !hasLevels && "Especifica detalles importantes del formato",
      ].filter(Boolean),
    };
  };

  const handleMicroEvalAnswer = (questionId: string, value: string) => {
    if (!nodoData) return;
    
    setMicroEvalAnswers({ ...microEvalAnswers, [questionId]: value });
    
    // Verificar si todas las respuestas son correctas
    const allCorrect = nodoData.microeval.every((q: any) => {
      const userAnswer = questionId === q.id ? value : microEvalAnswers[q.id];
      const correctAnswer = q.options.find((opt: any) => opt.correct)?.value;
      return userAnswer === correctAnswer;
    });

    if (Object.keys({ ...microEvalAnswers, [questionId]: value }).length === nodoData.microeval.length && allCorrect) {
      setIsEvalComplete(true);
      toast.success("¡Respuestas correctas! Ahora puedes intentar crear tu prompt");
    }
  };

  const handleSaveToPortfolio = () => {
    toast.success("¡Guardado en tu portafolio! +100 XP");
    // Aquí guardaríamos en Supabase
    navigate("/profesor/capacitacion");
  };

  const getStarColor = (index: number) => {
    if (!feedback) return "text-gray-300";
    return index < feedback.total ? "fill-yellow-400 text-yellow-400" : "text-gray-300";
  };

  if (!nodoData) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <p className="text-muted-foreground">Cargando nodo...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/profesor/capacitacion")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <Badge className="mb-2">{nodoData.module}</Badge>
              <h1 className="text-2xl font-bold">{nodoData.title}</h1>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Intentos</p>
            <p className="text-2xl font-bold">{attemptCount}/5</p>
          </div>
        </div>

        {/* Layout de 3 paneles */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Panel Izquierdo - Teoría y Misión (30%) */}
          <div className="lg:col-span-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📚 Teoría</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nodoData.teoria.map((teoria: any, idx: number) => (
                  <div key={idx} className="p-4 bg-muted rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm">{teoria.title}</h4>
                    {teoria.content && <p className="text-sm text-muted-foreground">{teoria.content}</p>}
                    {teoria.example && <p className="text-sm italic text-muted-foreground">{teoria.example}</p>}
                    {teoria.badExample && (
                      <div className="space-y-2 text-sm">
                        <p className="flex items-start gap-2">
                          <XCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <span className="text-destructive">{teoria.badExample}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span className="text-success">{teoria.goodExample}</span>
                        </p>
                      </div>
                    )}
                    {teoria.tips && (
                      <ul className="text-sm space-y-1">
                        {teoria.tips.map((tip: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-gradient-accent text-white">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🎯 Misión del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{nodoData.mision}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">✍️ Micro-Evaluación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nodoData.microeval.map((question: any) => (
                  <div key={question.id} className="space-y-3">
                    <p className="text-sm font-medium">{question.question}</p>
                    <RadioGroup
                      value={microEvalAnswers[question.id] || ""}
                      onValueChange={(value) => handleMicroEvalAnswer(question.id, value)}
                    >
                      {question.options.map((option: any) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} />
                          <Label htmlFor={`${question.id}-${option.value}`} className="text-sm cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
                {isEvalComplete && (
                  <div className="p-3 bg-success/10 border border-success rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm text-success font-medium">¡Excelente! Continúa con el simulador</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel Central - Simulador (40%) */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Simulador de IA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tu Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Escribe tu prompt aquí... Recuerda incluir: rol, contexto, criterios y formato"
                    className="min-h-[200px]"
                    disabled={!isEvalComplete}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {prompt.length} caracteres
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerate}
                    className="flex-1 bg-gradient-primary"
                    disabled={isGenerating || !isEvalComplete}
                  >
                    {isGenerating ? (
                      <>Generando...</>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generar con IA
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPrompt("");
                      setGeneratedContent("");
                      setFeedback(null);
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                  onClick={() => {
                    setPrompt(nodoData.promptExample);
                    toast.info("Ejemplo cargado. Puedes modificarlo y probar.");
                  }}
                >
                  <Lightbulb className="mr-2 h-4 w-4" />
                  Ver Ejemplo
                </Button>

                {isGenerating && (
                  <div className="p-6 bg-muted rounded-lg text-center">
                    <div className="animate-pulse space-y-3">
                      <Sparkles className="h-8 w-8 mx-auto text-primary" />
                      <p className="text-sm text-muted-foreground">
                        El tutor IA está revisando tu prompt y generando el contenido...
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panel Derecho - Resultado y Feedback (30%) */}
          <div className="lg:col-span-4">
            <Card className="h-full">
              <CardContent className="p-0">
                <Tabs defaultValue="producto" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="producto">📄 Producto</TabsTrigger>
                    <TabsTrigger value="feedback">🎯 Feedback</TabsTrigger>
                  </TabsList>

                  <TabsContent value="producto" className="p-6 space-y-4">
                    {generatedContent ? (
                      <>
                        <div className="prose prose-sm max-w-none">
                          <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                            {generatedContent}
                          </pre>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            <Copy className="mr-2 h-4 w-4" />
                            Copiar
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>El contenido generado aparecerá aquí</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="feedback" className="p-6 space-y-4">
                    {feedback ? (
                      <>
                        <div className="text-center space-y-2">
                          <p className="text-sm text-muted-foreground">Calidad del Prompt</p>
                          <div className="flex justify-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`h-6 w-6 ${getStarColor(i)}`} />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Claridad del rol</span>
                            <span className={feedback.rol === 5 ? "text-success" : "text-warning"}>
                              {feedback.rol === 5 ? "✅ Excelente" : "⚠️ Mejorable"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Especificidad del contexto</span>
                            <span className={feedback.contexto === 5 ? "text-success" : "text-warning"}>
                              {feedback.contexto === 5 ? "✅ Excelente" : "⚠️ Mejorable"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span>Formato solicitado</span>
                            <span className={feedback.formato === 5 ? "text-success" : "text-destructive"}>
                              {feedback.formato === 5 ? "✅ Bien definido" : "❌ Falta detalle"}
                            </span>
                          </div>
                        </div>

                        {feedback.suggestions.length > 0 && (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="font-semibold text-sm mb-2">💡 Sugerencias:</p>
                            <ol className="text-sm space-y-1 list-decimal list-inside">
                              {feedback.suggestions.map((suggestion: string, i: number) => (
                                <li key={i}>{suggestion}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Nivel de Calidad</p>
                          <Progress value={(feedback.total / 5) * 100} className="h-3" />
                          <p className="text-sm text-center mt-2 font-medium">
                            Nivel {feedback.total}/5
                          </p>
                        </div>

                        {feedback.total === 5 && (
                          <div className="p-4 bg-success/10 border border-success rounded-lg space-y-3">
                            <div className="flex items-center gap-2 text-success">
                              <Trophy className="h-5 w-5" />
                              <span className="font-semibold">¡Excelente trabajo!</span>
                            </div>
                            <Button
                              onClick={handleSaveToPortfolio}
                              className="w-full bg-success hover:bg-success/90"
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Guardar en Mi Portafolio
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Genera contenido para ver el feedback</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

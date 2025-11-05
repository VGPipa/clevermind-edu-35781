import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export default function ProfesorEvaluacionInicial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [evaluationResults, setEvaluationResults] = useState({
    nivel: "",
    score: 0,
  });
  const [promptAnswer, setPromptAnswer] = useState("");

  const questions = [
    {
      id: 0,
      type: "multiple",
      question: "¿Qué tan familiarizado estás con el concepto de Inteligencia Artificial en educación?",
      options: [
        { value: "ninguno", label: "No tengo conocimiento previo" },
        { value: "basico", label: "He oído hablar pero no lo he usado" },
        { value: "intermedio", label: "He experimentado ocasionalmente" },
        { value: "avanzado", label: "Lo uso regularmente en mi práctica docente" },
      ],
    },
    {
      id: 1,
      type: "multiple",
      question: "¿Has utilizado herramientas de IA (ChatGPT, Gemini, etc.) para crear contenido educativo?",
      options: [
        { value: "nunca", label: "Nunca" },
        { value: "pocas", label: "Pocas veces" },
        { value: "regularmente", label: "Regularmente" },
        { value: "frecuentemente", label: "Frecuentemente" },
      ],
    },
    {
      id: 2,
      type: "multiple",
      question: "¿Qué es un 'prompt' en el contexto de IA?",
      options: [
        { value: "a", label: "Una aplicación de inteligencia artificial" },
        { value: "b", label: "La instrucción o pregunta que le das a la IA" },
        { value: "c", label: "El resultado que genera la IA" },
        { value: "d", label: "Un tipo de evaluación educativa" },
      ],
    },
    {
      id: 3,
      type: "multiple",
      question: "¿Cuál de estos elementos es MÁS importante en un prompt efectivo?",
      options: [
        { value: "a", label: "Que sea muy largo y detallado" },
        { value: "b", label: "Que incluya contexto claro y específico" },
        { value: "c", label: "Que use lenguaje técnico complejo" },
        { value: "d", label: "Que sea lo más breve posible" },
      ],
    },
    {
      id: 4,
      type: "prompt",
      question: "Escribe un prompt para pedirle a una IA que cree una rúbrica de evaluación para un proyecto de Ciencias sobre 'El Ciclo del Agua' para 4° básico.",
      placeholder: "Escribe tu prompt aquí...",
    },
  ];

  const totalSteps = questions.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.type === "multiple" && !answers[currentStep]) {
      toast.error("Por favor selecciona una respuesta");
      return;
    }
    
    if (currentQuestion.type === "prompt" && !promptAnswer.trim()) {
      toast.error("Por favor escribe un prompt");
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Evaluación completada - calcular nivel
      const totalScore = calculateScore();
      const nivel = determineLevel(totalScore);
      
      // Guardar en localStorage temporalmente (en producción iría a DB)
      const results = {
        completed: true,
        nivel,
        score: totalScore,
        date: new Date().toISOString(),
        answers,
        promptAnswer,
      };
      
      localStorage.setItem("evaluacion_inicial", JSON.stringify(results));
      
      toast.success(`¡Evaluación completada! Nivel detectado: ${nivel}`);
      navigate("/profesor/capacitacion");
    }
  };

  const calculateScore = () => {
    let score = 0;
    
    // Pregunta 0: familiaridad con IA
    if (answers[0] === "avanzado") score += 3;
    else if (answers[0] === "intermedio") score += 2;
    else if (answers[0] === "basico") score += 1;
    
    // Pregunta 1: uso de herramientas
    if (answers[1] === "frecuentemente") score += 3;
    else if (answers[1] === "regularmente") score += 2;
    else if (answers[1] === "pocas") score += 1;
    
    // Pregunta 2: qué es un prompt (respuesta correcta: b)
    if (answers[2] === "b") score += 2;
    
    // Pregunta 3: elementos de prompt efectivo (respuesta correcta: b)
    if (answers[3] === "b") score += 2;
    
    // Pregunta 4: calidad del prompt escrito
    const promptQuality = evaluatePromptQuality(promptAnswer);
    score += promptQuality;
    
    return score;
  };

  const evaluatePromptQuality = (text: string) => {
    let quality = 0;
    const lower = text.toLowerCase();
    
    if (lower.includes("profesor") || lower.includes("eres") || lower.includes("actúa")) quality += 1;
    if (lower.includes("4") || lower.includes("cuarto") || lower.includes("básico")) quality += 1;
    if (lower.includes("rúbrica")) quality += 1;
    if (lower.includes("criterio") || lower.includes("nivel")) quality += 1;
    if (text.length > 100) quality += 1; // Prompt detallado
    
    return quality;
  };

  const determineLevel = (score: number) => {
    if (score >= 11) return "Avanzado";
    if (score >= 6) return "Intermedio";
    return "Básico";
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = questions[currentStep];

  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-3xl w-full">
          <CardContent className="p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold">Evaluación Inicial</h1>
                <span className="text-sm text-muted-foreground">
                  Pregunta {currentStep + 1} de {totalSteps}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-6">{currentQuestion.question}</h2>

              {currentQuestion.type === "multiple" && (
                <RadioGroup
                  value={answers[currentStep] || ""}
                  onValueChange={(value) =>
                    setAnswers({ ...answers, [currentStep]: value })
                  }
                  className="space-y-3"
                >
                  {currentQuestion.options?.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.type === "prompt" && (
                <div className="space-y-4">
                  <Textarea
                    value={promptAnswer}
                    onChange={(e) => setPromptAnswer(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className="min-h-[200px] text-base"
                  />
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">💡 Consejos para un buen prompt:</p>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• Define el rol de la IA (ej: "Eres un profesor de ciencias")</li>
                      <li>• Especifica el contexto (grado, materia, tema)</li>
                      <li>• Describe el formato deseado (rúbrica con criterios específicos)</li>
                      <li>• Incluye detalles relevantes (número de criterios, niveles de desempeño)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button onClick={handleNext} className="bg-gradient-primary">
                {currentStep === totalSteps - 1 ? (
                  <>
                    Finalizar
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

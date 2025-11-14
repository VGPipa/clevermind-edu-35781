import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, FileText, CheckCircle2, AlertCircle, Target, Clock } from "lucide-react";
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
  const [claseId, setClaseId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    id_tema: "",
    id_grupo: "",
    fecha_programada: new Date().toISOString().split('T')[0],
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

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!formData.id_tema || !formData.id_grupo || !edadSeleccionada || metodologiasSeleccionadas.length === 0) {
        toast.error("Por favor completa los campos obligatorios");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('crear-clase', {
          body: {
            id_tema: formData.id_tema,
            id_grupo: formData.id_grupo,
            fecha_programada: formData.fecha_programada,
            duracion_minutos: parseInt(formData.duracionClase),
            grupo_edad: edadSeleccionada,
            metodologia: metodologiasSeleccionadas.join(', '),
            contexto: formData.contextoEspecifico,
            areas_transversales: null
          }
        });

        if (error) throw error;

        setClaseId(data.class.id);
        setCurrentStep(2);
        toast.success("Contexto guardado exitosamente");
      } catch (error: any) {
        console.error('Error creating class:', error);
        toast.error(error.message || "Error al crear la clase");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 2) {
      if (!claseId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generar-guia-clase', {
          body: { id_clase: claseId }
        });

        if (error) throw error;

        setGuiaGenerada(data.guide);
        setCurrentStep(3);
        toast.success("Guía generada exitosamente");
      } catch (error: any) {
        toast.error(error.message || "Error al generar la guía");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 3) {
      if (!claseId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generar-evaluacion', {
          body: { id_clase: claseId, tipo: 'pre' }
        });

        if (error) throw error;

        setPreguntasPre(data.preguntas);
        setCurrentStep(4);
        toast.success("Evaluación pre generada exitosamente");
      } catch (error: any) {
        toast.error(error.message || "Error al generar evaluación");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 4) {
      if (!claseId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generar-evaluacion', {
          body: { id_clase: claseId, tipo: 'post' }
        });

        if (error) throw error;

        setPreguntasPost(data.preguntas);
        setCurrentStep(5);
        toast.success("Evaluación post generada exitosamente");
      } catch (error: any) {
        toast.error(error.message || "Error al generar evaluación");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 5) {
      if (!claseId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('validar-clase', {
          body: { id_clase: claseId }
        });

        if (error) throw error;

        if (data.is_valid) {
          toast.success("Clase confirmada y programada exitosamente!");
        } else {
          toast.error("Faltan completar algunos pasos");
        }
      } catch (error: any) {
        toast.error(error.message || "Error al validar clase");
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div>
          <Label>Tema *</Label>
          <Select value={formData.id_tema} onValueChange={(val) => setFormData({...formData, id_tema: val})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un tema" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tema-1">Álgebra Básica</SelectItem>
              <SelectItem value="tema-2">Comprensión Lectora</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Grupo *</Label>
          <Select value={formData.id_grupo} onValueChange={(val) => setFormData({...formData, id_grupo: val})}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grupo-1">7mo A</SelectItem>
              <SelectItem value="grupo-2">7mo B</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Metodologías de Pensamiento Crítico *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {METODOLOGIAS.map((met) => (
              <Badge
                key={met}
                variant={metodologiasSeleccionadas.includes(met) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleMetodologia(met)}
              >
                {met}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <Label>Duración de la Clase (minutos) *</Label>
          <Input
            type="number"
            value={formData.duracionClase}
            onChange={(e) => setFormData({...formData, duracionClase: e.target.value})}
          />
        </div>

        <div>
          <Label>Grupo de Edad *</Label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {EDAD_GRUPOS.map((edad) => (
              <Button
                key={edad}
                variant={edadSeleccionada === edad ? "default" : "outline"}
                onClick={() => setEdadSeleccionada(edad)}
              >
                {edad}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label>Contexto Específico</Label>
          <Textarea
            value={formData.contextoEspecifico}
            onChange={(e) => setFormData({...formData, contextoEspecifico: e.target.value})}
            rows={4}
            placeholder="Describe el contexto particular de tus estudiantes..."
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {!guiaGenerada ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">La guía se generará automáticamente al avanzar</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Target className="h-5 w-5" />
              Objetivos de Aprendizaje
            </h3>
            <ul className="space-y-2">
              {guiaGenerada.objetivos?.map((obj: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5" />
              Estructura de la Clase
            </h3>
            <div className="space-y-2">
              {guiaGenerada.estructura?.map((fase: any, i: number) => (
                <div key={i} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{fase.actividad}</span>
                    <Badge variant="outline">{fase.tiempo} min</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{fase.descripcion}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Preguntas Socráticas</h3>
            <ul className="space-y-1">
              {guiaGenerada.preguntas_socraticas?.map((preg: string, i: number) => (
                <li key={i} className="text-sm">• {preg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Evaluación diagnóstica generada automáticamente</p>
      {preguntasPre.map((preg, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Pregunta {i + 1}</CardTitle>
              <Badge>{preg.tipo}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p>{preg.texto_pregunta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <AlertCircle className="inline h-4 w-4 mr-1" />
          Las preguntas post-clase son más complejas para medir el progreso real
        </p>
      </div>
      {preguntasPost.map((preg, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">Pregunta {i + 1}</CardTitle>
              <Badge variant="secondary">{preg.tipo}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p>{preg.texto_pregunta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Contexto definido</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Guía de clase generada</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Evaluación pre lista</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Evaluación post lista</span>
        </div>
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle2 className="h-5 w-5" />
          <span>Notificaciones configuradas</span>
        </div>
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <p className="text-green-800">
            ¡Todo listo! La clase está preparada y lista para ser ejecutada.
          </p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8" />
            Generar Clase con IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Crea clases centradas en el desarrollo del pensamiento crítico con ayuda de IA
          </p>
        </div>

        <ProgressBar steps={STEPS} currentStep={currentStep} />

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>{STEPS[currentStep - 1].label}</CardTitle>
              <CardDescription>
                Completa la información para este paso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}
              {currentStep === 4 && renderStep4()}
              {currentStep === 5 && renderStep5()}

              <div className="flex gap-2 mt-6">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={loading}
                  >
                    Anterior
                  </Button>
                )}
                <Button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {currentStep === 5 ? 'Confirmar y Programar' : 'Continuar'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consejos para Mejores Resultados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>• Sé específico en el contexto de tus estudiantes</p>
              <p>• Selecciona las metodologías más apropiadas para tu grupo</p>
              <p>• Revisa y ajusta el contenido generado según necesites</p>
              <p>• Las evaluaciones pre y post están diseñadas para medir el progreso real</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

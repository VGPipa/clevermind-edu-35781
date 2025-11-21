import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { useQuery } from "@tanstack/react-query";
import { SeleccionarSesionSection } from "@/components/profesor/SeleccionarSesionSection";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const temaId = searchParams.get('tema');
  const claseIdParam = searchParams.get('clase');
  const extraordinaria = searchParams.get('extraordinaria') === 'true';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [metodologiasSeleccionadas, setMetodologiasSeleccionadas] = useState<string[]>([]);
  const [edadSeleccionada, setEdadSeleccionada] = useState("");
  const [claseId, setClaseId] = useState<string | null>(claseIdParam);
  
  const [formData, setFormData] = useState({
    id_tema: temaId || "",
    id_grupo: "",
    fecha_programada: new Date().toISOString().split('T')[0],
    duracionClase: "90",
    contextoEspecifico: "",
  });

  const esSesionPreprogramada = !!claseIdParam && !extraordinaria;

  // Fetch tema data if temaId is provided
  const { data: temaData, isLoading: loadingTema } = useQuery({
    queryKey: ['tema', temaId],
    queryFn: async () => {
      if (!temaId) return null;
      
      const response = await (supabase as any)
        .from('temas')
        .select(`
          *,
          materias!inner (
            nombre,
            plan_anual!inner (
              grado,
              id_institucion
            )
          )
        `)
        .eq('id', temaId)
        .single();
      
      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!temaId,
  });

  // Fetch clase data when viene ?clase=<id> para prellenar el formulario
  const { data: claseData } = useQuery({
    queryKey: ['clase', claseIdParam],
    queryFn: async () => {
      if (!claseIdParam) return null;

      const response = await (supabase as any)
        .from('clases')
        .select(`
          *,
          temas!inner (
            id,
            nombre,
            descripcion,
            duracion_estimada,
            materias!inner (
              nombre,
              plan_anual!inner (
                grado,
                id_institucion
              )
            )
          ),
          grupos!inner (
            id,
            nombre,
            grado,
            seccion
          )
        `)
        .eq('id', claseIdParam)
        .single();

      if (response.error) throw response.error;
      return response.data;
    },
    enabled: esSesionPreprogramada,
  });

  // Fetch grupos for the profesor
  const { data: gruposData } = useQuery({
    queryKey: ['grupos-profesor'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user');

      const profesorResponse = await (supabase as any)
        .from('profesores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profesorResponse.error) throw profesorResponse.error;

      const asignacionesResponse = await (supabase as any)
        .from('asignaciones_profesor')
        .select(`
          id_grupo,
          grupos (
            id,
            nombre,
            grado,
            seccion
          )
        `)
        .eq('id_profesor', profesorResponse.data.id);

      if (asignacionesResponse.error) throw asignacionesResponse.error;
      return asignacionesResponse.data?.map((a: any) => a.grupos).filter(Boolean) || [];
    },
  });

  // Verificar guía solo cuando viene un tema específico
  useEffect(() => {
    if (temaId && !extraordinaria) {
      // Check if tema has guía maestra
      checkTemaGuia();
    }
  }, [claseIdParam, temaId, extraordinaria]);

  const checkTemaGuia = async () => {
    if (!temaId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profesor } = await supabase
        .from('profesores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profesor) return;

      const { data: guiaTema } = await supabase
        .from('guias_tema')
        .select('id')
        .eq('id_tema', temaId)
        .eq('id_profesor', profesor.id)
        .single();

      if (!guiaTema) {
        // No tiene guía, redirigir a temas
        toast.error("Este tema no tiene una guía maestra. Debes crear la guía maestra primero desde la sección de Temas en Planificación.");
        navigate('/profesor/planificacion');
      }
    } catch (error) {
      console.error('Error checking tema guía:', error);
    }
  };

  // Pre-fill form when clase data is loaded (sesión ya programada)
  useEffect(() => {
    if (claseData && esSesionPreprogramada) {
      setClaseId(claseData.id);
      setFormData(prev => ({
        ...prev,
        id_tema: claseData.id_tema,
        id_grupo: claseData.id_grupo,
        fecha_programada: claseData.fecha_programada
          ? claseData.fecha_programada.split('T')[0]
          : prev.fecha_programada,
        duracionClase: String(claseData.duracion_minutos || prev.duracionClase),
        contextoEspecifico: claseData.contexto || prev.contextoEspecifico,
      }));

      if (claseData.grupo_edad) {
        setEdadSeleccionada(claseData.grupo_edad);
      }

      if (claseData.metodologia) {
        setMetodologiasSeleccionadas(
          claseData.metodologia
            .split(',')
            .map((m: string) => m.trim())
            .filter(Boolean)
        );
      }

      if (claseData.numero_sesion) {
        setNumeroSesion(claseData.numero_sesion);
      }
    }
  }, [claseData, esSesionPreprogramada]);

  // Pre-fill form when tema data is loaded
  useEffect(() => {
    if (temaData) {
      setFormData(prev => ({
        ...prev,
        id_tema: temaData.id,
        duracionClase: temaData.duracion_estimada ? String(temaData.duracion_estimada * 60) : "90",
        contextoEspecifico: temaData.descripcion || "",
      }));

      // Set recommended sessions based on duracion_estimada (in weeks)
      const sesiones = temaData.duracion_estimada || 1;
      setSesionesRecomendadas(sesiones);

      // Set default age group based on grade
      const grado = temaData.materias?.plan_anual?.grado;
      if (grado) {
        const gradeNum = parseInt(grado);
        if (gradeNum >= 1 && gradeNum <= 2) setEdadSeleccionada("5-6");
        else if (gradeNum >= 3 && gradeNum <= 4) setEdadSeleccionada("7-8");
        else if (gradeNum >= 5 && gradeNum <= 6) setEdadSeleccionada("9-10");
        else setEdadSeleccionada("11-12");
      }
    }
  }, [temaData]);

  const [guiaGenerada, setGuiaGenerada] = useState<any>(null);
  const [preguntasPre, setPreguntasPre] = useState<any[]>([]);
  const [preguntasPost, setPreguntasPost] = useState<any[]>([]);
  const [sesionesRecomendadas, setSesionesRecomendadas] = useState<number>(1);
  const [numeroSesion, setNumeroSesion] = useState<number | null>(null);

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
        // Si venimos desde una sesión ya programada, solo actualizamos la fila existente
        if (claseId && esSesionPreprogramada) {
          const { data, error } = await (supabase as any)
            .from('clases')
            .update({
              id_tema: formData.id_tema,
              id_grupo: formData.id_grupo,
              fecha_programada: formData.fecha_programada,
              duracion_minutos: parseInt(formData.duracionClase),
              grupo_edad: edadSeleccionada,
              metodologia: metodologiasSeleccionadas.join(', '),
              contexto: formData.contextoEspecifico,
              estado: 'generando_clase',
            })
            .eq('id', claseId)
            .select('id, numero_sesion')
            .single();

          if (error) throw error;

          setClaseId(data.id);
          setNumeroSesion(data.numero_sesion ?? numeroSesion);
          toast.success("Contexto actualizado para la sesión programada");
        } else {
          // Caso clase nueva / extraordinaria: crear clase desde cero
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
          setNumeroSesion(data.class.numero_sesion);
          
          // Show session recommendation if available
          if (data.sesiones_recomendadas) {
            toast.success(
              `Clase creada (Sesión ${data.sesion_actual}/${data.sesiones_recomendadas}). ${data.sesiones_recomendadas > 1 ? `Se recomiendan ${data.sesiones_recomendadas} sesiones para este tema.` : ''}`,
              { duration: 4000 }
            );
          } else {
            toast.success("Contexto guardado exitosamente");
          }
        }

        setCurrentStep(2);
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
          body: {
            id_clase: claseId,
            opciones_metodologia: metodologiasSeleccionadas,
            contexto_especifico: formData.contextoEspecifico
          }
        });

        if (error) throw error;

        setGuiaGenerada(data.guide);
        setCurrentStep(3);
        toast.success(`Guía generada exitosamente (Versión ${data.version_numero})`);
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
      {/* Session Recommendation */}
      {temaData && sesionesRecomendadas > 1 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Recomendación de Sesiones</h3>
                <p className="text-sm text-blue-800">
                  Este tema tiene una duración estimada de <strong>{sesionesRecomendadas} semanas</strong>.
                  Se recomienda crear <strong>{sesionesRecomendadas} sesiones/clases</strong> para cubrir todo el contenido.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Puedes crear las sesiones restantes desde el dashboard después de crear esta primera.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <div>
          <Label>Tema *</Label>
          {esSesionPreprogramada && claseData ? (
            <div className="p-3 rounded-md border bg-muted flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{claseData.temas?.nombre}</p>
                {claseData.temas?.descripcion && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {claseData.temas.descripcion}
                  </p>
                )}
              </div>
              <Badge variant="outline">Bloqueado</Badge>
            </div>
          ) : (
            <>
              <Select value={formData.id_tema} onValueChange={(val) => setFormData({...formData, id_tema: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tema" />
                </SelectTrigger>
                <SelectContent>
                  {temaData ? (
                    <SelectItem value={temaData.id}>{temaData.nombre}</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="tema-1">Álgebra Básica</SelectItem>
                      <SelectItem value="tema-2">Comprensión Lectora</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {temaData && (
                <p className="text-xs text-muted-foreground mt-1">
                  {temaData.descripcion || 'Sin descripción'}
                </p>
              )}
            </>
          )}
        </div>

        <div>
          <Label>Grupo *</Label>
          {esSesionPreprogramada && claseData ? (
            <div className="p-3 rounded-md border bg-muted flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{claseData.grupos?.nombre}</p>
                <p className="text-xs text-muted-foreground">
                  {claseData.grupos?.grado}° • Sección {claseData.grupos?.seccion}
                </p>
              </div>
              <Badge variant="outline">Bloqueado</Badge>
            </div>
          ) : (
            <Select value={formData.id_grupo} onValueChange={(val) => setFormData({...formData, id_grupo: val})}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un grupo" />
              </SelectTrigger>
              <SelectContent>
                {(gruposData || []).map((grupo: any) => (
                  <SelectItem key={grupo.id} value={grupo.id}>
                    {grupo.nombre} - {grupo.grado}° {grupo.seccion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div>
          <Label>Metodologías de Pensamiento Crítico *</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Selecciona una o más metodologías que utilizarás en esta clase
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {METODOLOGIAS.map((met) => (
              <Badge
                key={met}
                variant={metodologiasSeleccionadas.includes(met) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => toggleMetodologia(met)}
              >
                {met}
              </Badge>
            ))}
          </div>
          {metodologiasSeleccionadas.length === 0 && (
            <p className="text-xs text-destructive mt-1">Selecciona al menos una metodología</p>
          )}
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
          <Label>Contexto Específico *</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Describe el contexto particular de tus estudiantes, sus necesidades, conocimientos previos, o cualquier información relevante para personalizar la guía de clase.
          </p>
          <Textarea
            value={formData.contextoEspecifico}
            onChange={(e) => setFormData({...formData, contextoEspecifico: e.target.value})}
            rows={5}
            placeholder="Ejemplo: Los estudiantes tienen conocimientos básicos de álgebra pero necesitan reforzar la resolución de ecuaciones. Algunos estudiantes tienen dificultades con fracciones..."
            className="resize-none"
          />
          {formData.contextoEspecifico.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {formData.contextoEspecifico.length} caracteres
            </p>
          )}
        </div>

        {numeroSesion && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Sesión {numeroSesion}</p>
            <p className="text-xs text-muted-foreground">
              Esta será la sesión número {numeroSesion} de este tema
            </p>
          </div>
        )}
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

  const sinParametros = !claseIdParam && !temaId && !extraordinaria;

  return (
    <AppLayout>
      {sinParametros ? (
        <SeleccionarSesionSection
          onSeleccionarSesion={(sesionId) => {
            navigate(`/profesor/generar-clase?clase=${sesionId}`);
          }}
          onCrearExtraordinaria={() => {
            navigate("/profesor/generar-clase?extraordinaria=true");
          }}
          onIrAPlanificacion={() => {
            navigate("/profesor/planificacion");
          }}
        />
      ) : (
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
      )}
    </AppLayout>
  );
}

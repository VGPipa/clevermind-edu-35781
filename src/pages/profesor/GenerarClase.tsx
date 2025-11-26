import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, FileText, CheckCircle2, AlertCircle, Target, Clock, Plus, X, ChevronDown, Lock, Monitor, Clipboard, Globe, Smartphone, Blocks, Book } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
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

const EDADES_MEJORADAS = [
  { value: "5-6", label: "5-6 años", nivel: "Preescolar/1° Básico", icon: "🎨" },
  { value: "7-8", label: "7-8 años", nivel: "2°-3° Básico", icon: "📚" },
  { value: "9-10", label: "9-10 años", nivel: "4°-5° Básico", icon: "🔬" },
  { value: "11-12", label: "11-12 años", nivel: "6°-7° Básico", icon: "💡" },
  { value: "13-14", label: "13-14 años", nivel: "8° Básico - 1° Medio", icon: "🎯" },
  { value: "15-16", label: "15-16 años", nivel: "2°-3° Medio", icon: "📊" },
  { value: "17+", label: "17+ años", nivel: "4° Medio / Superior", icon: "🎓" },
] as const;

const RECURSOS_OPTIONS = [
  { value: "proyector_tv", label: "Proyector/TV", icon: Monitor },
  { value: "pizarra", label: "Pizarra", icon: Clipboard },
  { value: "internet", label: "Internet", icon: Globe },
  { value: "dispositivos_alumnos", label: "Dispositivos de los alumnos", icon: Smartphone },
  { value: "material_concreto", label: "Material concreto", icon: Blocks },
  { value: "libros", label: "Libros", icon: Book },
  { value: "otro", label: "Otro", icon: Plus },
] as const;

const DESCRIPCIONES_METODOLOGIAS: Record<string, string> = {
  "Aprendizaje Basado en Casos": "Análisis de situaciones reales para desarrollar habilidades de resolución de problemas.",
  "Método Socrático": "Diálogo guiado con preguntas para que los estudiantes descubran el conocimiento por sí mismos.",
  "Resolución de Problemas": "Enfoque estructurado para abordar desafíos paso a paso.",
  "Debate Estructurado": "Discusión organizada que fomenta el pensamiento crítico y la argumentación.",
  "Análisis Comparativo": "Comparación sistemática de conceptos, ideas o situaciones para identificar similitudes y diferencias.",
};

const ADAPTACIONES_OPTIONS = [
  { value: "ninguna", label: "Ninguna" },
  { value: "tdah", label: "TDAH" },
  { value: "dislexia", label: "Dislexia" },
  { value: "altas_capacidades", label: "Altas capacidades" },
  { value: "tea", label: "TEA" },
  { value: "rezago", label: "Rezago escolar" },
  { value: "discapacidad_sensorial", label: "Discapacidad auditiva/visual" },
  { value: "otro", label: "Otro" },
] as const;

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
  const [errores, setErrores] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    id_tema: temaId || "",
    id_grupo: "",
    fecha_programada: new Date().toISOString().split('T')[0],
    duracionClase: "90",
    contextoEspecifico: "",
    objetivoEspecifico: "",
    recursosSeleccionados: [] as string[],
    recursoOtro: "",
    adaptacionesSeleccionadas: [] as string[],
    adaptacionOtra: "",
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
          ),
          guias_tema!inner (
            id,
            estructura_sesiones
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

      let datosPrelim = null;
      if (Array.isArray(claseData.guias_tema?.estructura_sesiones) && claseData.numero_sesion) {
        datosPrelim = claseData.guias_tema.estructura_sesiones.find(
          (sesion: any) => sesion.numero === claseData.numero_sesion
        );
      }
      const observacionesExtras = parseObservacionesPayload(claseData.observaciones);

      setFormData(prev => ({
        ...prev,
        id_tema: claseData.id_tema,
        id_grupo: claseData.id_grupo,
        fecha_programada: claseData.fecha_programada
          ? claseData.fecha_programada.split('T')[0]
          : prev.fecha_programada,
        duracionClase: String(
          claseData.duracion_minutos ||
          datosPrelim?.duracion_sugerida ||
          prev.duracionClase
        ),
        contextoEspecifico:
          claseData.contexto ||
          observacionesExtras?.contexto_especifico ||
          datosPrelim?.contexto_preliminar ||
          prev.contextoEspecifico,
        objetivoEspecifico: observacionesExtras?.objetivo_especifico ?? prev.objetivoEspecifico,
        recursosSeleccionados:
          ((Array.isArray(observacionesExtras?.recursos_keys)
            ? observacionesExtras?.recursos_keys
            : mapLabelsToValues(observacionesExtras?.recursos_labels, RECURSOS_OPTIONS)) ??
            prev.recursosSeleccionados),
        recursoOtro: observacionesExtras?.recurso_otro ?? prev.recursoOtro,
        adaptacionesSeleccionadas:
          ((Array.isArray(observacionesExtras?.adaptaciones_keys)
            ? observacionesExtras?.adaptaciones_keys
            : mapLabelsToValues(observacionesExtras?.adaptaciones_labels, ADAPTACIONES_OPTIONS)) ??
            prev.adaptacionesSeleccionadas),
        adaptacionOtra: observacionesExtras?.adaptacion_otra ?? prev.adaptacionOtra,
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
    if (!temaData || esSesionPreprogramada) return;

    setFormData(prev => ({
      ...prev,
      id_tema: temaData.id,
      duracionClase: temaData.duracion_estimada ? String(temaData.duracion_estimada * 60) : prev.duracionClase,
      contextoEspecifico: prev.contextoEspecifico || temaData.descripcion || "",
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
  }, [temaData, esSesionPreprogramada]);

  const [guiaGenerada, setGuiaGenerada] = useState<any>(null);
  const [preguntasPre, setPreguntasPre] = useState<any[]>([]);
  const [preguntasPost, setPreguntasPost] = useState<any[]>([]);
  const [sesionesRecomendadas, setSesionesRecomendadas] = useState<number>(1);
  const [numeroSesion, setNumeroSesion] = useState<number | null>(null);
  const [mostrarInputMetodologia, setMostrarInputMetodologia] = useState(false);
  const [metodologiaPersonalizada, setMetodologiaPersonalizada] = useState("");

  const mapValuesToLabels = (values: string[], options: readonly { value: string; label: string }[]) =>
    values.map((value) => options.find((option) => option.value === value)?.label || value);

  const mapLabelsToValues = (labels: string[] | undefined, options: readonly { value: string; label: string }[]) => {
    if (!labels) return undefined;
    return labels.map((label) => options.find((option) => option.label === label)?.value || label);
  };

  const buildExtendedContext = () => ({
    version: 2,
    objetivo_especifico: formData.objetivoEspecifico,
    recursos_keys: formData.recursosSeleccionados,
    recursos_labels: mapValuesToLabels(formData.recursosSeleccionados, RECURSOS_OPTIONS),
    recurso_otro: formData.recursoOtro,
    adaptaciones_keys: formData.adaptacionesSeleccionadas,
    adaptaciones_labels: mapValuesToLabels(formData.adaptacionesSeleccionadas, ADAPTACIONES_OPTIONS),
    adaptacion_otra: formData.adaptacionOtra,
    contexto_especifico: formData.contextoEspecifico,
  });

  const parseObservacionesPayload = (raw: any) => {
    if (!raw) return null;
    try {
      if (typeof raw === "string") {
        return JSON.parse(raw);
      }
      return raw;
    } catch (error) {
      console.warn("No se pudo parsear observaciones:", error);
      return null;
    }
  };

  const toggleRecurso = (value: string) => {
    setFormData((prev) => {
      let updated = prev.recursosSeleccionados.includes(value)
        ? prev.recursosSeleccionados.filter((item) => item !== value)
        : [...prev.recursosSeleccionados, value];

      if (value === "otro" && !updated.includes("otro")) {
        return { ...prev, recursosSeleccionados: updated, recursoOtro: "" };
      }

      return { ...prev, recursosSeleccionados: updated };
    });
  };

  const toggleAdaptacion = (value: string) => {
    setFormData((prev) => {
      let updated = [...prev.adaptacionesSeleccionadas];

      if (updated.includes(value)) {
        updated = updated.filter((item) => item !== value);
      } else if (value === "ninguna") {
        updated = ["ninguna"];
        // Limpiar adaptacionOtra cuando se selecciona "ninguna"
        return { ...prev, adaptacionesSeleccionadas: updated, adaptacionOtra: "" };
      } else {
        updated = updated.filter((item) => item !== "ninguna");
        updated.push(value);
      }

      if (value === "otro" && !updated.includes("otro")) {
        return { ...prev, adaptacionesSeleccionadas: updated, adaptacionOtra: "" };
      }

      return { ...prev, adaptacionesSeleccionadas: updated };
    });
  };

  const validarCampo = (campo: string, valor: any) => {
    const nuevosErrores = { ...errores };
    
    if (campo === 'metodologias' && (!valor || valor.length === 0)) {
      nuevosErrores.metodologias = "Selecciona al menos una metodología";
    } else if (campo === 'edad' && !valor) {
      nuevosErrores.edad = "Selecciona un grupo de edad";
    } else if (campo === 'tema' && !valor) {
      nuevosErrores.tema = "Selecciona un tema";
    } else if (campo === 'grupo' && !valor) {
      nuevosErrores.grupo = "Selecciona un grupo";
    } else {
      delete nuevosErrores[campo];
    }
    
    setErrores(nuevosErrores);
  };

  const toggleMetodologia = (metodologia: string) => {
    const nuevasMetodologias = metodologiasSeleccionadas.includes(metodologia)
      ? metodologiasSeleccionadas.filter(m => m !== metodologia)
      : [...metodologiasSeleccionadas, metodologia];
    
    setMetodologiasSeleccionadas(nuevasMetodologias);
    validarCampo('metodologias', nuevasMetodologias);
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!formData.id_tema || !formData.id_grupo || !edadSeleccionada || metodologiasSeleccionadas.length === 0 || !formData.contextoEspecifico.trim()) {
        toast.error("Por favor completa los campos obligatorios");
        return;
      }
      if (formData.recursosSeleccionados.includes("otro") && !formData.recursoOtro.trim()) {
        toast.error("Describe el recurso adicional que seleccionaste como 'Otro'.");
        return;
      }
      if (formData.adaptacionesSeleccionadas.includes("otro") && !formData.adaptacionOtra.trim()) {
        toast.error("Describe la adaptación adicional que seleccionaste como 'Otro'.");
        return;
      }

      setLoading(true);
      try {
        const extendedContext = buildExtendedContext();
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
              observaciones: JSON.stringify(extendedContext),
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
              observaciones: JSON.stringify(extendedContext),
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

  // Extraer datos preliminares de la sesión
  const datosPreliminares = useMemo(() => {
    if (!claseData || !claseData.guias_tema?.estructura_sesiones || !claseData.numero_sesion) {
      return null;
    }
    
    const estructuraSesiones = Array.isArray(claseData.guias_tema.estructura_sesiones)
      ? claseData.guias_tema.estructura_sesiones
      : [];
    
    return estructuraSesiones.find(
      (sesion: any) => sesion.numero === claseData.numero_sesion
    );
  }, [claseData]);

  const recursosSeleccionadosLabels = useMemo(
    () => mapValuesToLabels(formData.recursosSeleccionados, RECURSOS_OPTIONS),
    [formData.recursosSeleccionados]
  );

  const adaptacionesSeleccionadasLabels = useMemo(
    () => mapValuesToLabels(formData.adaptacionesSeleccionadas, ADAPTACIONES_OPTIONS),
    [formData.adaptacionesSeleccionadas]
  );

  const customMetodologias = useMemo(
    () => metodologiasSeleccionadas.filter((met) => !METODOLOGIAS.includes(met)),
    [metodologiasSeleccionadas]
  );

  const seccion1Completa = useMemo(() => {
    return !!formData.id_tema && !!formData.id_grupo && 
           !!formData.fecha_programada && !!formData.duracionClase;
  }, [formData.id_tema, formData.id_grupo, formData.fecha_programada, formData.duracionClase]);

  const seccion2Completa = useMemo(() => {
    return !!edadSeleccionada && formData.adaptacionesSeleccionadas.length > 0;
  }, [edadSeleccionada, formData.adaptacionesSeleccionadas]);

  const seccion3Completa = useMemo(() => {
    return metodologiasSeleccionadas.length > 0;
  }, [metodologiasSeleccionadas]);

  const progresoStep1 = useMemo(() => {
    const camposObligatorios = [
      !!formData.id_tema,
      !!formData.id_grupo,
      !!formData.fecha_programada,
      !!formData.duracionClase,
      metodologiasSeleccionadas.length > 0,
      !!edadSeleccionada,
      !!formData.contextoEspecifico.trim(),
    ];
    const completados = camposObligatorios.filter(Boolean).length;
    return (completados / camposObligatorios.length) * 100;
  }, [formData, metodologiasSeleccionadas, edadSeleccionada]);

  const handleAgregarMetodologiaPersonalizada = () => {
    const nueva = metodologiaPersonalizada.trim();
    if (!nueva) {
      toast.error("Ingresa una metodología para agregarla.");
      return;
    }

    setMetodologiasSeleccionadas((prev) =>
      prev.includes(nueva) ? prev : [...prev, nueva]
    );
    setMetodologiaPersonalizada("");
    setMostrarInputMetodologia(false);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Banner de Recomendación */}
      {temaData && sesionesRecomendadas > 1 && !esSesionPreprogramada && (
        <div className="bg-blue-50/50 border-l-4 border-blue-400 px-4 py-2 mb-4 rounded-r">
          <p className="text-sm text-blue-800">
            <strong>💡 Recomendación:</strong> Este tema sugiere {sesionesRecomendadas} sesiones para cubrir todo el contenido.
          </p>
        </div>
      )}

      {/* Banner de Datos Preliminares */}
      {esSesionPreprogramada && datosPreliminares && (
        <div className="bg-green-50/50 border-l-4 border-green-400 px-4 py-2 mb-4 rounded-r">
          <p className="text-sm text-green-800">
            <strong>📋 Datos Preliminares Sesión {claseData?.numero_sesion}:</strong>{" "}
            {datosPreliminares.duracion_sugerida && `Duración sugerida: ${datosPreliminares.duracion_sugerida} min`}
            {datosPreliminares.titulo_preliminar && ` • ${datosPreliminares.titulo_preliminar}`}
          </p>
        </div>
      )}

      {/* Barra de Progreso */}
      <Card className="mb-6">
        <CardHeader>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progreso del formulario</span>
              <span>{Math.round(progresoStep1)}% completado</span>
            </div>
            <Progress value={progresoStep1} className="h-1.5" />
          </div>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={["seccion-1"]} className="w-full">
        {/* SECCIÓN 1: Información Básica */}
        <AccordionItem value="seccion-1">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>📚 Información Básica</span>
              {seccion1Completa ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  {[
                    !!formData.id_tema,
                    !!formData.id_grupo,
                    !!formData.fecha_programada,
                    !!formData.duracionClase,
                  ].filter(Boolean).length}/4 campos
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 md:grid-cols-2 pt-4">
              <div>
                <Label>Tema *</Label>
                {esSesionPreprogramada && claseData ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 rounded-md border bg-muted/50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{claseData.temas?.nombre}</p>
                            {claseData.temas?.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {claseData.temas.descripcion}
                              </p>
                            )}
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Fijo
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Este campo viene de la sesión programada y no se puede modificar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <>
                    <Select 
                      value={formData.id_tema} 
                      onValueChange={(val) => {
                        setFormData({ ...formData, id_tema: val });
                        validarCampo('tema', val);
                      }}
                    >
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
                    {errores.tema && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errores.tema}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <Label>Grupo *</Label>
                {esSesionPreprogramada && claseData ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 rounded-md border bg-muted/50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{claseData.grupos?.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {claseData.grupos?.grado}° • Sección {claseData.grupos?.seccion}
                            </p>
                          </div>
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Fijo
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Este campo viene de la sesión programada y no se puede modificar</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <>
                    <Select 
                      value={formData.id_grupo} 
                      onValueChange={(val) => {
                        setFormData({ ...formData, id_grupo: val });
                        validarCampo('grupo', val);
                      }}
                    >
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
                    {errores.grupo && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errores.grupo}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <Label>Fecha Programada *</Label>
                <Input
                  type="date"
                  value={formData.fecha_programada}
                  onChange={(e) => setFormData({ ...formData, fecha_programada: e.target.value })}
                />
              </div>

              <div>
                <Label>Duración de la Clase (minutos) *</Label>
                <Input
                  type="number"
                  value={formData.duracionClase}
                  onChange={(e) => setFormData({ ...formData, duracionClase: e.target.value })}
                />
                {esSesionPreprogramada && datosPreliminares?.duracion_sugerida && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Sugerido: {datosPreliminares.duracion_sugerida} minutos
                  </p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SECCIÓN 2: Perfil del Grupo */}
        <AccordionItem value="seccion-2">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>🎯 Perfil del Grupo</span>
              {seccion2Completa ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  {[!!edadSeleccionada, formData.adaptacionesSeleccionadas.length > 0].filter(Boolean).length}/2 campos
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              <div>
                <Label>Grupo de Edad *</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                  {EDADES_MEJORADAS.map((edad) => (
                    <button
                      key={edad.value}
                      type="button"
                      onClick={() => {
                        setEdadSeleccionada(edad.value);
                        validarCampo('edad', edad.value);
                      }}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        edadSeleccionada === edad.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{edad.icon}</span>
                        <span className="font-medium">{edad.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{edad.nivel}</p>
                    </button>
                  ))}
                </div>
                {errores.edad && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                    <AlertCircle className="h-3 w-3" />
                    {errores.edad}
                  </p>
                )}
              </div>

              <div>
                <Label>Inclusión y adaptaciones</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecciona necesidades del grupo que debas considerar. Puedes elegir varias.
                </p>
                <div className="flex flex-wrap gap-2">
                  {ADAPTACIONES_OPTIONS.map((opcion) => (
                    <Badge
                      key={opcion.value}
                      variant={formData.adaptacionesSeleccionadas.includes(opcion.value) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3"
                      onClick={() => toggleAdaptacion(opcion.value)}
                    >
                      {opcion.label}
                    </Badge>
                  ))}
                </div>
                {formData.adaptacionesSeleccionadas.includes("otro") && (
                  <Input
                    placeholder="Describe la adaptación adicional"
                    value={formData.adaptacionOtra}
                    onChange={(e) => setFormData({ ...formData, adaptacionOtra: e.target.value })}
                    className="mt-3"
                  />
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SECCIÓN 3: Enfoque Pedagógico */}
        <AccordionItem value="seccion-3">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>🧠 Enfoque Pedagógico</span>
              {seccion3Completa ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Completo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  {metodologiasSeleccionadas.length > 0 ? "1/3 campos" : "0/3 campos"}
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              <div>
                <Label>Objetivo Específico de esta Sesión</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Define qué quieres lograr en esta sesión en particular (ej.: introducción, práctica guiada, repaso, etc.).
                </p>
                <Input
                  placeholder="Ej: Práctica guiada de problemas con material concreto"
                  value={formData.objetivoEspecifico}
                  onChange={(e) => setFormData({ ...formData, objetivoEspecifico: e.target.value })}
                />
              </div>

              <div>
                <Label>Metodologías de Pensamiento Crítico *</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecciona una o más metodologías que utilizarás en esta clase.
                </p>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {METODOLOGIAS.map((met) => (
                      <Tooltip key={met}>
                        <TooltipTrigger asChild>
                          <Badge
                            variant={metodologiasSeleccionadas.includes(met) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => toggleMetodologia(met)}
                          >
                            {met}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            {DESCRIPCIONES_METODOLOGIAS[met] || "Metodología de pensamiento crítico"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {customMetodologias.map((met) => (
                      <Badge
                        key={met}
                        variant={metodologiasSeleccionadas.includes(met) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => toggleMetodologia(met)}
                      >
                        {met}
                      </Badge>
                    ))}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 border border-dashed"
                      onClick={() => setMostrarInputMetodologia(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Otra
                    </Button>
                  </div>
                </TooltipProvider>
                {mostrarInputMetodologia && (
                  <div className="flex flex-col gap-2 mt-3 md:flex-row">
                    <Input
                      autoFocus
                      placeholder="Nombre de la metodología"
                      value={metodologiaPersonalizada}
                      onChange={(e) => setMetodologiaPersonalizada(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button type="button" onClick={handleAgregarMetodologiaPersonalizada}>
                        Agregar
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setMostrarInputMetodologia(false);
                          setMetodologiaPersonalizada("");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                {errores.metodologias && (
                  <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errores.metodologias}
                  </p>
                )}
                {!errores.metodologias && metodologiasSeleccionadas.length === 0 && (
                  <p className="text-xs text-destructive mt-1">Selecciona al menos una metodología</p>
                )}
              </div>

              <div>
                <Label>Recursos disponibles</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Indica qué recursos tendrás disponibles durante la sesión.
                </p>
                <div className="flex flex-wrap gap-2">
                  {RECURSOS_OPTIONS.map((recurso) => {
                    const Icon = recurso.icon;
                    return (
                      <Badge
                        key={recurso.value}
                        variant={formData.recursosSeleccionados.includes(recurso.value) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3 flex items-center gap-1.5"
                        onClick={() => toggleRecurso(recurso.value)}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {recurso.label}
                      </Badge>
                    );
                  })}
                </div>
                {formData.recursosSeleccionados.includes("otro") && (
                  <Input
                    placeholder="Describe el recurso adicional"
                    value={formData.recursoOtro}
                    onChange={(e) => setFormData({ ...formData, recursoOtro: e.target.value })}
                    className="mt-3"
                  />
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* SECCIÓN 4: Contexto Adicional */}
        <AccordionItem value="seccion-4">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <span>📝 Contexto Adicional</span>
              <Badge variant="outline" className="text-muted-foreground">
                {formData.contextoEspecifico.trim() ? "Completo" : "Opcional"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="pt-4">
              <Label>Contexto Específico *</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Describe el contexto particular de tus estudiantes, sus necesidades, conocimientos previos, o cualquier información relevante.
              </p>
              <Textarea
                value={formData.contextoEspecifico}
                onChange={(e) => setFormData({ ...formData, contextoEspecifico: e.target.value })}
                rows={5}
                placeholder="Ejemplo: Los estudiantes tienen conocimientos básicos de álgebra pero necesitan reforzar la resolución de ecuaciones..."
                className="resize-none"
              />
              {formData.contextoEspecifico.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {formData.contextoEspecifico.length} caracteres
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {numeroSesion && (
        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm font-medium">Sesión {numeroSesion}</p>
          <p className="text-xs text-muted-foreground">
            Esta será la sesión número {numeroSesion} de este tema
          </p>
        </div>
      )}
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

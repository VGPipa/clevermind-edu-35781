import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, FileText, CheckCircle2, AlertCircle, Target, Clock, Plus, X, ChevronDown, Lock, Monitor, Clipboard, Globe, Smartphone, Blocks, Book, Lightbulb, Sparkles, MoreHorizontal, RefreshCcw } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ProgressBar } from "@/components/profesor/ProgressBar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

const GRADOS_PERU = [
  { value: "1P", label: "1° Primaria" },
  { value: "2P", label: "2° Primaria" },
  { value: "3P", label: "3° Primaria" },
  { value: "4P", label: "4° Primaria" },
  { value: "5P", label: "5° Primaria" },
  { value: "6P", label: "6° Primaria" },
  { value: "1S", label: "1° Secundaria" },
  { value: "2S", label: "2° Secundaria" },
  { value: "3S", label: "3° Secundaria" },
  { value: "4S", label: "4° Secundaria" },
  { value: "5S", label: "5° Secundaria" },
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

type QuizOptionState = {
  id: string;
  label: string;
};

type QuizQuestionState = {
  id: string;
  texto: string;
  tipo: string;
  orden: number;
  opciones: QuizOptionState[];
  respuestaCorrecta: string;
  justificacion?: string | null;
  loadingAction?: 'swap' | 'easier' | 'harder' | null;
};

type PreQuizState = {
  quizId: string;
  lectura: string;
  questions: QuizQuestionState[];
};

type PostQuizQuestionState = {
  id: string;
  texto: string;
  tipo: string;
  tipoRespuesta: 'multiple_choice' | 'texto_abierto';
  orden: number;
  opciones: QuizOptionState[];
  respuestaCorrecta: string | null;
  justificacion?: string | null;
  loadingAction?: 'swap' | 'easier' | 'harder' | null;
};

type PostQuizState = {
  quizId: string;
  questions: PostQuizQuestionState[];
};

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

type ClaseEnProcesoResumen = {
  id: string;
  tema?: string;
  grupo?: string;
  estado?: string | null;
  esExtraordinaria?: boolean;
};

const IN_PROGRESS_STORAGE_KEY = 'generarClaseEnProceso';

const buildInitialFormData = (initialTemaId?: string) => ({
  id_tema: initialTemaId || "",
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
  const [idMateria, setIdMateria] = useState<string>("");
  const [temaLibre, setTemaLibre] = useState<string>("");
  
  const [formData, setFormData] = useState(() => buildInitialFormData(temaId || ""));

  const esSesionPreprogramada = !!claseIdParam && !extraordinaria;
  const queryClient = useQueryClient();
  const [claseEnProceso, setClaseEnProceso] = useState<ClaseEnProcesoResumen | null>(null);
  const selectionResetRef = useRef(false);

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
  const { data: claseDataFromUrl } = useQuery({
    queryKey: ['clase', claseIdParam],
    queryFn: async () => {
      if (!claseIdParam) return null;

      const response = await (supabase as any)
        .from('clases')
        .select(`
          *,
          id_guia_version_actual,
          estado,
          temas!inner (
            id,
            nombre,
            descripcion,
            duracion_estimada,
            id_materia,
            materias!inner (
              id,
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
          guias_tema (
            id,
            estructura_sesiones
          )
        `)
        .eq('id', claseIdParam)
        .single();

      if (response.error) throw response.error;
      return response.data;
    },
    enabled: esSesionPreprogramada || !!claseIdParam,
  });

  // Fetch clase data cuando se crea una clase (extraordinaria o nueva) y se guarda el ID en estado
  const { data: claseDataFromState } = useQuery({
    queryKey: ['clase', claseId],
    queryFn: async () => {
      if (!claseId || claseId === claseIdParam) return null; // Evitar duplicado si ya viene de URL

      const response = await (supabase as any)
        .from('clases')
        .select(`
          *,
          id_guia_version_actual,
          estado,
          temas!inner (
            id,
            nombre,
            descripcion,
            duracion_estimada,
            id_materia,
            materias!inner (
              id,
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
          guias_tema (
            id,
            estructura_sesiones
          )
        `)
        .eq('id', claseId)
        .single();

      if (response.error) throw response.error;
      return response.data;
    },
    enabled: !!claseId && claseId !== claseIdParam,
  });

  // Usar datos de URL si existen, sino usar datos del estado
  const claseData = claseDataFromUrl || claseDataFromState;

  // Fetch materias for the profesor
  const { data: materiasData } = useQuery({
    queryKey: ['materias-profesor'],
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
          id_materia,
          materias!inner (
            id,
            nombre,
            descripcion
          )
        `)
        .eq('id_profesor', profesorResponse.data.id);

      if (asignacionesResponse.error) throw asignacionesResponse.error;
      
      // Obtener materias únicas
      const materiasUnicas = new Map();
      asignacionesResponse.data?.forEach((a: any) => {
        if (a.materias && !materiasUnicas.has(a.materias.id)) {
          materiasUnicas.set(a.materias.id, a.materias);
        }
      });
      return Array.from(materiasUnicas.values());
    },
  });

  // Fetch temas for selected materia (only for preprogramadas)
  const { data: temasData } = useQuery<Array<{ id: string; nombre: string; descripcion: string | null }>>({
    queryKey: ['temas-materia', idMateria],
    queryFn: async () => {
      if (!idMateria) return [];
      const { data } = await supabase
        .from('temas')
        .select('id, nombre, descripcion')
        .eq('id_materia', idMateria)
        .order('nombre');
      return data || [];
    },
    enabled: !!idMateria && !extraordinaria, // Solo para preprogramadas
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

  // Fetch guía existente si la clase ya tiene una versión
  const { data: guiaExistente } = useQuery({
    queryKey: ['guia-version', claseData?.id_guia_version_actual],
    queryFn: async () => {
      if (!claseData?.id_guia_version_actual) return null;

      const { data, error } = await (supabase as any)
        .from('guias_clase_versiones')
        .select('*')
        .eq('id', claseData.id_guia_version_actual)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!claseData?.id_guia_version_actual,
  });

  // Fetch quiz pre junto con sus preguntas para el editor híbrido
  const {
    data: preQuizData,
    isLoading: preQuizFetching,
    refetch: refetchPreQuiz,
  } = useQuery({
    queryKey: ['pre-quiz', claseId],
    queryFn: async () => {
      if (!claseId) return null;

      const { data, error } = await (supabase as any)
        .from('quizzes')
        .select(`
          id,
          instrucciones,
          estado,
          tipo_evaluacion,
          preguntas:preguntas (
            id,
            texto_pregunta,
            tipo,
            orden,
            opciones,
            respuesta_correcta,
            justificacion
          )
        `)
        .eq('id_clase', claseId)
        .eq('tipo_evaluacion', 'pre')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!claseId,
  });

  const {
    data: postQuizData,
    isLoading: postQuizFetching,
    refetch: refetchPostQuiz,
  } = useQuery({
    queryKey: ['post-quiz', claseId],
    queryFn: async () => {
      if (!claseId) return null;

      const { data, error } = await (supabase as any)
        .from('quizzes')
        .select(`
          id,
          tipo_evaluacion,
          preguntas:preguntas (
            id,
            texto_pregunta,
            tipo,
            orden,
            opciones,
            respuesta_correcta,
            justificacion
          )
        `)
        .eq('id_clase', claseId)
        .eq('tipo_evaluacion', 'post')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!claseId,
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

      // Prellenar materia desde tema
      if (claseData.temas?.id_materia) {
        setIdMateria(claseData.temas.id_materia);
      }

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

      // No cargar grupo_edad si es sesión preprogramada, el grado viene del grupo
      if (claseData.grupo_edad && !esSesionPreprogramada) {
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

  // Detectar estado de la clase y cargar datos existentes cuando el usuario vuelve
  useEffect(() => {
    if (!claseData || !claseId) return;

    if (guiaExistente) {
      const guiaData = {
        objetivos: guiaExistente.objetivos ? guiaExistente.objetivos.split('\n').filter(Boolean) : [],
        estructura: Array.isArray(guiaExistente.estructura) ? guiaExistente.estructura : [],
        preguntas_socraticas: Array.isArray(guiaExistente.preguntas_socraticas) 
          ? guiaExistente.preguntas_socraticas 
          : [],
        contenido: guiaExistente.contenido || {},
        version_numero: guiaExistente.version_numero,
      };
      setGuiaGenerada(guiaData);
    }

    const estado = claseData.estado;
    if (!estado) return;

    if (estado === 'generando_clase') {
      setCurrentStep(2);
      return;
    }

    if (['editando_guia', 'guia_aprobada'].includes(estado)) {
      setCurrentStep(3);
      return;
    }

    if ([
      'quiz_pre_generando',
      'quiz_pre_enviado',
      'analizando_quiz_pre',
      'modificando_guia',
      'guia_final',
      'clase_programada',
      'en_clase',
    ].includes(estado)) {
      setCurrentStep(4);
      return;
    }
  }, [claseData, guiaExistente, claseId]);

  useEffect(() => {
    if (!claseData || !claseId) return;
    const finalStates = new Set(['clase_programada', 'en_clase', 'validada', 'finalizada']);

    if (finalStates.has(claseData.estado)) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(IN_PROGRESS_STORAGE_KEY);
      }
      setClaseEnProceso(null);
      return;
    }

    const resumen: ClaseEnProcesoResumen = {
      id: claseData.id,
      tema: (claseData.temas as any)?.nombre || 'Tema sin nombre',
      grupo: (claseData.grupos as any)?.nombre || (extraordinaria ? 'Clase extraordinaria' : undefined),
      estado: claseData.estado,
      esExtraordinaria: extraordinaria,
    };

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(IN_PROGRESS_STORAGE_KEY, JSON.stringify(resumen));
    }
    setClaseEnProceso(resumen);
  }, [claseData, claseId, extraordinaria]);

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

    // Set default grado based on plan_anual grado (solo para extraordinarias)
    const grado = temaData.materias?.plan_anual?.grado;
    if (grado && !esSesionPreprogramada) {
      const gradeNum = parseInt(grado);
      // Mapear a estructura peruana: 1-6 Primaria, 7-11 Secundaria
      if (gradeNum >= 1 && gradeNum <= 6) {
        setEdadSeleccionada(`${gradeNum}P`);
      } else if (gradeNum >= 7 && gradeNum <= 11) {
        setEdadSeleccionada(`${gradeNum - 6}S`);
      }
    }
  }, [temaData, esSesionPreprogramada]);

  useEffect(() => {
    if (!preQuizData) {
      setPreQuizState(null);
      setPreQuizDirty(false);
      return;
    }

    const preguntasOrdenadas = Array.isArray(preQuizData.preguntas)
      ? [...preQuizData.preguntas].sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
      : [];

    setPreQuizState({
      quizId: preQuizData.id,
      lectura: preQuizData.instrucciones || "",
      questions: preguntasOrdenadas.map((pregunta: any, index: number) =>
        mapPreguntaToState(pregunta, index)
      ),
    });
    setPreQuizDirty(false);
  }, [preQuizData]);

  useEffect(() => {
    if (!postQuizData) {
      setPostQuizState(null);
      setPostQuizDirty(false);
      return;
    }

    const preguntasOrdenadas = Array.isArray(postQuizData.preguntas)
      ? [...postQuizData.preguntas].sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0))
      : [];

    setPostQuizState({
      quizId: postQuizData.id,
      questions: preguntasOrdenadas.map((pregunta: any, index: number) =>
        mapPostPreguntaToState(pregunta, index)
      ),
    });
    setPostQuizDirty(false);
  }, [postQuizData]);

  const [guiaGenerada, setGuiaGenerada] = useState<any>(null);
  const [sesionesRecomendadas, setSesionesRecomendadas] = useState<number>(1);
  const [numeroSesion, setNumeroSesion] = useState<number | null>(null);
  const [mostrarInputMetodologia, setMostrarInputMetodologia] = useState(false);
  const [metodologiaPersonalizada, setMetodologiaPersonalizada] = useState("");
  const [preQuizState, setPreQuizState] = useState<PreQuizState | null>(null);
  const [preQuizDirty, setPreQuizDirty] = useState(false);
  const [preQuizLoading, setPreQuizLoading] = useState(false);
  const [preQuizActionLoading, setPreQuizActionLoading] = useState<{
    reading: boolean;
    regenerateAll: boolean;
    perQuestion: Record<string, boolean>;
  }>({
    reading: false,
    regenerateAll: false,
    perQuestion: {},
  });
  const [customInstructionOpen, setCustomInstructionOpen] = useState(false);
  const [customInstructionText, setCustomInstructionText] = useState("");
  const customInstructionAnchorRef = useRef<HTMLButtonElement | null>(null);
  const isGeneratingPreQuizRef = useRef(false);
  const [postQuizState, setPostQuizState] = useState<PostQuizState | null>(null);
  const [postQuizDirty, setPostQuizDirty] = useState(false);
  const [postQuizLoading, setPostQuizLoading] = useState(false);
  const [postQuizActionLoading, setPostQuizActionLoading] = useState<{
    regenerateAll: boolean;
    perQuestion: Record<string, boolean>;
  }>({
    regenerateAll: false,
    perQuestion: {},
  });
  const isGeneratingPostQuizRef = useRef(false);
  const hasLoadedInProgressRef = useRef(false);
  useEffect(() => {
    if (hasLoadedInProgressRef.current) return;
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(IN_PROGRESS_STORAGE_KEY);
    if (stored) {
      try {
        setClaseEnProceso(JSON.parse(stored));
      } catch (error) {
        console.error('Error parsing clase en proceso:', error);
        window.localStorage.removeItem(IN_PROGRESS_STORAGE_KEY);
      }
    }
    hasLoadedInProgressRef.current = true;
  }, []);

  const mapValuesToLabels = (values: string[], options: readonly { value: string; label: string }[]) =>
    values.map((value) => options.find((option) => option.value === value)?.label || value);

  const mapLabelsToValues = (labels: string[] | undefined, options: readonly { value: string; label: string }[]) => {
    if (!labels) return undefined;
    return labels.map((label) => options.find((option) => option.label === label)?.value || label);
  };

  // Mapear grado numérico a formato peruano (1P, 2P, etc.)
  const mapearGradoAGrupoEdad = (grado: string | number | null | undefined): string | null => {
    if (!grado) return null;
    const gradeNum = typeof grado === 'string' ? parseInt(grado) : grado;
    if (isNaN(gradeNum)) return null;
    
    // Estructura peruana: 1-6 Primaria, 7-11 Secundaria
    if (gradeNum >= 1 && gradeNum <= 6) {
      return `${gradeNum}P`;
    } else if (gradeNum >= 7 && gradeNum <= 11) {
      return `${gradeNum - 6}S`;
    }
    return null;
  };

  const normalizeOptions = (raw: any): QuizOptionState[] => {
    if (!raw) return [];

    const buildOption = (label: any, index: number, id?: string): QuizOptionState => ({
      id: id || `option-${index + 1}`,
      label: typeof label === 'string' ? label : typeof label === 'number' ? String(label) : JSON.stringify(label),
    });

    if (Array.isArray(raw)) {
      if (raw.length === 1 && typeof raw[0] === 'object' && !Array.isArray(raw[0])) {
        return Object.entries(raw[0]).map(([key, value], idx) => buildOption(value, idx, key));
      }
      return raw.map((value, idx) => {
        if (value && typeof value === 'object' && 'label' in value) {
          return {
            id: (value as any).id || `option-${idx + 1}`,
            label: String((value as any).label),
          };
        }
        return buildOption(value, idx);
      });
    }

    if (typeof raw === 'object') {
      return Object.entries(raw).map(([key, value], idx) => buildOption(value, idx, key));
    }

    return [];
  };

  const ensureMinimumOptions = (options: QuizOptionState[]): QuizOptionState[] => {
    const next = [...options];
    while (next.length < 4) {
      const index = next.length;
      next.push({ id: `option-${index + 1}`, label: '' });
    }
    return next;
  };

  const mapPreguntaToState = (pregunta: any, index: number): QuizQuestionState => ({
    id: pregunta.id,
    texto: pregunta.texto_pregunta,
    tipo: pregunta.tipo,
    orden: pregunta.orden || index + 1,
    opciones: ensureMinimumOptions(normalizeOptions(pregunta.opciones)),
    respuestaCorrecta: pregunta.respuesta_correcta || '',
    justificacion: pregunta.justificacion,
  });

  const mapPostPreguntaToState = (pregunta: any, index: number): PostQuizQuestionState => {
    const isMultipleChoice = Array.isArray(pregunta.opciones) && pregunta.opciones.length > 0;
    return {
      id: pregunta.id,
      texto: pregunta.texto_pregunta,
      tipo: pregunta.tipo,
      orden: pregunta.orden || index + 1,
      tipoRespuesta: isMultipleChoice ? 'multiple_choice' : 'texto_abierto',
      opciones: isMultipleChoice ? ensureMinimumOptions(normalizeOptions(pregunta.opciones)) : [],
      respuestaCorrecta: pregunta.respuesta_correcta || null,
      justificacion: pregunta.justificacion,
    };
  };

  const updateReadingText = (texto: string) => {
    setPreQuizState(prev => prev ? { ...prev, lectura: texto } : prev);
    setPreQuizDirty(true);
  };

  const updateQuestion = (questionId: string, updater: (question: QuizQuestionState) => QuizQuestionState) => {
    setPreQuizState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map(q => (q.id === questionId ? updater(q) : q)),
      };
    });
    setPreQuizDirty(true);
  };

  const updateQuestionOption = (questionId: string, optionId: string, value: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      opciones: question.opciones.map(opt =>
        opt.id === optionId ? { ...opt, label: value } : opt
      ),
    }));
  };

  const addQuestionOption = (questionId: string) => {
    updateQuestion(questionId, question => {
      const nextOptions = [
        ...question.opciones,
        { id: `option-${question.opciones.length + 1}`, label: '' },
      ];
      return { ...question, opciones: nextOptions };
    });
  };

  const resetWorkflowState = useCallback(
    (options?: { initialTemaId?: string; clearInProgress?: boolean }) => {
      setClaseId(null);
      setGuiaGenerada(null);
      setPreguntasPost([]);
      setNumeroSesion(null);
      setPreQuizState(null);
      setPreQuizDirty(false);
      setPreQuizLoading(false);
      setPreQuizActionLoading({ reading: false, regenerateAll: false, perQuestion: {} });
      isGeneratingPreQuizRef.current = false;
      setPostQuizState(null);
      setPostQuizDirty(false);
      setPostQuizLoading(false);
      setPostQuizActionLoading({ regenerateAll: false, perQuestion: {} });
      isGeneratingPostQuizRef.current = false;
      setCurrentStep(1);
      setTemaLibre("");
      setMetodologiasSeleccionadas([]);
      setEdadSeleccionada("");
      setIdMateria("");
      setFormData(buildInitialFormData(options?.initialTemaId ?? (temaId || "")));
      queryClient.removeQueries({ queryKey: ['clase'], exact: false });
      queryClient.removeQueries({ queryKey: ['pre-quiz'], exact: false });
      queryClient.removeQueries({ queryKey: ['post-quiz'], exact: false });
      queryClient.removeQueries({ queryKey: ['guia-version'], exact: false });

      if (options?.clearInProgress) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(IN_PROGRESS_STORAGE_KEY);
        }
        setClaseEnProceso(null);
      }
    },
    [queryClient, temaId]
  );

  const setQuestionCorrectOption = (questionId: string, optionId: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      respuestaCorrecta: optionId,
    }));
  };

  const handleQuestionTextChange = (questionId: string, value: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      texto: value,
    }));
  };

  const handleJustificacionChange = (questionId: string, value: string) => {
    updateQuestion(questionId, question => ({
      ...question,
      justificacion: value,
    }));
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
    
    if (campo === 'materia' && !valor) {
      nuevosErrores.materia = "Selecciona una materia";
    } else if (campo === 'metodologias' && (!valor || valor.length === 0)) {
      nuevosErrores.metodologias = "Selecciona al menos una metodología";
    } else if (campo === 'edad' && !valor) {
      nuevosErrores.edad = "Selecciona un grado";
    } else if (campo === 'tema' && !valor && !esSesionPreprogramada) {
      // En extraordinarias, validar tema libre
      if (!temaLibre.trim()) {
        nuevosErrores.tema = "Ingresa el tema de la clase";
      }
    } else if (campo === 'grado' && !valor && !esSesionPreprogramada) {
      nuevosErrores.grado = "Selecciona un grado";
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

  const setQuestionLoader = (questionId: string, value: boolean) => {
    setPreQuizActionLoading(prev => ({
      ...prev,
      perQuestion: { ...prev.perQuestion, [questionId]: value },
    }));
  };

  const generatePreQuiz = async () => {
    if (!claseId || isGeneratingPreQuizRef.current) return;
    isGeneratingPreQuizRef.current = true;

    setPreQuizLoading(true);
    try {
      const { error } = await supabase.functions.invoke('generar-evaluacion', {
        body: { id_clase: claseId, tipo: 'pre' },
      });

      if (error) throw error;

      await refetchPreQuiz();
      toast.success("Evaluación pre generada. Ahora puedes personalizarla.");
    } catch (error: any) {
      console.error('Error generating pre-quiz:', error);
      toast.error(error.message || "No se pudo generar la evaluación PRE");
    } finally {
      setPreQuizLoading(false);
      isGeneratingPreQuizRef.current = false;
    }
  };

  const persistPreQuizChanges = async () => {
    if (!preQuizState) return;

    setPreQuizLoading(true);
    try {
      const quizUpdate = supabase
        .from('quizzes')
        .update({
          instrucciones: preQuizState.lectura,
        })
        .eq('id', preQuizState.quizId);

      const questionsUpdate = Promise.all(
        preQuizState.questions.map((question) =>
          supabase
            .from('preguntas')
            .update({
              texto_pregunta: question.texto,
              respuesta_correcta: question.respuestaCorrecta,
              opciones: question.opciones,
              justificacion: question.justificacion,
              orden: question.orden,
              texto_contexto: preQuizState.lectura,
            })
            .eq('id', question.id)
        )
      );

      const [{ error: quizError }, questionsResult] = await Promise.all([quizUpdate, questionsUpdate]);

      if (quizError) throw quizError;

      for (const result of questionsResult) {
        if (result.error) throw result.error;
      }

      setPreQuizDirty(false);
      toast.success("Cambios del quiz PRE guardados");
    } catch (error: any) {
      console.error('Error saving pre-quiz:', error);
      toast.error(error.message || "No se pudieron guardar los cambios del quiz PRE");
      throw error;
    } finally {
      setPreQuizLoading(false);
    }
  };

  const handleReadingAIAction = async (intent: 'regenerate' | 'custom', instruction?: string) => {
    if (!preQuizState?.quizId) return;
    setPreQuizActionLoading(prev => ({ ...prev, reading: true }));

    try {
      const { data, error } = await supabase.functions.invoke('refine-quiz-text', {
        body: {
          quiz_id: preQuizState.quizId,
          currentText: preQuizState.lectura,
          instruction: instruction || '',
          userIntent: intent,
        },
      });

      if (error) throw error;

      if (data?.texto) {
        setPreQuizState(prev => (prev ? { ...prev, lectura: data.texto } : prev));
        setPreQuizDirty(true);
        toast.success("Texto actualizado con IA");
      }
    } catch (error: any) {
      console.error('Error refining quiz text:', error);
      toast.error(error.message || "No se pudo actualizar el texto");
    } finally {
      setPreQuizActionLoading(prev => ({ ...prev, reading: false }));
    }
  };

  const setPostQuestionLoader = (questionId: string, value: boolean) => {
    setPostQuizActionLoading(prev => ({
      ...prev,
      perQuestion: { ...prev.perQuestion, [questionId]: value },
    }));
  };

  const generatePostQuiz = async () => {
    if (!claseId || isGeneratingPostQuizRef.current) return;
    isGeneratingPostQuizRef.current = true;

    setPostQuizLoading(true);
    try {
      const { error } = await supabase.functions.invoke('generar-evaluacion', {
        body: { id_clase: claseId, tipo: 'post' },
      });

      if (error) throw error;

      await refetchPostQuiz();
      toast.success("Evaluación post generada. Ahora puedes personalizarla.");
    } catch (error: any) {
      console.error('Error generating post-quiz:', error);
      toast.error(error.message || "No se pudo generar la evaluación POST");
    } finally {
      setPostQuizLoading(false);
      isGeneratingPostQuizRef.current = false;
    }
  };

  const persistPostQuizChanges = async () => {
    if (!postQuizState) return;

    setPostQuizLoading(true);
    try {
      const questionsUpdate = Promise.all(
        postQuizState.questions.map((question) =>
          supabase
            .from('preguntas')
            .update({
              texto_pregunta: question.texto,
              respuesta_correcta: question.respuestaCorrecta,
              opciones: question.opciones,
              justificacion: question.justificacion,
              orden: question.orden,
            })
            .eq('id', question.id)
        )
      );

      const results = await questionsUpdate;

      for (const result of results) {
        if (result.error) throw result.error;
      }

      setPostQuizDirty(false);
      toast.success("Cambios del quiz POST guardados");
    } catch (error: any) {
      console.error('Error saving post-quiz:', error);
      toast.error(error.message || "No se pudieron guardar los cambios del quiz POST");
      throw error;
    } finally {
      setPostQuizLoading(false);
    }
  };

  const updatePostQuestion = (
    questionId: string,
    updater: (question: PostQuizQuestionState) => PostQuizQuestionState
  ) => {
    setPostQuizState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((question) =>
          question.id === questionId ? updater(question) : question
        ),
      };
    });
    setPostQuizDirty(true);
  };

  const handlePostQuestionTextChange = (questionId: string, value: string) => {
    updatePostQuestion(questionId, (question) => ({ ...question, texto: value }));
  };

  const handlePostQuestionTypeChange = (questionId: string, tipoRespuesta: 'multiple_choice' | 'texto_abierto') => {
    updatePostQuestion(questionId, (question) => {
      if (tipoRespuesta === 'multiple_choice') {
        const opciones = ensureMinimumOptions(
          question.opciones.length > 0 ? question.opciones : normalizeOptions([])
        );
        return {
          ...question,
          tipoRespuesta,
          opciones,
          respuestaCorrecta: opciones[0]?.id || null,
        };
      }

      return {
        ...question,
        tipoRespuesta,
        opciones: [],
        respuestaCorrecta: question.respuestaCorrecta || '',
      };
    });
  };

  const handlePostQuestionOptionChange = (
    questionId: string,
    optionId: string,
    value: string
  ) => {
    updatePostQuestion(questionId, (question) => ({
      ...question,
      opciones: question.opciones.map((opcion) =>
        opcion.id === optionId ? { ...opcion, label: value } : opcion
      ),
    }));
  };

  const addPostQuestionOption = (questionId: string) => {
    updatePostQuestion(questionId, (question) => {
      const nextIndex = question.opciones.length;
      const newOption = { id: `option-${nextIndex + 1}`, label: '' };
      return {
        ...question,
        opciones: [...question.opciones, newOption],
      };
    });
  };

  const setPostQuestionCorrectOption = (questionId: string, optionId: string) => {
    updatePostQuestion(questionId, (question) => ({
      ...question,
      respuestaCorrecta: optionId,
    }));
  };

  const handlePostExpectedAnswerChange = (questionId: string, value: string) => {
    updatePostQuestion(questionId, (question) => ({
      ...question,
      respuestaCorrecta: value,
    }));
  };

  const handlePostJustificacionChange = (questionId: string, value: string) => {
    updatePostQuestion(questionId, (question) => ({
      ...question,
      justificacion: value,
    }));
  };

  const handlePostRegenerateAllQuestions = async () => {
    if (!postQuizState?.quizId) return;
    setPostQuizActionLoading(prev => ({ ...prev, regenerateAll: true }));

    try {
      const { error } = await supabase.functions.invoke('regenerate-quiz-questions', {
        body: { quiz_id: postQuizState.quizId, clase_id: claseId },
      });

      if (error) throw error;

      await refetchPostQuiz();
      toast.success("Se regeneraron las preguntas del POST");
    } catch (error: any) {
      console.error('Error regenerating post questions:', error);
      toast.error(error.message || 'No se pudieron regenerar las preguntas POST');
    } finally {
      setPostQuizActionLoading(prev => ({ ...prev, regenerateAll: false }));
    }
  };

  const handlePostSwapQuestion = async (questionId: string) => {
    if (!postQuizState?.quizId) return;

    setPostQuestionLoader(questionId, true);
    try {
      const { error } = await supabase.functions.invoke('modify-single-question', {
        body: { quiz_id: postQuizState.quizId, question_id: questionId, action: 'swap' },
      });

      if (error) throw error;

      await refetchPostQuiz();
      toast.success("Pregunta reemplazada");
    } catch (error: any) {
      console.error('Error swapping post question:', error);
      toast.error(error.message || 'No se pudo cambiar la pregunta');
    } finally {
      setPostQuestionLoader(questionId, false);
    }
  };

  const handlePostAdjustQuestionDifficulty = async (
    questionId: string,
    difficulty: 'easier' | 'harder'
  ) => {
    if (!postQuizState?.quizId) return;

    setPostQuestionLoader(questionId, true);
    try {
      const { error } = await supabase.functions.invoke('modify-single-question', {
        body: {
          quiz_id: postQuizState.quizId,
          question_id: questionId,
          action: 'adjust_difficulty',
          difficulty,
        },
      });

      if (error) throw error;

      await refetchPostQuiz();
      toast.success("Pregunta ajustada");
    } catch (error: any) {
      console.error('Error adjusting post question difficulty:', error);
      toast.error(error.message || 'No se pudo ajustar la dificultad');
    } finally {
      setPostQuestionLoader(questionId, false);
    }
  };

  const handleRegenerateAllQuestions = async () => {
    if (!preQuizState?.quizId) return;
    setPreQuizActionLoading(prev => ({ ...prev, regenerateAll: true }));

    try {
      const { error } = await supabase.functions.invoke('regenerate-quiz-questions', {
        body: {
          quiz_id: preQuizState.quizId,
          clase_id: claseId,
        },
      });

      if (error) throw error;

      await refetchPreQuiz();
      toast.success("Se regeneraron todas las preguntas");
    } catch (error: any) {
      console.error('Error regenerating questions:', error);
      toast.error(error.message || "No se pudieron regenerar las preguntas");
    } finally {
      setPreQuizActionLoading(prev => ({ ...prev, regenerateAll: false }));
    }
  };

  const handleSwapQuestion = async (questionId: string) => {
    if (!preQuizState?.quizId) return;
    setQuestionLoader(questionId, true);

    try {
      const { data, error } = await supabase.functions.invoke('modify-single-question', {
        body: {
          quiz_id: preQuizState.quizId,
          question_id: questionId,
          action: 'swap',
        },
      });

      if (error) throw error;

      if (data?.pregunta) {
        updateQuestion(questionId, () => mapPreguntaToState(data.pregunta, data.pregunta.orden || 0));
        toast.success("Pregunta reemplazada");
      } else {
        await refetchPreQuiz();
      }
    } catch (error: any) {
      console.error('Error swapping question:', error);
      toast.error(error.message || "No se pudo cambiar la pregunta");
    } finally {
      setQuestionLoader(questionId, false);
    }
  };

  const handleAdjustQuestionDifficulty = async (questionId: string, difficulty: 'easier' | 'harder') => {
    if (!preQuizState?.quizId) return;
    setQuestionLoader(questionId, true);

    try {
      const { data, error } = await supabase.functions.invoke('modify-single-question', {
        body: {
          quiz_id: preQuizState.quizId,
          question_id: questionId,
          action: 'adjust_difficulty',
          difficulty,
        },
      });

      if (error) throw error;

      if (data?.pregunta) {
        updateQuestion(questionId, () => mapPreguntaToState(data.pregunta, data.pregunta.orden || 0));
        toast.success(`Pregunta ajustada a dificultad ${difficulty === 'easier' ? 'más fácil' : 'más difícil'}`);
      } else {
        await refetchPreQuiz();
      }
    } catch (error: any) {
      console.error('Error adjusting difficulty:', error);
      toast.error(error.message || "No se pudo ajustar la dificultad");
    } finally {
      setQuestionLoader(questionId, false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Validaciones según tipo de sesión
      if (esSesionPreprogramada) {
        if (!formData.id_tema || !formData.id_grupo || !formData.fecha_programada || 
            !formData.duracionClase || metodologiasSeleccionadas.length === 0 || 
            !formData.contextoEspecifico.trim()) {
          toast.error("Por favor completa los campos obligatorios");
          return;
        }
      } else {
        // Extraordinaria: validar materia, tema libre, grado, grupo
        if (!idMateria || !temaLibre.trim() || !edadSeleccionada || !formData.id_grupo ||
            !formData.fecha_programada || !formData.duracionClase || 
            metodologiasSeleccionadas.length === 0 || !formData.contextoEspecifico.trim()) {
          toast.error("Por favor completa los campos obligatorios");
          return;
        }
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
          // En sesión preprogramada, el grado viene del grupo
          const gradoGrupo = claseData?.grupos?.grado 
            ? mapearGradoAGrupoEdad(claseData.grupos.grado) 
            : null;
          
          const { data, error } = await (supabase as any)
            .from('clases')
            .update({
              id_tema: formData.id_tema,
              id_grupo: formData.id_grupo,
              fecha_programada: formData.fecha_programada,
              duracion_minutos: parseInt(formData.duracionClase),
              grupo_edad: gradoGrupo || edadSeleccionada, // Usar grado del grupo si está disponible
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
          // Obtener el grado del grupo seleccionado si está disponible
          const grupoSeleccionado = gruposData?.find((g: any) => g.id === formData.id_grupo);
          const gradoGrupo = grupoSeleccionado?.grado 
            ? mapearGradoAGrupoEdad(grupoSeleccionado.grado) 
            : null;
          
          const { data, error } = await supabase.functions.invoke('crear-clase', {
            body: {
              id_materia: idMateria, // Nueva
              tema_libre: temaLibre.trim(), // Nueva - tema de texto libre
              id_tema: null, // No se usa si tema_libre está presente
              id_grupo: formData.id_grupo,
              fecha_programada: formData.fecha_programada,
              duracion_minutos: parseInt(formData.duracionClase),
              grupo_edad: gradoGrupo || edadSeleccionada, // Priorizar grado del grupo, luego el seleccionado
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
        // Evitar múltiples disparos mientras se genera el quiz por primera vez
        if (!preQuizState?.quizId) {
          if (preQuizLoading || isGeneratingPreQuizRef.current) {
            return;
          }
          await generatePreQuiz();
          return;
        }

        await persistPreQuizChanges();
        setCurrentStep(4);
      } catch {
        // persistPreQuizChanges ya muestra el error
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 4) {
      if (!claseId) return;

      setLoading(true);
      try {
        if (!postQuizState?.quizId) {
          if (postQuizLoading || isGeneratingPostQuizRef.current) {
            return;
          }
          await generatePostQuiz();
          return;
        }

        await persistPostQuizChanges();
        setCurrentStep(5);
      } catch (error: any) {
        // persistPostQuizChanges ya muestra el error
        if (!error?.message?.includes('guardados')) {
          toast.error(error.message || "Error al guardar evaluación POST");
        }
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

  const isPerQuestionActionRunning = useMemo(
    () => Object.values(preQuizActionLoading.perQuestion || {}).some(Boolean),
    [preQuizActionLoading.perQuestion]
  );

  const isStep3AsyncInFlight =
    currentStep === 3 &&
    (preQuizLoading ||
      preQuizActionLoading.reading ||
      preQuizActionLoading.regenerateAll ||
      isPerQuestionActionRunning);

  const isPostPerQuestionLoading = useMemo(
    () => Object.values(postQuizActionLoading.perQuestion || {}).some(Boolean),
    [postQuizActionLoading.perQuestion]
  );

  const isStep4AsyncInFlight =
    currentStep === 4 &&
    (postQuizLoading ||
      postQuizActionLoading.regenerateAll ||
      isPostPerQuestionLoading);

  const isContinueDisabled = loading || isStep3AsyncInFlight || isStep4AsyncInFlight;

  const customMetodologias = useMemo(
    () => metodologiasSeleccionadas.filter((met) => !METODOLOGIAS.includes(met)),
    [metodologiasSeleccionadas]
  );

  const seccion1Completa = useMemo(() => {
    if (esSesionPreprogramada) {
      return !!idMateria && !!formData.id_tema && !!formData.id_grupo && 
             !!formData.fecha_programada && !!formData.duracionClase;
    } else {
      return !!idMateria && !!temaLibre.trim() && !!edadSeleccionada && !!formData.id_grupo &&
             !!formData.fecha_programada && !!formData.duracionClase;
    }
  }, [formData.id_tema, formData.id_grupo, formData.fecha_programada, formData.duracionClase, idMateria, temaLibre, edadSeleccionada, esSesionPreprogramada]);

  const seccion3Completa = useMemo(() => {
    return metodologiasSeleccionadas.length > 0;
  }, [metodologiasSeleccionadas]);

  const progresoStep1 = useMemo(() => {
    const camposObligatorios = esSesionPreprogramada
      ? [
          !!idMateria, // Materia (prellenada)
          !!formData.id_tema, // Tema (prellenado)
          !!formData.id_grupo, // Salón (prellenado)
          !!formData.fecha_programada,
          !!formData.duracionClase,
          metodologiasSeleccionadas.length > 0,
          !!formData.contextoEspecifico.trim(),
        ]
      : [
          !!idMateria, // Materia (select)
          !!temaLibre.trim(), // Tema libre (input)
          !!edadSeleccionada, // Grado (select)
          !!formData.fecha_programada,
          !!formData.duracionClase,
          metodologiasSeleccionadas.length > 0,
          !!formData.contextoEspecifico.trim(),
        ];
    const completados = camposObligatorios.filter(Boolean).length;
    return (completados / camposObligatorios.length) * 100;
  }, [formData, metodologiasSeleccionadas, edadSeleccionada, idMateria, temaLibre, esSesionPreprogramada]);

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
      {/* Banners Compactos */}
      <div className="flex flex-wrap gap-2 mb-4">
        {temaData && sesionesRecomendadas > 1 && !esSesionPreprogramada && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
            <Lightbulb className="h-3 w-3" />
            <span>Este tema sugiere {sesionesRecomendadas} sesiones</span>
          </div>
        )}
        {esSesionPreprogramada && datosPreliminares && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">
            <FileText className="h-3 w-3" />
            <span>Sesión {claseData?.numero_sesion}</span>
            {datosPreliminares.duracion_sugerida && (
              <span>• {datosPreliminares.duracion_sugerida} min</span>
            )}
          </div>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["seccion-1", "seccion-3", "seccion-4"]} className="w-full">
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
                  {esSesionPreprogramada
                    ? [
                        !!idMateria,
                        !!formData.id_tema,
                        !!formData.id_grupo,
                        !!formData.fecha_programada,
                        !!formData.duracionClase,
                      ].filter(Boolean).length
                    : [
                        !!idMateria,
                        !!temaLibre.trim(),
                        !!edadSeleccionada,
                        !!formData.id_grupo,
                        !!formData.fecha_programada,
                        !!formData.duracionClase,
                      ].filter(Boolean).length
                  }/{esSesionPreprogramada ? "5" : "6"} campos
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid gap-4 md:grid-cols-2 pt-4">
              {/* Materia */}
              <div>
                <Label>Materia *</Label>
                {esSesionPreprogramada && claseData ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 rounded-md border bg-muted/50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{claseData.temas?.materias?.nombre || 'N/A'}</p>
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
                      value={idMateria} 
                      onValueChange={(val) => {
                        setIdMateria(val);
                        validarCampo('materia', val);
                        // Limpiar tema cuando cambia materia
                        setFormData({ ...formData, id_tema: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una materia" />
                      </SelectTrigger>
                      <SelectContent>
                        {(materiasData || []).map((materia: any) => (
                          <SelectItem key={materia.id} value={materia.id}>
                            {materia.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errores.materia && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errores.materia}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Tema */}
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
                ) : extraordinaria ? (
                  <>
                    <Input
                      placeholder="Ingresa el tema de la clase"
                      value={temaLibre}
                      onChange={(e) => {
                        setTemaLibre(e.target.value);
                        validarCampo('tema', e.target.value);
                      }}
                    />
                    {errores.tema && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errores.tema}
                      </p>
                    )}
                  </>
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
                        {(temasData || []).map((tema: any) => (
                          <SelectItem key={tema.id} value={tema.id}>
                            {tema.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errores.tema && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" />
                        {errores.tema}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Grado (solo extraordinarias) o Salón (solo preprogramadas) */}
              {esSesionPreprogramada ? (
                <div>
                  <Label>Salón *</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="p-3 rounded-md border bg-muted/50 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{claseData?.grupos?.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                              {claseData?.grupos?.grado}° • Sección {claseData?.grupos?.seccion}
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
                </div>
              ) : (
                <>
                  <div>
                    <Label>Grado *</Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      Selecciona el grado del salón para esta clase.
                    </p>
                    <Select
                      value={edadSeleccionada}
                      onValueChange={(val) => {
                        setEdadSeleccionada(val);
                        validarCampo('grado', val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un grado" />
                      </SelectTrigger>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Primaria</div>
                        {GRADOS_PERU.filter(g => g.value.endsWith('P')).map((grado) => (
                          <SelectItem key={grado.value} value={grado.value}>
                            {grado.label}
                          </SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Secundaria</div>
                        {GRADOS_PERU.filter(g => g.value.endsWith('S')).map((grado) => (
                          <SelectItem key={grado.value} value={grado.value}>
                            {grado.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errores.grado && (
                      <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                        <AlertCircle className="h-3 w-3" />
                        {errores.grado}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Grupo *</Label>
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
                  </div>
                </>
              )}

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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex flex-wrap gap-1">
                        {metodologiasSeleccionadas.length > 0 ? (
                          metodologiasSeleccionadas.map(met => (
                            <Badge key={met} variant="secondary" className="text-xs">
                              {met}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Selecciona metodologías</span>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2" align="start">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      <TooltipProvider>
                        {METODOLOGIAS.map((met) => (
                          <div key={met} className="flex items-center space-x-2">
                            <Checkbox
                              id={`met-${met}`}
                              checked={metodologiasSeleccionadas.includes(met)}
                              onCheckedChange={() => {
                                toggleMetodologia(met);
                                validarCampo('metodologias', metodologiasSeleccionadas);
                              }}
                            />
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Label htmlFor={`met-${met}`} className="cursor-pointer flex-1">
                                  {met}
                                </Label>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs text-xs">
                                  {DESCRIPCIONES_METODOLOGIAS[met] || "Metodología de pensamiento crítico"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                      </TooltipProvider>
                      {customMetodologias.map((met) => (
                        <div key={met} className="flex items-center space-x-2">
                          <Checkbox
                            id={`met-custom-${met}`}
                            checked={metodologiasSeleccionadas.includes(met)}
                            onCheckedChange={() => {
                              toggleMetodologia(met);
                              validarCampo('metodologias', metodologiasSeleccionadas);
                            }}
                          />
                          <Label htmlFor={`met-custom-${met}`} className="cursor-pointer flex-1">
                            {met}
                          </Label>
                        </div>
                      ))}
                      <div className="pt-2 border-t">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => setMostrarInputMetodologia(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar otra metodología
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
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
              </div>

              <div>
                <Label>Recursos disponibles</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Indica qué recursos tendrás disponibles durante la sesión.
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex flex-wrap gap-1">
                        {formData.recursosSeleccionados.length > 0 ? (
                          formData.recursosSeleccionados.map(recurso => {
                            const opcion = RECURSOS_OPTIONS.find(r => r.value === recurso);
                            const Icon = opcion?.icon || Book;
                            return (
                              <Badge key={recurso} variant="secondary" className="text-xs flex items-center gap-1">
                                <Icon className="h-3 w-3" />
                                {opcion?.label || recurso}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground">Selecciona recursos</span>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2" align="start">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {RECURSOS_OPTIONS.map((recurso) => {
                        const Icon = recurso.icon;
                        return (
                          <div key={recurso.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`rec-${recurso.value}`}
                              checked={formData.recursosSeleccionados.includes(recurso.value)}
                              onCheckedChange={() => toggleRecurso(recurso.value)}
                            />
                            <Label htmlFor={`rec-${recurso.value}`} className="cursor-pointer flex-1 flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              {recurso.label}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
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
                {formData.contextoEspecifico.trim() && formData.adaptacionesSeleccionadas.length > 0 ? "Completo" : "Parcial"}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-4">
              <div>
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

              <div>
                <Label>Inclusión y adaptaciones</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Selecciona necesidades del grupo que debas considerar. Puedes elegir varias.
                </p>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex flex-wrap gap-1">
                        {formData.adaptacionesSeleccionadas.length > 0 ? (
                          formData.adaptacionesSeleccionadas.map(adapt => {
                            const opcion = ADAPTACIONES_OPTIONS.find(a => a.value === adapt);
                            return (
                              <Badge key={adapt} variant="secondary" className="text-xs">
                                {opcion?.label || adapt}
                              </Badge>
                            );
                          })
                        ) : (
                          <span className="text-muted-foreground">Selecciona adaptaciones</span>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-2" align="start">
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {ADAPTACIONES_OPTIONS.map((adapt) => (
                        <div key={adapt.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`adapt-${adapt.value}`}
                            checked={formData.adaptacionesSeleccionadas.includes(adapt.value)}
                            onCheckedChange={() => toggleAdaptacion(adapt.value)}
                          />
                          <Label htmlFor={`adapt-${adapt.value}`} className="cursor-pointer flex-1">
                            {adapt.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
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

  const renderStep3 = () => {
    if (preQuizFetching || preQuizLoading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando evaluación PRE...
        </div>
      );
    }

    if (!preQuizState) {
      return (
        <div className="border border-dashed rounded-lg p-6 text-center space-y-4">
          <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Aún no has generado el diagnóstico PRE</p>
            <p className="text-sm text-muted-foreground">
              Usa el botón para crear una propuesta inicial y luego personalízala.
            </p>
          </div>
          <Button onClick={generatePreQuiz} disabled={preQuizLoading} className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generar evaluación PRE
          </Button>
        </div>
      );
    }

    const perQuestionLoading = preQuizActionLoading.perQuestion;

    const handleCustomInstructionSelect = (event: Event) => {
      event.preventDefault();
      setCustomInstructionText("");
      setCustomInstructionOpen(true);
      requestAnimationFrame(() => customInstructionAnchorRef.current?.focus());
    };

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Bloque de lectura (Teoría)</CardTitle>
              <CardDescription>Este texto será visible para el estudiante antes del diagnóstico.</CardDescription>
            </div>
            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={preQuizActionLoading.reading}
                  >
                    {preQuizActionLoading.reading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Acciones IA
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault();
                      handleReadingAIAction('regenerate');
                    }}
                    disabled={preQuizActionLoading.reading}
                  >
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Regenerar texto
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleCustomInstructionSelect}>
                    ✍️ Instrucción personalizada
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Popover open={customInstructionOpen} onOpenChange={setCustomInstructionOpen}>
                <PopoverTrigger asChild>
                  <button
                    ref={customInstructionAnchorRef}
                    className="absolute right-0 top-0 h-0 w-0 opacity-0 pointer-events-none"
                    aria-hidden
                  />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 space-y-3">
                  <div>
                    <p className="text-sm font-medium">Describe el ajuste</p>
                    <p className="text-xs text-muted-foreground">
                      Ejemplo: “Hazlo más corto y usa una analogía de fútbol”.
                    </p>
                  </div>
                  <Textarea
                    value={customInstructionText}
                    onChange={(e) => setCustomInstructionText(e.target.value)}
                    placeholder="Indicación para la IA"
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCustomInstructionOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        await handleReadingAIAction('custom', customInstructionText);
                        setCustomInstructionOpen(false);
                      }}
                      disabled={!customInstructionText.trim()}
                    >
                      Aplicar
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={preQuizState.lectura}
              onChange={(e) => updateReadingText(e.target.value)}
              className="min-h-[180px]"
            />
            {preQuizDirty && (
              <p className="text-xs text-muted-foreground mt-2">Cambios pendientes de guardado.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preguntas generadas</CardTitle>
              <CardDescription>Edita manualmente o usa acciones asistidas.</CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handleRegenerateAllQuestions}
              disabled={preQuizActionLoading.regenerateAll}
            >
              {preQuizActionLoading.regenerateAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Regenerar todas
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {preQuizState.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">Pregunta {index + 1}</p>
                    <p className="text-xs text-muted-foreground capitalize">{question.tipo || 'sin tipo'}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={!!perQuestionLoading[question.id]}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleSwapQuestion(question.id);
                        }}
                      >
                        🔀 Cambiar pregunta
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={!!perQuestionLoading[question.id]}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleAdjustQuestionDifficulty(question.id, 'easier');
                        }}
                      >
                        🧠 Hacer más fácil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!!perQuestionLoading[question.id]}
                        onSelect={(event) => {
                          event.preventDefault();
                          handleAdjustQuestionDifficulty(question.id, 'harder');
                        }}
                      >
                        🧠 Hacer más difícil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Textarea
                  value={question.texto}
                  onChange={(e) => handleQuestionTextChange(question.id, e.target.value)}
                  className="min-h-[100px]"
                />

                <div className="space-y-2">
                  {question.opciones.map((opcion) => (
                    <div key={opcion.id} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correcta-${question.id}`}
                        className="h-4 w-4"
                        checked={question.respuestaCorrecta === opcion.id}
                        onChange={() => setQuestionCorrectOption(question.id, opcion.id)}
                      />
                      <Input
                        value={opcion.label}
                        onChange={(e) => updateQuestionOption(question.id, opcion.id, e.target.value)}
                        placeholder="Texto de la opción"
                      />
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1"
                    onClick={() => addQuestionOption(question.id)}
                  >
                    + Agregar opción
                  </Button>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Retroalimentación</Label>
                  <Textarea
                    value={question.justificacion || ""}
                    onChange={(e) => handleJustificacionChange(question.id, e.target.value)}
                    placeholder="Mensaje que verá el estudiante al responder"
                    className="mt-1"
                  />
                </div>

                {perQuestionLoading[question.id] && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Ajustando con IA...
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStep4 = () => {
    if (postQuizFetching || postQuizLoading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Procesando evaluación POST...
        </div>
      );
    }

    if (!postQuizState) {
      return (
        <div className="border border-dashed rounded-lg p-6 text-center space-y-4">
          <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Aún no has generado la evaluación POST</p>
            <p className="text-sm text-muted-foreground">
              Se crearán 10 preguntas para medir el aprendizaje posterior a la clase.
            </p>
          </div>
          <Button onClick={generatePostQuiz} disabled={postQuizLoading} className="inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generar evaluación POST
          </Button>
        </div>
      );
    }

    const perQuestionLoading = postQuizActionLoading.perQuestion;

    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <AlertCircle className="inline h-4 w-4 mr-1" />
            Estas preguntas deben medir aplicación, análisis y razonamiento. Asegúrate de que cubran todo el cierre de la clase.
          </p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preguntas del POST</CardTitle>
              <CardDescription>Analiza cada pregunta y ajusta si es necesario.</CardDescription>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="gap-2"
              onClick={handlePostRegenerateAllQuestions}
              disabled={postQuizActionLoading.regenerateAll}
            >
              {postQuizActionLoading.regenerateAll ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Regenerar todas
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {postQuizState.questions.map((question, index) => (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">Pregunta {index + 1}</p>
                    <p className="text-xs text-muted-foreground capitalize">{question.tipo || 'sin tipo'}</p>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      {question.tipoRespuesta === 'multiple_choice' ? 'Opción múltiple' : 'Respuesta abierta'}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        disabled={!!perQuestionLoading[question.id]}
                        onSelect={(event) => {
                          event.preventDefault();
                          handlePostSwapQuestion(question.id);
                        }}
                      >
                        🔀 Cambiar pregunta
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={!!perQuestionLoading[question.id]}
                        onSelect={(event) => {
                          event.preventDefault();
                          handlePostAdjustQuestionDifficulty(question.id, 'easier');
                        }}
                      >
                        🧠 Hacer más fácil
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!!perQuestionLoading[question.id]}
                        onSelect={(event) => {
                          event.preventDefault();
                          handlePostAdjustQuestionDifficulty(question.id, 'harder');
                        }}
                      >
                        🧠 Hacer más difícil
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={question.tipoRespuesta === 'multiple_choice'}
                        onSelect={(event) => {
                          event.preventDefault();
                          handlePostQuestionTypeChange(question.id, 'multiple_choice');
                        }}
                      >
                        ✅ Convertir a opción múltiple
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={question.tipoRespuesta === 'texto_abierto'}
                        onSelect={(event) => {
                          event.preventDefault();
                          handlePostQuestionTypeChange(question.id, 'texto_abierto');
                        }}
                      >
                        ✍️ Convertir a respuesta abierta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Textarea
                  value={question.texto}
                  onChange={(e) => handlePostQuestionTextChange(question.id, e.target.value)}
                  className="min-h-[100px]"
                />

                {question.tipoRespuesta === 'multiple_choice' ? (
                  <div className="space-y-2">
                    {question.opciones.map((opcion) => (
                      <div key={opcion.id} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`post-correcta-${question.id}`}
                          className="h-4 w-4"
                          checked={question.respuestaCorrecta === opcion.id}
                          onChange={() => setPostQuestionCorrectOption(question.id, opcion.id)}
                        />
                        <Input
                          value={opcion.label}
                          onChange={(e) => handlePostQuestionOptionChange(question.id, opcion.id, e.target.value)}
                          placeholder="Texto de la opción"
                        />
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1"
                      onClick={() => addPostQuestionOption(question.id)}
                    >
                      + Agregar opción
                    </Button>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs text-muted-foreground">Respuesta esperada (opcional)</Label>
                    <Textarea
                      value={question.respuestaCorrecta || ""}
                      onChange={(e) => handlePostExpectedAnswerChange(question.id, e.target.value)}
                      placeholder="Describe la respuesta que considerarás correcta"
                      className="mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Retroalimentación</Label>
                  <Textarea
                    value={question.justificacion || ""}
                    onChange={(e) => handlePostJustificacionChange(question.id, e.target.value)}
                    placeholder="Mensaje que verá el estudiante al responder"
                    className="mt-1"
                  />
                </div>

                {perQuestionLoading[question.id] && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Ajustando con IA...
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {postQuizDirty && (
          <p className="text-xs text-muted-foreground">Cambios pendientes de guardado.</p>
        )}
      </div>
    );
  };

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

  useEffect(() => {
    if (sinParametros) {
      if (!selectionResetRef.current) {
        resetWorkflowState();
        selectionResetRef.current = true;
      }
    } else {
      selectionResetRef.current = false;
    }
  }, [sinParametros, resetWorkflowState]);

  const handleContinuarClaseEnProceso = () => {
    if (!claseEnProceso) return;
    const extraParam = claseEnProceso.esExtraordinaria ? '&extraordinaria=true' : '';
    navigate(`/profesor/generar-clase?clase=${claseEnProceso.id}${extraParam}`);
  };

  const handleDescartarClaseEnProceso = () => {
    resetWorkflowState({ clearInProgress: true });
  };

  const handleSeleccionarSesion = (sesionId: string) => {
    resetWorkflowState();
    navigate(`/profesor/generar-clase?clase=${sesionId}`);
  };

  const handleCrearExtraordinaria = () => {
    resetWorkflowState();
    navigate("/profesor/generar-clase?extraordinaria=true");
  };

  const handleVolverAlSelector = useCallback(() => {
    resetWorkflowState();
    navigate("/profesor/generar-clase");
  }, [resetWorkflowState, navigate]);

  const handleDescartarEIniciarNueva = useCallback(() => {
    resetWorkflowState({ clearInProgress: true });
    navigate("/profesor/generar-clase");
  }, [resetWorkflowState, navigate]);

  return (
    <AppLayout>
      {sinParametros ? (
        <SeleccionarSesionSection
          claseEnProceso={claseEnProceso}
          onContinuarClase={handleContinuarClaseEnProceso}
          onDescartarClase={handleDescartarClaseEnProceso}
          onSeleccionarSesion={handleSeleccionarSesion}
          onCrearExtraordinaria={handleCrearExtraordinaria}
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

          {claseEnProceso && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-medium text-primary flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Estás editando una clase en proceso
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {claseEnProceso.tema || "Tema sin nombre"}
                    {claseEnProceso.grupo ? ` • ${claseEnProceso.grupo}` : ""}
                  </p>
                  {claseEnProceso.estado && (
                    <Badge variant="outline" className="mt-1">
                      Paso: {claseEnProceso.estado.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <Button variant="ghost" onClick={handleVolverAlSelector}>
                    Volver al selector
                  </Button>
                  <Button variant="outline" onClick={handleDescartarEIniciarNueva}>
                    Descartar e iniciar otra
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ProgressBar steps={STEPS} currentStep={currentStep} />

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <CardTitle>{STEPS[currentStep - 1].label}</CardTitle>
                  {currentStep === 1 && (
                    <span className="text-xs text-muted-foreground font-normal">
                      {Math.round(progresoStep1)}% completado
                    </span>
                  )}
                </div>
                {currentStep === 1 && (
                  <Progress value={progresoStep1} className="h-1.5 mb-2" />
                )}
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
                    disabled={isContinueDisabled}
                    className="flex-1"
                  >
                    {(loading || isStep3AsyncInFlight) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {currentStep === 5 ? 'Confirmar y Programar' : 'Continuar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

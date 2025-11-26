// Tipos para el módulo de métricas del salón

export interface ConceptoMetrica {
  concepto: string;
  porcentaje_logro: number;
  nivel_logro?: 'bajo' | 'intermedio' | 'alto';
  semaforo?: 'verde' | 'amarillo' | 'rojo';
}

export interface AlumnoRiesgo {
  id: string;
  nombre: string;
  apellido?: string;
  porcentaje: number;
}

export interface MetricasGlobales {
  participacion_promedio: number;
  dominio_por_conceptos: ConceptoMetrica[];
  areas_fuertes: Array<{ concepto: string; porcentaje: number }>;
  areas_dificultad: Array<{ concepto: string; porcentaje: number }>;
  alumnos_riesgo: {
    cantidad: number;
    porcentaje: number;
  };
}

export interface FiltrosDisponibles {
  materias: Array<{ id: string; nombre: string }>;
  temas: Array<{ id: string; nombre: string; id_materia: string }>;
  clases: Array<{
    id: string;
    numero_sesion: number | null;
    fecha_programada: string | null;
    id_tema: string;
  }>;
}

export interface DatosPre {
  participacion: {
    porcentaje: number;
    ausentes: Array<{ id: string; nombre: string; apellido?: string }>;
  };
  nivel_preparacion: {
    porcentaje: number;
    clasificacion: 'baja' | 'media' | 'alta';
  };
  conceptos_debiles: Array<{ concepto: string; porcentaje_acierto: number }>;
  alumnos_riesgo: AlumnoRiesgo[];
}

export interface DatosPost {
  participacion: {
    porcentaje: number;
  };
  nivel_logro: {
    promedio: number;
    distribucion: {
      bajo: number;
      intermedio: number;
      alto: number;
    };
  };
  conceptos_logrados: Array<{
    concepto: string;
    porcentaje_logro: number;
    semaforo: 'verde' | 'amarillo' | 'rojo';
  }>;
  alumnos_apoyo: AlumnoRiesgo[];
}

export interface RecomendacionPre {
  recomendacion: string;
  sugerencia: string;
}

export interface RecomendacionPost {
  recomendacion: string;
  sugerencia: string;
  tipo: 'refuerzo' | 'evaluacion_guia';
  evidencia?: string;
}

export interface Recomendaciones {
  pre: RecomendacionPre[];
  post: RecomendacionPost[];
}

export interface SalonMetricas {
  grupo: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
    cantidad_alumnos?: number;
  };
  metricas_globales: MetricasGlobales;
  filtros: FiltrosDisponibles;
  datos_pre: DatosPre | null;
  datos_post: DatosPost | null;
  recomendaciones: Recomendaciones;
}

export interface ResponseMisSalones {
  salones: SalonMetricas[];
  total_salones: number;
}

// Helper functions para calcular niveles
export function calcularNivelLogro(porcentaje: number): 'bajo' | 'intermedio' | 'alto' {
  if (porcentaje < 50) return 'bajo';
  if (porcentaje < 75) return 'intermedio';
  return 'alto';
}

export function calcularSemaforo(porcentaje: number): 'verde' | 'amarillo' | 'rojo' {
  if (porcentaje >= 75) return 'verde';
  if (porcentaje >= 50) return 'amarillo';
  return 'rojo';
}

export function clasificarPreparacion(porcentaje: number): 'baja' | 'media' | 'alta' {
  if (porcentaje < 50) return 'baja';
  if (porcentaje < 75) return 'media';
  return 'alta';
}


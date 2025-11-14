/**
 * Shared TypeScript types for Supabase functions
 */

export interface AsignacionProfesor {
  id: string;
  anio_escolar: string;
  id_materia: string;
  id_grupo: string;
  id_profesor: string;
  created_at?: string;
  materias?: {
    id: string;
    nombre: string;
    horas_semanales: number;
    descripcion?: string;
    orden?: number;
    id_plan_anual?: string;
    plan_anual?: {
      grado: string;
      anio_escolar: string;
    };
  };
  grupos?: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
    cantidad_alumnos?: number;
  };
}

export interface Tema {
  id: string;
  nombre: string;
  descripcion?: string;
  objetivos?: string;
  duracion_estimada?: number;
  bimestre: number;
  orden: number;
  id_materia: string;
  tema_base_id?: string | null;
  estado?: 'completado' | 'en_progreso' | 'pendiente';
  clases_programadas?: number;
  clases_ejecutadas?: number;
  progreso?: number;
  es_modificado?: boolean;
}

export interface Bimestre {
  numero: number;
  nombre: string;
  periodo: string;
  temas: Tema[];
}

export interface MateriaConTemas {
  id: string;
  nombre: string;
  descripcion?: string;
  grado: string;
  grupo: string;
  seccion: string;
  horas_semanales: number;
  progreso_general: number;
  bimestres: Bimestre[];
}

export interface EstadisticasAsignacion {
  clases_programadas: number;
  clases_completadas: number;
  temas_cubiertos: number;
  porcentaje_cobertura: number;
  total_temas: number;
  temas_completados: number;
  temas_en_progreso: number;
  temas_pendientes: number;
}

export interface AsignacionConEstadisticas {
  id: string;
  materia: {
    id: string;
    nombre: string;
    horas_semanales: number;
    total_temas: number;
    descripcion?: string;
  };
  grupo: {
    id: string;
    nombre: string;
    grado: string;
    seccion: string;
    cantidad_alumnos: number;
  };
  anio_escolar: string;
  estadisticas: EstadisticasAsignacion;
  planificacion?: {
    progreso_general: number;
    bimestres: Bimestre[];
  };
}


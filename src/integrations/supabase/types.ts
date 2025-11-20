export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alumnos: {
        Row: {
          activo: boolean | null
          apellido: string | null
          caracteristicas: Json | null
          created_at: string | null
          edad: number | null
          grado: string
          id: string
          nombre: string | null
          seccion: string
          user_id: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido?: string | null
          caracteristicas?: Json | null
          created_at?: string | null
          edad?: number | null
          grado: string
          id?: string
          nombre?: string | null
          seccion: string
          user_id?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string | null
          caracteristicas?: Json | null
          created_at?: string | null
          edad?: number | null
          grado?: string
          id?: string
          nombre?: string | null
          seccion?: string
          user_id?: string | null
        }
        Relationships: []
      }
      alumnos_grupo: {
        Row: {
          anio_escolar: string
          created_at: string | null
          id: string
          id_alumno: string
          id_grupo: string
        }
        Insert: {
          anio_escolar: string
          created_at?: string | null
          id?: string
          id_alumno: string
          id_grupo: string
        }
        Update: {
          anio_escolar?: string
          created_at?: string | null
          id?: string
          id_alumno?: string
          id_grupo?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumnos_grupo_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumnos_grupo_id_grupo_fkey"
            columns: ["id_grupo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
        ]
      }
      anios_escolares: {
        Row: {
          activo: boolean | null
          anio_escolar: string
          created_at: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          id_institucion: string
        }
        Insert: {
          activo?: boolean | null
          anio_escolar: string
          created_at?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          id_institucion: string
        }
        Update: {
          activo?: boolean | null
          anio_escolar?: string
          created_at?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          id_institucion?: string
        }
        Relationships: [
          {
            foreignKeyName: "anios_escolares_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      apoderados: {
        Row: {
          created_at: string | null
          id: string
          id_alumno: string
          relacion: Database["public"]["Enums"]["relacion_apoderado"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_alumno: string
          relacion: Database["public"]["Enums"]["relacion_apoderado"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_alumno?: string
          relacion?: Database["public"]["Enums"]["relacion_apoderado"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "apoderados_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
        ]
      }
      asignaciones_profesor: {
        Row: {
          anio_escolar: string
          created_at: string | null
          id: string
          id_grupo: string
          id_materia: string
          id_profesor: string
        }
        Insert: {
          anio_escolar: string
          created_at?: string | null
          id?: string
          id_grupo: string
          id_materia: string
          id_profesor: string
        }
        Update: {
          anio_escolar?: string
          created_at?: string | null
          id?: string
          id_grupo?: string
          id_materia?: string
          id_profesor?: string
        }
        Relationships: [
          {
            foreignKeyName: "asignaciones_profesor_id_grupo_fkey"
            columns: ["id_grupo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_profesor_id_materia_fkey"
            columns: ["id_materia"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignaciones_profesor_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
        ]
      }
      calificaciones: {
        Row: {
          created_at: string | null
          id: string
          id_respuesta_alumno: string
          nota_numerica: number | null
          porcentaje_aciertos: number | null
          retroalimentacion: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_respuesta_alumno: string
          nota_numerica?: number | null
          porcentaje_aciertos?: number | null
          retroalimentacion?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_respuesta_alumno?: string
          nota_numerica?: number | null
          porcentaje_aciertos?: number | null
          retroalimentacion?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_id_respuesta_alumno_fkey"
            columns: ["id_respuesta_alumno"]
            isOneToOne: true
            referencedRelation: "respuestas_alumno"
            referencedColumns: ["id"]
          },
        ]
      }
      clases: {
        Row: {
          areas_transversales: string[] | null
          contexto: string | null
          created_at: string | null
          duracion_minutos: number | null
          estado: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada: string | null
          fecha_programada: string | null
          grupo_edad: string | null
          id: string
          id_grupo: string
          id_guia_tema: string | null
          id_guia_version_actual: string | null
          id_profesor: string
          id_tema: string
          metodologia: string | null
          numero_sesion: number | null
          observaciones: string | null
          total_sesiones_tema: number | null
        }
        Insert: {
          areas_transversales?: string[] | null
          contexto?: string | null
          created_at?: string | null
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada?: string | null
          fecha_programada?: string | null
          grupo_edad?: string | null
          id?: string
          id_grupo: string
          id_guia_tema?: string | null
          id_guia_version_actual?: string | null
          id_profesor: string
          id_tema: string
          metodologia?: string | null
          numero_sesion?: number | null
          observaciones?: string | null
          total_sesiones_tema?: number | null
        }
        Update: {
          areas_transversales?: string[] | null
          contexto?: string | null
          created_at?: string | null
          duracion_minutos?: number | null
          estado?: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada?: string | null
          fecha_programada?: string | null
          grupo_edad?: string | null
          id?: string
          id_grupo?: string
          id_guia_tema?: string | null
          id_guia_version_actual?: string | null
          id_profesor?: string
          id_tema?: string
          metodologia?: string | null
          numero_sesion?: number | null
          observaciones?: string | null
          total_sesiones_tema?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clases_id_grupo_fkey"
            columns: ["id_grupo"]
            isOneToOne: false
            referencedRelation: "grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_guia_tema_fkey"
            columns: ["id_guia_tema"]
            isOneToOne: false
            referencedRelation: "guias_tema"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_guia_version_actual_fkey"
            columns: ["id_guia_version_actual"]
            isOneToOne: false
            referencedRelation: "guias_clase_versiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clases_id_tema_fkey"
            columns: ["id_tema"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_alertas: {
        Row: {
          created_at: string | null
          dias_lejana: number | null
          dias_programada: number | null
          dias_proxima: number | null
          dias_urgente: number | null
          id: string
          id_institucion: string
          rango_dias_clases_pendientes: number | null
        }
        Insert: {
          created_at?: string | null
          dias_lejana?: number | null
          dias_programada?: number | null
          dias_proxima?: number | null
          dias_urgente?: number | null
          id?: string
          id_institucion: string
          rango_dias_clases_pendientes?: number | null
        }
        Update: {
          created_at?: string | null
          dias_lejana?: number | null
          dias_programada?: number | null
          dias_proxima?: number | null
          dias_urgente?: number | null
          id?: string
          id_institucion?: string
          rango_dias_clases_pendientes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracion_alertas_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: true
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos: {
        Row: {
          cantidad_alumnos: number | null
          created_at: string | null
          grado: string
          id: string
          id_institucion: string | null
          nombre: string
          perfil: Json | null
          seccion: string
        }
        Insert: {
          cantidad_alumnos?: number | null
          created_at?: string | null
          grado: string
          id?: string
          id_institucion?: string | null
          nombre: string
          perfil?: Json | null
          seccion: string
        }
        Update: {
          cantidad_alumnos?: number | null
          created_at?: string | null
          grado?: string
          id?: string
          id_institucion?: string | null
          nombre?: string
          perfil?: Json | null
          seccion?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupos_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_clase: {
        Row: {
          contenido: Json
          estructura: Json | null
          fecha_generacion: string | null
          generada_ia: boolean | null
          id: string
          id_clase: string
          objetivos: string | null
          preguntas_socraticas: Json | null
          recursos: Json | null
          updated_at: string | null
        }
        Insert: {
          contenido?: Json
          estructura?: Json | null
          fecha_generacion?: string | null
          generada_ia?: boolean | null
          id?: string
          id_clase: string
          objetivos?: string | null
          preguntas_socraticas?: Json | null
          recursos?: Json | null
          updated_at?: string | null
        }
        Update: {
          contenido?: Json
          estructura?: Json | null
          fecha_generacion?: string | null
          generada_ia?: boolean | null
          id?: string
          id_clase?: string
          objetivos?: string | null
          preguntas_socraticas?: Json | null
          recursos?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guias_clase_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_clase_versiones: {
        Row: {
          aprobada_por: string | null
          contenido: Json
          created_at: string
          es_version_final: boolean | null
          estado: string | null
          estructura: Json | null
          fecha_aprobacion: string | null
          generada_ia: boolean | null
          id: string
          id_clase: string
          objetivos: string | null
          preguntas_socraticas: Json | null
          updated_at: string
          version_numero: number
        }
        Insert: {
          aprobada_por?: string | null
          contenido?: Json
          created_at?: string
          es_version_final?: boolean | null
          estado?: string | null
          estructura?: Json | null
          fecha_aprobacion?: string | null
          generada_ia?: boolean | null
          id?: string
          id_clase: string
          objetivos?: string | null
          preguntas_socraticas?: Json | null
          updated_at?: string
          version_numero?: number
        }
        Update: {
          aprobada_por?: string | null
          contenido?: Json
          created_at?: string
          es_version_final?: boolean | null
          estado?: string | null
          estructura?: Json | null
          fecha_aprobacion?: string | null
          generada_ia?: boolean | null
          id?: string
          id_clase?: string
          objetivos?: string | null
          preguntas_socraticas?: Json | null
          updated_at?: string
          version_numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "guias_clase_versiones_aprobada_por_fkey"
            columns: ["aprobada_por"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_clase_versiones_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      guias_tema: {
        Row: {
          contenido: Json
          contexto_grupo: string | null
          created_at: string | null
          estructura_sesiones: Json | null
          id: string
          id_profesor: string
          id_tema: string
          metodologias: string[] | null
          objetivos_generales: string | null
          total_sesiones: number
          updated_at: string | null
        }
        Insert: {
          contenido?: Json
          contexto_grupo?: string | null
          created_at?: string | null
          estructura_sesiones?: Json | null
          id?: string
          id_profesor: string
          id_tema: string
          metodologias?: string[] | null
          objetivos_generales?: string | null
          total_sesiones: number
          updated_at?: string | null
        }
        Update: {
          contenido?: Json
          contexto_grupo?: string | null
          created_at?: string | null
          estructura_sesiones?: Json | null
          id?: string
          id_profesor?: string
          id_tema?: string
          metodologias?: string[] | null
          objetivos_generales?: string | null
          total_sesiones?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guias_tema_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guias_tema_id_tema_fkey"
            columns: ["id_tema"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      instituciones: {
        Row: {
          configuracion: Json | null
          created_at: string | null
          id: string
          logo: string | null
          nombre: string
        }
        Insert: {
          configuracion?: Json | null
          created_at?: string | null
          id?: string
          logo?: string | null
          nombre: string
        }
        Update: {
          configuracion?: Json | null
          created_at?: string | null
          id?: string
          logo?: string | null
          nombre?: string
        }
        Relationships: []
      }
      materias: {
        Row: {
          created_at: string | null
          descripcion: string | null
          horas_semanales: number | null
          id: string
          id_plan_anual: string
          nombre: string
          orden: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          horas_semanales?: number | null
          id?: string
          id_plan_anual: string
          nombre: string
          orden?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          horas_semanales?: number | null
          id?: string
          id_plan_anual?: string
          nombre?: string
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materias_id_plan_anual_fkey"
            columns: ["id_plan_anual"]
            isOneToOne: false
            referencedRelation: "plan_anual"
            referencedColumns: ["id"]
          },
        ]
      }
      metricas_clase: {
        Row: {
          datos_estadisticos: Json | null
          fecha_generacion: string | null
          id: string
          id_clase: string
          recomendaciones: Json | null
          tipo: Database["public"]["Enums"]["tipo_quiz"]
        }
        Insert: {
          datos_estadisticos?: Json | null
          fecha_generacion?: string | null
          id?: string
          id_clase: string
          recomendaciones?: Json | null
          tipo: Database["public"]["Enums"]["tipo_quiz"]
        }
        Update: {
          datos_estadisticos?: Json | null
          fecha_generacion?: string | null
          id?: string
          id_clase?: string
          recomendaciones?: Json | null
          tipo?: Database["public"]["Enums"]["tipo_quiz"]
        }
        Relationships: [
          {
            foreignKeyName: "metricas_clase_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos_academicos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          id_anio_escolar: string
          nombre: string
          numero: number
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          id_anio_escolar: string
          nombre: string
          numero: number
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          id_anio_escolar?: string
          nombre?: string
          numero?: number
        }
        Relationships: [
          {
            foreignKeyName: "periodos_academicos_id_anio_escolar_fkey"
            columns: ["id_anio_escolar"]
            isOneToOne: false
            referencedRelation: "anios_escolares"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_anual: {
        Row: {
          anio_escolar: string
          created_at: string | null
          estado: string | null
          grado: string
          id: string
          id_institucion: string
          plan_base: boolean | null
        }
        Insert: {
          anio_escolar: string
          created_at?: string | null
          estado?: string | null
          grado: string
          id?: string
          id_institucion: string
          plan_base?: boolean | null
        }
        Update: {
          anio_escolar?: string
          created_at?: string | null
          estado?: string | null
          grado?: string
          id?: string
          id_institucion?: string
          plan_base?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_anual_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      preguntas: {
        Row: {
          created_at: string | null
          id: string
          id_quiz: string
          justificacion: string | null
          opciones: Json | null
          orden: number | null
          respuesta_correcta: string
          texto_contexto: string | null
          texto_pregunta: string
          tipo: Database["public"]["Enums"]["tipo_pregunta"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_quiz: string
          justificacion?: string | null
          opciones?: Json | null
          orden?: number | null
          respuesta_correcta: string
          texto_contexto?: string | null
          texto_pregunta: string
          tipo: Database["public"]["Enums"]["tipo_pregunta"]
        }
        Update: {
          created_at?: string | null
          id?: string
          id_quiz?: string
          justificacion?: string | null
          opciones?: Json | null
          orden?: number | null
          respuesta_correcta?: string
          texto_contexto?: string | null
          texto_pregunta?: string
          tipo?: Database["public"]["Enums"]["tipo_pregunta"]
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      profesores: {
        Row: {
          activo: boolean | null
          created_at: string | null
          especialidad: string | null
          id: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          especialidad?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          especialidad?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          apellido: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          id_institucion: string | null
          nombre: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          id?: string
          id_institucion?: string | null
          nombre?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          apellido?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          id_institucion?: string | null
          nombre?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
      propuestas_actualizacion: {
        Row: {
          descripcion: string
          estado: Database["public"]["Enums"]["estado_propuesta"] | null
          fecha_propuesta: string | null
          fecha_respuesta: string | null
          id: string
          id_profesor: string
          id_tema: string
          justificacion: string | null
        }
        Insert: {
          descripcion: string
          estado?: Database["public"]["Enums"]["estado_propuesta"] | null
          fecha_propuesta?: string | null
          fecha_respuesta?: string | null
          id?: string
          id_profesor: string
          id_tema: string
          justificacion?: string | null
        }
        Update: {
          descripcion?: string
          estado?: Database["public"]["Enums"]["estado_propuesta"] | null
          fecha_propuesta?: string | null
          fecha_respuesta?: string | null
          id?: string
          id_profesor?: string
          id_tema?: string
          justificacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_actualizacion_id_profesor_fkey"
            columns: ["id_profesor"]
            isOneToOne: false
            referencedRelation: "profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "propuestas_actualizacion_id_tema_fkey"
            columns: ["id_tema"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_quiz"] | null
          fecha_disponible: string | null
          fecha_limite: string | null
          id: string
          id_clase: string
          instrucciones: string | null
          tiempo_limite: number | null
          tipo: Database["public"]["Enums"]["tipo_quiz"]
          tipo_evaluacion: string | null
          titulo: string
        }
        Insert: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_quiz"] | null
          fecha_disponible?: string | null
          fecha_limite?: string | null
          id?: string
          id_clase: string
          instrucciones?: string | null
          tiempo_limite?: number | null
          tipo: Database["public"]["Enums"]["tipo_quiz"]
          tipo_evaluacion?: string | null
          titulo: string
        }
        Update: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_quiz"] | null
          fecha_disponible?: string | null
          fecha_limite?: string | null
          id?: string
          id_clase?: string
          instrucciones?: string | null
          tiempo_limite?: number | null
          tipo?: Database["public"]["Enums"]["tipo_quiz"]
          tipo_evaluacion?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_id_clase_fkey"
            columns: ["id_clase"]
            isOneToOne: false
            referencedRelation: "clases"
            referencedColumns: ["id"]
          },
        ]
      }
      recomendaciones: {
        Row: {
          aplicada: boolean | null
          contenido: string
          created_at: string | null
          id: string
          id_clase: string
          id_clase_anterior: string | null
        }
        Insert: {
          aplicada?: boolean | null
          contenido: string
          created_at?: string | null
          id?: string
          id_clase: string
          id_clase_anterior?: string | null
        }
        Update: {
          aplicada?: boolean | null
          contenido?: string
          created_at?: string | null
          id?: string
          id_clase?: string
          id_clase_anterior?: string | null
        }
        Relationships: []
      }
      respuestas_alumno: {
        Row: {
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_respuesta"] | null
          fecha_envio: string | null
          fecha_inicio: string | null
          id: string
          id_alumno: string
          id_quiz: string
        }
        Insert: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_respuesta"] | null
          fecha_envio?: string | null
          fecha_inicio?: string | null
          id?: string
          id_alumno: string
          id_quiz: string
        }
        Update: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_respuesta"] | null
          fecha_envio?: string | null
          fecha_inicio?: string | null
          id?: string
          id_alumno?: string
          id_quiz?: string
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_alumno_id_alumno_fkey"
            columns: ["id_alumno"]
            isOneToOne: false
            referencedRelation: "alumnos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_alumno_id_quiz_fkey"
            columns: ["id_quiz"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      respuestas_detalle: {
        Row: {
          created_at: string | null
          es_correcta: boolean | null
          id: string
          id_pregunta: string
          id_respuesta_alumno: string
          respuesta_alumno: string | null
          tiempo_segundos: number | null
        }
        Insert: {
          created_at?: string | null
          es_correcta?: boolean | null
          id?: string
          id_pregunta: string
          id_respuesta_alumno: string
          respuesta_alumno?: string | null
          tiempo_segundos?: number | null
        }
        Update: {
          created_at?: string | null
          es_correcta?: boolean | null
          id?: string
          id_pregunta?: string
          id_respuesta_alumno?: string
          respuesta_alumno?: string | null
          tiempo_segundos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "respuestas_detalle_id_pregunta_fkey"
            columns: ["id_pregunta"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respuestas_detalle_id_respuesta_alumno_fkey"
            columns: ["id_respuesta_alumno"]
            isOneToOne: false
            referencedRelation: "respuestas_alumno"
            referencedColumns: ["id"]
          },
        ]
      }
      resultados_clase: {
        Row: {
          cantidad_estudiantes: number | null
          created_at: string | null
          id: string
          id_clase: string
          id_evaluacion: string | null
          nivel_comprension: number | null
          promedio_puntaje: number | null
          tasa_completacion: number | null
          tasa_participacion: number | null
        }
        Insert: {
          cantidad_estudiantes?: number | null
          created_at?: string | null
          id?: string
          id_clase: string
          id_evaluacion?: string | null
          nivel_comprension?: number | null
          promedio_puntaje?: number | null
          tasa_completacion?: number | null
          tasa_participacion?: number | null
        }
        Update: {
          cantidad_estudiantes?: number | null
          created_at?: string | null
          id?: string
          id_clase?: string
          id_evaluacion?: string | null
          nivel_comprension?: number | null
          promedio_puntaje?: number | null
          tasa_completacion?: number | null
          tasa_participacion?: number | null
        }
        Relationships: []
      }
      temas: {
        Row: {
          bimestre: number | null
          created_at: string | null
          descripcion: string | null
          duracion_estimada: number | null
          id: string
          id_materia: string
          nombre: string
          objetivos: string | null
          orden: number | null
          tema_base_id: string | null
        }
        Insert: {
          bimestre?: number | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          id?: string
          id_materia: string
          nombre: string
          objetivos?: string | null
          orden?: number | null
          tema_base_id?: string | null
        }
        Update: {
          bimestre?: number | null
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          id?: string
          id_materia?: string
          nombre?: string
          objetivos?: string | null
          orden?: number | null
          tema_base_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "temas_id_materia_fkey"
            columns: ["id_materia"]
            isOneToOne: false
            referencedRelation: "materias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "temas_tema_base_id_fkey"
            columns: ["tema_base_id"]
            isOneToOne: false
            referencedRelation: "temas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          id_institucion: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_institucion?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_institucion?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_id_institucion_fkey"
            columns: ["id_institucion"]
            isOneToOne: false
            referencedRelation: "instituciones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_institucion: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "profesor" | "alumno" | "apoderado"
      estado_clase:
        | "borrador"
        | "generando_clase"
        | "editando_guia"
        | "guia_aprobada"
        | "quiz_pre_generando"
        | "quiz_pre_enviado"
        | "analizando_quiz_pre"
        | "modificando_guia"
        | "guia_final"
        | "clase_programada"
        | "en_clase"
        | "quiz_post_generando"
        | "quiz_post_enviado"
        | "analizando_resultados"
        | "completada"
        | "programada"
        | "ejecutada"
        | "cancelada"
      estado_propuesta: "pendiente" | "aprobada" | "rechazada"
      estado_quiz: "borrador" | "publicado" | "cerrado"
      estado_respuesta: "en_progreso" | "completado"
      relacion_apoderado: "padre" | "madre" | "tutor"
      tipo_pregunta: "opcion_multiple" | "verdadero_falso" | "respuesta_corta"
      tipo_quiz: "previo" | "post"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "profesor", "alumno", "apoderado"],
      estado_clase: [
        "borrador",
        "generando_clase",
        "editando_guia",
        "guia_aprobada",
        "quiz_pre_generando",
        "quiz_pre_enviado",
        "analizando_quiz_pre",
        "modificando_guia",
        "guia_final",
        "clase_programada",
        "en_clase",
        "quiz_post_generando",
        "quiz_post_enviado",
        "analizando_resultados",
        "completada",
        "programada",
        "ejecutada",
        "cancelada",
      ],
      estado_propuesta: ["pendiente", "aprobada", "rechazada"],
      estado_quiz: ["borrador", "publicado", "cerrado"],
      estado_respuesta: ["en_progreso", "completado"],
      relacion_apoderado: ["padre", "madre", "tutor"],
      tipo_pregunta: ["opcion_multiple", "verdadero_falso", "respuesta_corta"],
      tipo_quiz: ["previo", "post"],
    },
  },
} as const

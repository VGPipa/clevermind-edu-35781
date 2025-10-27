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
          caracteristicas: Json | null
          created_at: string | null
          edad: number | null
          grado: string
          id: string
          seccion: string
          user_id: string
        }
        Insert: {
          activo?: boolean | null
          caracteristicas?: Json | null
          created_at?: string | null
          edad?: number | null
          grado: string
          id?: string
          seccion: string
          user_id: string
        }
        Update: {
          activo?: boolean | null
          caracteristicas?: Json | null
          created_at?: string | null
          edad?: number | null
          grado?: string
          id?: string
          seccion?: string
          user_id?: string
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
          created_at: string | null
          estado: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada: string | null
          fecha_programada: string | null
          id: string
          id_grupo: string
          id_profesor: string
          id_tema: string
          observaciones: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada?: string | null
          fecha_programada?: string | null
          id?: string
          id_grupo: string
          id_profesor: string
          id_tema: string
          observaciones?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: Database["public"]["Enums"]["estado_clase"] | null
          fecha_ejecutada?: string | null
          fecha_programada?: string | null
          id?: string
          id_grupo?: string
          id_profesor?: string
          id_tema?: string
          observaciones?: string | null
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
          fecha_generacion: string | null
          id: string
          id_clase: string
          recursos: Json | null
        }
        Insert: {
          contenido?: Json
          fecha_generacion?: string | null
          id?: string
          id_clase: string
          recursos?: Json | null
        }
        Update: {
          contenido?: Json
          fecha_generacion?: string | null
          id?: string
          id_clase?: string
          recursos?: Json | null
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
      plan_anual: {
        Row: {
          anio_escolar: string
          created_at: string | null
          estado: string | null
          grado: string
          id: string
          id_institucion: string
        }
        Insert: {
          anio_escolar: string
          created_at?: string | null
          estado?: string | null
          grado: string
          id?: string
          id_institucion: string
        }
        Update: {
          anio_escolar?: string
          created_at?: string | null
          estado?: string | null
          grado?: string
          id?: string
          id_institucion?: string
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
      temas: {
        Row: {
          created_at: string | null
          descripcion: string | null
          duracion_estimada: number | null
          id: string
          id_materia: string
          nombre: string
          objetivos: string | null
          orden: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          id?: string
          id_materia: string
          nombre: string
          objetivos?: string | null
          orden?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string | null
          duracion_estimada?: number | null
          id?: string
          id_materia?: string
          nombre?: string
          objetivos?: string | null
          orden?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "temas_id_materia_fkey"
            columns: ["id_materia"]
            isOneToOne: false
            referencedRelation: "materias"
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
      estado_clase: "programada" | "ejecutada" | "cancelada"
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
      estado_clase: ["programada", "ejecutada", "cancelada"],
      estado_propuesta: ["pendiente", "aprobada", "rechazada"],
      estado_quiz: ["borrador", "publicado", "cerrado"],
      estado_respuesta: ["en_progreso", "completado"],
      relacion_apoderado: ["padre", "madre", "tutor"],
      tipo_pregunta: ["opcion_multiple", "verdadero_falso", "respuesta_corta"],
      tipo_quiz: ["previo", "post"],
    },
  },
} as const

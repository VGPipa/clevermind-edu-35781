
-- Migration: 20251027030951
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'profesor', 'alumno', 'apoderado');

-- Create ENUM for relation types
CREATE TYPE public.relacion_apoderado AS ENUM ('padre', 'madre', 'tutor');

-- Create ENUM for quiz types
CREATE TYPE public.tipo_quiz AS ENUM ('previo', 'post');

-- Create ENUM for question types
CREATE TYPE public.tipo_pregunta AS ENUM ('opcion_multiple', 'verdadero_falso', 'respuesta_corta');

-- Create ENUM for quiz state
CREATE TYPE public.estado_quiz AS ENUM ('borrador', 'publicado', 'cerrado');

-- Create ENUM for response state
CREATE TYPE public.estado_respuesta AS ENUM ('en_progreso', 'completado');

-- Create ENUM for class state
CREATE TYPE public.estado_clase AS ENUM ('programada', 'ejecutada', 'cancelada');

-- Create ENUM for proposal state
CREATE TYPE public.estado_propuesta AS ENUM ('pendiente', 'aprobada', 'rechazada');

-- Instituciones
CREATE TABLE public.instituciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  logo TEXT,
  configuracion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Profiles (additional user info)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  nombre TEXT,
  apellido TEXT,
  avatar_url TEXT,
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profesores
CREATE TABLE public.profesores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  especialidad TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alumnos
CREATE TABLE public.alumnos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  grado TEXT NOT NULL,
  seccion TEXT NOT NULL,
  edad INTEGER,
  caracteristicas JSONB DEFAULT '{}',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Apoderados
CREATE TABLE public.apoderados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  id_alumno UUID REFERENCES public.alumnos(id) ON DELETE CASCADE NOT NULL,
  relacion public.relacion_apoderado NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plan Anual
CREATE TABLE public.plan_anual (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE NOT NULL,
  anio_escolar TEXT NOT NULL,
  grado TEXT NOT NULL,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materias
CREATE TABLE public.materias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_plan_anual UUID REFERENCES public.plan_anual(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  horas_semanales INTEGER,
  orden INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temas
CREATE TABLE public.temas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_materia UUID REFERENCES public.materias(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  objetivos TEXT,
  duracion_estimada INTEGER,
  orden INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grupos/Secciones
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  grado TEXT NOT NULL,
  seccion TEXT NOT NULL,
  cantidad_alumnos INTEGER DEFAULT 0,
  perfil JSONB DEFAULT '{}',
  id_institucion UUID REFERENCES public.instituciones(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asignación Profesor-Materia-Grupo
CREATE TABLE public.asignaciones_profesor (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_profesor UUID REFERENCES public.profesores(id) ON DELETE CASCADE NOT NULL,
  id_materia UUID REFERENCES public.materias(id) ON DELETE CASCADE NOT NULL,
  id_grupo UUID REFERENCES public.grupos(id) ON DELETE CASCADE NOT NULL,
  anio_escolar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Relación Alumno-Grupo
CREATE TABLE public.alumnos_grupo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_alumno UUID REFERENCES public.alumnos(id) ON DELETE CASCADE NOT NULL,
  id_grupo UUID REFERENCES public.grupos(id) ON DELETE CASCADE NOT NULL,
  anio_escolar TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id_alumno, id_grupo, anio_escolar)
);

-- Clases programadas
CREATE TABLE public.clases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_tema UUID REFERENCES public.temas(id) ON DELETE CASCADE NOT NULL,
  id_profesor UUID REFERENCES public.profesores(id) ON DELETE CASCADE NOT NULL,
  id_grupo UUID REFERENCES public.grupos(id) ON DELETE CASCADE NOT NULL,
  fecha_programada DATE,
  fecha_ejecutada DATE,
  estado public.estado_clase DEFAULT 'programada',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guías de clase generadas
CREATE TABLE public.guias_clase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_clase UUID REFERENCES public.clases(id) ON DELETE CASCADE NOT NULL,
  contenido JSONB NOT NULL DEFAULT '{}',
  recursos JSONB DEFAULT '{}',
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quizzes
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_clase UUID REFERENCES public.clases(id) ON DELETE CASCADE NOT NULL,
  tipo public.tipo_quiz NOT NULL,
  titulo TEXT NOT NULL,
  instrucciones TEXT,
  tiempo_limite INTEGER,
  fecha_disponible TIMESTAMP WITH TIME ZONE,
  fecha_limite TIMESTAMP WITH TIME ZONE,
  estado public.estado_quiz DEFAULT 'borrador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preguntas de quizzes
CREATE TABLE public.preguntas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_quiz UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  texto_contexto TEXT,
  texto_pregunta TEXT NOT NULL,
  tipo public.tipo_pregunta NOT NULL,
  opciones JSONB DEFAULT '[]',
  respuesta_correcta TEXT NOT NULL,
  justificacion TEXT,
  orden INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Respuestas de alumnos (header)
CREATE TABLE public.respuestas_alumno (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_quiz UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
  id_alumno UUID REFERENCES public.alumnos(id) ON DELETE CASCADE NOT NULL,
  fecha_inicio TIMESTAMP WITH TIME ZONE,
  fecha_envio TIMESTAMP WITH TIME ZONE,
  estado public.estado_respuesta DEFAULT 'en_progreso',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Respuestas por pregunta
CREATE TABLE public.respuestas_detalle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_respuesta_alumno UUID REFERENCES public.respuestas_alumno(id) ON DELETE CASCADE NOT NULL,
  id_pregunta UUID REFERENCES public.preguntas(id) ON DELETE CASCADE NOT NULL,
  respuesta_alumno TEXT,
  es_correcta BOOLEAN,
  tiempo_segundos INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calificaciones
CREATE TABLE public.calificaciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_respuesta_alumno UUID REFERENCES public.respuestas_alumno(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nota_numerica DECIMAL(5,2),
  porcentaje_aciertos DECIMAL(5,2),
  retroalimentacion JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Métricas generadas
CREATE TABLE public.metricas_clase (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_clase UUID REFERENCES public.clases(id) ON DELETE CASCADE NOT NULL,
  tipo public.tipo_quiz NOT NULL,
  datos_estadisticos JSONB DEFAULT '{}',
  recomendaciones JSONB DEFAULT '[]',
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Propuestas de actualización del plan
CREATE TABLE public.propuestas_actualizacion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_profesor UUID REFERENCES public.profesores(id) ON DELETE CASCADE NOT NULL,
  id_tema UUID REFERENCES public.temas(id) ON DELETE CASCADE NOT NULL,
  descripcion TEXT NOT NULL,
  justificacion TEXT,
  estado public.estado_propuesta DEFAULT 'pendiente',
  fecha_propuesta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_respuesta TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoderados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_anual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones_profesor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumnos_grupo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guias_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_alumno ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.respuestas_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_clase ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propuestas_actualizacion ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to get user's institution
CREATE OR REPLACE FUNCTION public.get_user_institucion(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id_institucion
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- RLS Policies

-- Instituciones: Admins can manage, others can view their own
CREATE POLICY "Admins can manage instituciones"
ON public.instituciones
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own institucion"
ON public.instituciones
FOR SELECT
TO authenticated
USING (id = public.get_user_institucion(auth.uid()));

-- User Roles: Users can view their own roles, admins can manage
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR id_institucion = public.get_user_institucion(auth.uid()));

-- Profesores: Profesores can view their own data, admins can manage
CREATE POLICY "Profesores can view their own data"
ON public.profesores
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage profesores"
ON public.profesores
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Alumnos: Alumnos can view their own data, profesores can view assigned alumnos
CREATE POLICY "Alumnos can view their own data"
ON public.alumnos
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'profesor')
  OR public.has_role(auth.uid(), 'apoderado')
);

CREATE POLICY "Admins can manage alumnos"
ON public.alumnos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Apoderados: Can view their own data and their children's data
CREATE POLICY "Apoderados can view their own data"
ON public.apoderados
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage apoderados"
ON public.apoderados
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Plan Anual: Everyone can view, admins can manage
CREATE POLICY "Users can view plan anual"
ON public.plan_anual
FOR SELECT
TO authenticated
USING (id_institucion = public.get_user_institucion(auth.uid()));

CREATE POLICY "Admins can manage plan anual"
ON public.plan_anual
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Materias: Everyone can view, admins can manage
CREATE POLICY "Users can view materias"
ON public.materias
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage materias"
ON public.materias
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Temas: Everyone can view, admins can manage
CREATE POLICY "Users can view temas"
ON public.temas
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage temas"
ON public.temas
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Grupos: Everyone can view their institution's grupos
CREATE POLICY "Users can view grupos"
ON public.grupos
FOR SELECT
TO authenticated
USING (id_institucion = public.get_user_institucion(auth.uid()));

CREATE POLICY "Admins can manage grupos"
ON public.grupos
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Asignaciones: Profesores can view their own, admins can manage
CREATE POLICY "Profesores can view their asignaciones"
ON public.asignaciones_profesor
FOR SELECT
TO authenticated
USING (
  id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage asignaciones"
ON public.asignaciones_profesor
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Alumnos_grupo: Students can view their own grupos
CREATE POLICY "Alumnos can view their grupos"
ON public.alumnos_grupo
FOR SELECT
TO authenticated
USING (
  id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'profesor')
);

CREATE POLICY "Admins can manage alumnos_grupo"
ON public.alumnos_grupo
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Clases: Profesores and alumnos can view their clases
CREATE POLICY "Users can view their clases"
ON public.clases
FOR SELECT
TO authenticated
USING (
  id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  OR id_grupo IN (
    SELECT id_grupo FROM public.alumnos_grupo 
    WHERE id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profesores can manage their clases"
ON public.clases
FOR ALL
TO authenticated
USING (
  id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Guias_clase: Same as clases
CREATE POLICY "Users can view guias"
ON public.guias_clase
FOR SELECT
TO authenticated
USING (
  id_clase IN (
    SELECT id FROM public.clases 
    WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Profesores can manage guias"
ON public.guias_clase
FOR ALL
TO authenticated
USING (
  id_clase IN (
    SELECT id FROM public.clases 
    WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Quizzes: Profesores can manage, alumnos can view published ones
CREATE POLICY "Profesores can manage quizzes"
ON public.quizzes
FOR ALL
TO authenticated
USING (
  id_clase IN (
    SELECT id FROM public.clases 
    WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Alumnos can view published quizzes"
ON public.quizzes
FOR SELECT
TO authenticated
USING (
  estado = 'publicado'
  AND id_clase IN (
    SELECT c.id FROM public.clases c
    JOIN public.alumnos_grupo ag ON ag.id_grupo = c.id_grupo
    JOIN public.alumnos a ON a.id = ag.id_alumno
    WHERE a.user_id = auth.uid()
  )
);

-- Preguntas: Same as quizzes
CREATE POLICY "Profesores can manage preguntas"
ON public.preguntas
FOR ALL
TO authenticated
USING (
  id_quiz IN (
    SELECT q.id FROM public.quizzes q
    JOIN public.clases c ON c.id = q.id_clase
    WHERE c.id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Alumnos can view preguntas of published quizzes"
ON public.preguntas
FOR SELECT
TO authenticated
USING (
  id_quiz IN (
    SELECT q.id FROM public.quizzes q
    JOIN public.clases c ON c.id = q.id_clase
    JOIN public.alumnos_grupo ag ON ag.id_grupo = c.id_grupo
    JOIN public.alumnos a ON a.id = ag.id_alumno
    WHERE a.user_id = auth.uid() AND q.estado = 'publicado'
  )
);

-- Respuestas_alumno: Alumnos can manage their own, profesores can view
CREATE POLICY "Alumnos can manage their respuestas"
ON public.respuestas_alumno
FOR ALL
TO authenticated
USING (
  id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid())
);

CREATE POLICY "Profesores can view respuestas"
ON public.respuestas_alumno
FOR SELECT
TO authenticated
USING (
  id_quiz IN (
    SELECT q.id FROM public.quizzes q
    JOIN public.clases c ON c.id = q.id_clase
    WHERE c.id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Respuestas_detalle: Same as respuestas_alumno
CREATE POLICY "Alumnos can manage their respuestas_detalle"
ON public.respuestas_detalle
FOR ALL
TO authenticated
USING (
  id_respuesta_alumno IN (
    SELECT id FROM public.respuestas_alumno 
    WHERE id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Profesores can view respuestas_detalle"
ON public.respuestas_detalle
FOR SELECT
TO authenticated
USING (
  id_respuesta_alumno IN (
    SELECT ra.id FROM public.respuestas_alumno ra
    JOIN public.quizzes q ON q.id = ra.id_quiz
    JOIN public.clases c ON c.id = q.id_clase
    WHERE c.id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Calificaciones: Alumnos can view their own, profesores can manage
CREATE POLICY "Alumnos can view their calificaciones"
ON public.calificaciones
FOR SELECT
TO authenticated
USING (
  id_respuesta_alumno IN (
    SELECT id FROM public.respuestas_alumno 
    WHERE id_alumno IN (SELECT id FROM public.alumnos WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'profesor')
);

CREATE POLICY "Profesores can manage calificaciones"
ON public.calificaciones
FOR ALL
TO authenticated
USING (
  id_respuesta_alumno IN (
    SELECT ra.id FROM public.respuestas_alumno ra
    JOIN public.quizzes q ON q.id = ra.id_quiz
    JOIN public.clases c ON c.id = q.id_clase
    WHERE c.id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Metricas_clase: Profesores can view their metrics
CREATE POLICY "Profesores can view their metricas"
ON public.metricas_clase
FOR SELECT
TO authenticated
USING (
  id_clase IN (
    SELECT id FROM public.clases 
    WHERE id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can insert metricas"
ON public.metricas_clase
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Propuestas: Profesores can manage their own, admins can manage all
CREATE POLICY "Profesores can manage their propuestas"
ON public.propuestas_actualizacion
FOR ALL
TO authenticated
USING (
  id_profesor IN (SELECT id FROM public.profesores WHERE user_id = auth.uid())
);

CREATE POLICY "Admins can manage all propuestas"
ON public.propuestas_actualizacion
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, nombre, apellido)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'nombre',
    NEW.raw_user_meta_data->>'apellido'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251027032309
-- Agregar política para permitir a usuarios crear su primer rol al registrarse
CREATE POLICY "Users can create their first role on signup"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  )
);

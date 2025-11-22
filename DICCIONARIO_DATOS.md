# Diccionario de Datos - EduThink

Este documento describe la estructura de datos de la aplicación EduThink, incluyendo todas las tablas principales, sus campos, tipos de datos, restricciones y relaciones.

---

## Índice

1. [Entidades Principales](#entidades-principales)
   - [Instituciones](#instituciones)
   - [Plan Anual](#plan-anual)
   - [Materias](#materias)
   - [Temas](#temas)
   - [Grupos](#grupos)
   - [Clases](#clases)
   - [Guías de Tema](#guías-de-tema)
   - [Guías de Clase](#guías-de-clase)
   - [Quizzes](#quizzes)
   - [Preguntas](#preguntas)
   - [Respuestas](#respuestas)

2. [Entidades de Usuarios](#entidades-de-usuarios)
   - [Profiles](#profiles)
   - [User Roles](#user-roles)
   - [Profesores](#profesores)
   - [Alumnos](#alumnos)
   - [Apoderados](#apoderados)

3. [Entidades de Relación](#entidades-de-relación)
   - [Asignaciones Profesor](#asignaciones-profesor)
   - [Alumnos Grupo](#alumnos-grupo)

4. [Entidades de Configuración](#entidades-de-configuración)
   - [Años Escolares](#años-escolares)
   - [Períodos Académicos](#períodos-académicos)
   - [Configuración Alertas](#configuración-alertas)

5. [Entidades de Análisis](#entidades-de-análisis)
   - [Métricas Clase](#métricas-clase)
   - [Resultados Clase](#resultados-clase)
   - [Calificaciones](#calificaciones)
   - [Recomendaciones](#recomendaciones)
   - [Propuestas Actualización](#propuestas-actualización)

6. [Enumeraciones (ENUMs)](#enumeraciones-enums)

---

## Entidades Principales

### Instituciones

**Tabla:** `instituciones`

**Descripción:** Almacena la información de las instituciones educativas que utilizan el sistema.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la institución | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `nombre` | TEXT | Nombre de la institución educativa | NOT NULL |
| `logo` | TEXT | URL o ruta del logo de la institución | NULL |
| `configuracion` | JSONB | Configuración adicional en formato JSON | NULL, DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación del registro | NULL, DEFAULT NOW() |

**Relaciones:**
- Una institución puede tener múltiples años escolares (`anios_escolares`)
- Una institución puede tener múltiples planes anuales (`plan_anual`)
- Una institución puede tener múltiples grupos (`grupos`)
- Una institución puede tener múltiples perfiles de usuarios (`profiles`)
- Una institución puede tener una configuración de alertas (`configuracion_alertas`)

---

### Plan Anual

**Tabla:** `plan_anual`

**Descripción:** Define el plan académico anual por grado para una institución. Contiene las materias que se impartirán durante el año escolar.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del plan anual | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_institucion` | UUID | Referencia a la institución | FK → `instituciones.id`, NOT NULL |
| `anio_escolar` | TEXT | Año escolar (ej: "2024-2025") | NOT NULL |
| `grado` | TEXT | Grado académico (ej: "1ro", "2do", "3ro") | NOT NULL |
| `estado` | TEXT | Estado del plan (activo, inactivo, etc.) | NULL, DEFAULT 'activo' |
| `plan_base` | BOOLEAN | Indica si es un plan base o personalizado | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un plan anual pertenece a una institución (`instituciones`)
- Un plan anual contiene múltiples materias (`materias`)

---

### Materias

**Tabla:** `materias`

**Descripción:** Representa las materias o asignaturas que forman parte del plan anual de un grado específico.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la materia | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_plan_anual` | UUID | Referencia al plan anual | FK → `plan_anual.id`, NOT NULL |
| `nombre` | TEXT | Nombre de la materia (ej: "Matemáticas", "Lengua") | NOT NULL |
| `descripcion` | TEXT | Descripción detallada de la materia | NULL |
| `horas_semanales` | INTEGER | Número de horas semanales asignadas | NULL |
| `orden` | INTEGER | Orden de presentación de la materia | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una materia pertenece a un plan anual (`plan_anual`)
- Una materia contiene múltiples temas (`temas`)
- Una materia puede tener múltiples asignaciones de profesores (`asignaciones_profesor`)

---

### Temas

**Tabla:** `temas`

**Descripción:** Representa los temas o unidades temáticas dentro de una materia. Cada tema puede tener múltiples sesiones de clase.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del tema | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_materia` | UUID | Referencia a la materia | FK → `materias.id`, NOT NULL |
| `nombre` | TEXT | Nombre del tema | NOT NULL |
| `descripcion` | TEXT | Descripción detallada del tema | NULL |
| `objetivos` | TEXT | Objetivos de aprendizaje del tema | NULL |
| `duracion_estimada` | INTEGER | Duración estimada en horas o sesiones | NULL |
| `bimestre` | INTEGER | Bimestre en el que se imparte (1-4) | NULL |
| `orden` | INTEGER | Orden de presentación dentro de la materia | NULL |
| `tema_base_id` | UUID | Referencia a un tema base (para temas derivados) | FK → `temas.id`, NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un tema pertenece a una materia (`materias`)
- Un tema puede tener un tema base (`temas` - auto-referencia)
- Un tema puede tener múltiples guías maestras (`guias_tema`)
- Un tema puede tener múltiples clases/sesiones (`clases`)
- Un tema puede tener propuestas de actualización (`propuestas_actualizacion`)

---

### Grupos

**Tabla:** `grupos`

**Descripción:** Representa los grupos o salones de clase. Cada grupo tiene un grado y sección específicos.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del grupo | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_institucion` | UUID | Referencia a la institución | FK → `instituciones.id`, NULL |
| `nombre` | TEXT | Nombre del grupo (ej: "1ro A", "2do B") | NOT NULL |
| `grado` | TEXT | Grado académico del grupo | NOT NULL |
| `seccion` | TEXT | Sección del grupo (ej: "A", "B", "C") | NOT NULL |
| `cantidad_alumnos` | INTEGER | Número de alumnos en el grupo | NULL, DEFAULT 0 |
| `perfil` | JSONB | Perfil del grupo (características, contexto) | NULL, DEFAULT '{}' |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un grupo pertenece a una institución (`instituciones`)
- Un grupo puede tener múltiples alumnos (`alumnos_grupo`)
- Un grupo puede tener múltiples asignaciones de profesores (`asignaciones_profesor`)
- Un grupo puede tener múltiples clases (`clases`)

---

### Clases

**Tabla:** `clases`

**Descripción:** Representa las sesiones de clase programadas o ejecutadas. Cada clase está vinculada a un tema, grupo y profesor específico.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la clase | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_tema` | UUID | Referencia al tema de la clase | FK → `temas.id`, NOT NULL |
| `id_grupo` | UUID | Referencia al grupo/salón | FK → `grupos.id`, NOT NULL |
| `id_profesor` | UUID | Referencia al profesor | FK → `profesores.id`, NOT NULL |
| `id_guia_tema` | UUID | Referencia a la guía maestra del tema | FK → `guias_tema.id`, NULL |
| `id_guia_version_actual` | UUID | Referencia a la versión actual de la guía de clase | FK → `guias_clase_versiones.id`, NULL |
| `numero_sesion` | INTEGER | Número de sesión dentro del tema (1, 2, 3...) | NULL |
| `estado` | estado_clase | Estado actual de la clase (ver ENUMs) | NULL |
| `fecha_programada` | DATE | Fecha programada para la clase | NULL |
| `fecha_ejecutada` | DATE | Fecha en que se ejecutó la clase | NULL |
| `duracion_minutos` | INTEGER | Duración de la clase en minutos | NULL |
| `contexto` | TEXT | Contexto específico del grupo para esta clase | NULL |
| `metodologia` | TEXT | Metodología de enseñanza a utilizar | NULL |
| `grupo_edad` | TEXT | Rango de edad del grupo | NULL |
| `areas_transversales` | TEXT[] | Áreas transversales abordadas | NULL |
| `total_sesiones_tema` | INTEGER | Total de sesiones del tema | NULL |
| `observaciones` | TEXT | Observaciones adicionales | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Restricciones Únicas:**
- `(id_tema, id_grupo, id_profesor, numero_sesion)` - Evita duplicados de sesiones

**Relaciones:**
- Una clase pertenece a un tema (`temas`)
- Una clase pertenece a un grupo (`grupos`)
- Una clase pertenece a un profesor (`profesores`)
- Una clase puede tener una guía maestra (`guias_tema`)
- Una clase puede tener una versión actual de guía (`guias_clase_versiones`)
- Una clase puede tener múltiples versiones de guía (`guias_clase_versiones`)
- Una clase puede tener múltiples quizzes (`quizzes`)
- Una clase puede tener métricas (`metricas_clase`)
- Una clase puede tener resultados (`resultados_clase`)
- Una clase puede tener recomendaciones (`recomendaciones`)

---

### Guías de Tema

**Tabla:** `guias_tema`

**Descripción:** Almacena las guías maestras generadas para un tema. Una guía maestra define la estructura general y las sesiones del tema.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la guía | PK, NOT NULL, DEFAULT gen_random_uuid() |
| `id_tema` | UUID | Referencia al tema | FK → `temas.id`, NOT NULL |
| `id_profesor` | UUID | Referencia al profesor que creó la guía | FK → `profesores.id`, NOT NULL |
| `contenido` | JSONB | Contenido completo de la guía (objetivos, competencias, recursos) | NOT NULL, DEFAULT '{}' |
| `estructura_sesiones` | JSONB | Estructura de cada sesión (actividades, tiempos) | NULL, DEFAULT '[]' |
| `total_sesiones` | INTEGER | Número total de sesiones del tema | NOT NULL |
| `objetivos_generales` | TEXT | Objetivos generales del tema | NULL |
| `metodologias` | TEXT[] | Metodologías de enseñanza a utilizar | NULL |
| `contexto_grupo` | TEXT | Contexto específico del grupo | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha y hora de última actualización | NULL, DEFAULT NOW() |

**Relaciones:**
- Una guía de tema pertenece a un tema (`temas`)
- Una guía de tema pertenece a un profesor (`profesores`)
- Una guía de tema puede ser referenciada por múltiples clases (`clases`)

---

### Guías de Clase

**Tabla:** `guias_clase_versiones`

**Descripción:** Almacena las versiones de las guías de clase específicas para cada sesión. Permite múltiples versiones para iteración y mejoras.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la versión | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_clase` | UUID | Referencia a la clase | FK → `clases.id`, NOT NULL |
| `version_numero` | INTEGER | Número de versión (1, 2, 3...) | NOT NULL |
| `contenido` | JSONB | Contenido completo de la guía de clase | NOT NULL, DEFAULT '{}' |
| `objetivos` | TEXT | Objetivos específicos de la sesión | NULL |
| `estructura` | JSONB | Estructura detallada de la clase (actividades, tiempos) | NULL, DEFAULT '[]' |
| `preguntas_socraticas` | JSONB | Preguntas socráticas para pensamiento crítico | NULL, DEFAULT '[]' |
| `estado` | TEXT | Estado de la versión (borrador, aprobada, final) | NULL |
| `es_version_final` | BOOLEAN | Indica si es la versión final | NULL, DEFAULT false |
| `generada_ia` | BOOLEAN | Indica si fue generada por IA | NULL, DEFAULT true |
| `aprobada_por` | UUID | Referencia al profesor que aprobó | FK → `profesores.id`, NULL |
| `fecha_aprobacion` | TIMESTAMPTZ | Fecha de aprobación | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha y hora de última actualización | NOT NULL, DEFAULT NOW() |

**Restricciones Únicas:**
- `(id_clase, version_numero)` - Una clase no puede tener dos versiones con el mismo número

**Relaciones:**
- Una versión de guía pertenece a una clase (`clases`)
- Una versión puede ser aprobada por un profesor (`profesores`)
- Una clase puede tener múltiples versiones de guía

---

### Quizzes

**Tabla:** `quizzes`

**Descripción:** Representa las evaluaciones (quizzes) asociadas a una clase. Pueden ser de tipo previo (pre) o posterior (post).

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del quiz | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_clase` | UUID | Referencia a la clase | FK → `clases.id`, NOT NULL |
| `tipo` | tipo_quiz | Tipo de quiz: 'previo' o 'post' | NOT NULL (ver ENUMs) |
| `titulo` | TEXT | Título del quiz | NOT NULL |
| `instrucciones` | TEXT | Instrucciones para los alumnos | NULL |
| `estado` | estado_quiz | Estado del quiz (borrador, publicado, cerrado) | NULL (ver ENUMs) |
| `fecha_disponible` | TIMESTAMPTZ | Fecha desde la cual está disponible | NULL |
| `fecha_limite` | TIMESTAMPTZ | Fecha límite para responder | NULL |
| `tiempo_limite` | INTEGER | Tiempo límite en minutos | NULL |
| `tipo_evaluacion` | TEXT | Tipo de evaluación adicional | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un quiz pertenece a una clase (`clases`)
- Un quiz puede tener múltiples preguntas (`preguntas`)
- Un quiz puede tener múltiples respuestas de alumnos (`respuestas_alumno`)

---

### Preguntas

**Tabla:** `preguntas`

**Descripción:** Almacena las preguntas que forman parte de un quiz.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la pregunta | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_quiz` | UUID | Referencia al quiz | FK → `quizzes.id`, NOT NULL |
| `texto_pregunta` | TEXT | Texto de la pregunta | NOT NULL |
| `texto_contexto` | TEXT | Contexto adicional para la pregunta | NULL |
| `tipo` | tipo_pregunta | Tipo de pregunta (ver ENUMs) | NOT NULL |
| `opciones` | JSONB | Opciones de respuesta (para opción múltiple) | NULL |
| `respuesta_correcta` | TEXT | Respuesta correcta | NOT NULL |
| `justificacion` | TEXT | Justificación de la respuesta correcta | NULL |
| `orden` | INTEGER | Orden de presentación en el quiz | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una pregunta pertenece a un quiz (`quizzes`)
- Una pregunta puede tener múltiples respuestas detalle (`respuestas_detalle`)

---

### Respuestas

**Tabla:** `respuestas_alumno`

**Descripción:** Almacena las respuestas completas de un alumno a un quiz.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la respuesta | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_alumno` | UUID | Referencia al alumno | FK → `alumnos.id`, NOT NULL |
| `id_quiz` | UUID | Referencia al quiz | FK → `quizzes.id`, NOT NULL |
| `estado` | estado_respuesta | Estado de la respuesta (en_progreso, completado) | NULL (ver ENUMs) |
| `fecha_inicio` | TIMESTAMPTZ | Fecha y hora de inicio | NULL |
| `fecha_envio` | TIMESTAMPTZ | Fecha y hora de envío | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Tabla:** `respuestas_detalle`

**Descripción:** Almacena las respuestas individuales a cada pregunta dentro de una respuesta de alumno.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del detalle | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_respuesta_alumno` | UUID | Referencia a la respuesta del alumno | FK → `respuestas_alumno.id`, NOT NULL |
| `id_pregunta` | UUID | Referencia a la pregunta | FK → `preguntas.id`, NOT NULL |
| `respuesta_alumno` | TEXT | Respuesta proporcionada por el alumno | NULL |
| `es_correcta` | BOOLEAN | Indica si la respuesta es correcta | NULL |
| `tiempo_segundos` | INTEGER | Tiempo en segundos para responder | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una respuesta de alumno pertenece a un alumno (`alumnos`)
- Una respuesta de alumno pertenece a un quiz (`quizzes`)
- Una respuesta de alumno puede tener múltiples detalles (`respuestas_detalle`)
- Un detalle de respuesta pertenece a una pregunta (`preguntas`)

---

## Entidades de Usuarios

### Profiles

**Tabla:** `profiles`

**Descripción:** Almacena información adicional de los usuarios del sistema.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del perfil | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | Referencia al usuario en auth.users | FK → `auth.users.id`, NOT NULL, UNIQUE |
| `email` | TEXT | Correo electrónico del usuario | NOT NULL |
| `nombre` | TEXT | Nombre del usuario | NULL |
| `apellido` | TEXT | Apellido del usuario | NULL |
| `avatar_url` | TEXT | URL del avatar del usuario | NULL |
| `id_institucion` | UUID | Referencia a la institución | FK → `instituciones.id`, NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMPTZ | Fecha y hora de última actualización | NULL, DEFAULT NOW() |

**Relaciones:**
- Un perfil pertenece a un usuario de autenticación (`auth.users`)
- Un perfil puede pertenecer a una institución (`instituciones`)

---

### User Roles

**Tabla:** `user_roles`

**Descripción:** Define los roles de los usuarios en el sistema. Un usuario puede tener múltiples roles.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del rol | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | Referencia al usuario | FK → `auth.users.id`, NOT NULL |
| `role` | app_role | Rol del usuario (ver ENUMs) | NOT NULL |
| `id_institucion` | UUID | Referencia a la institución | FK → `instituciones.id`, NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Restricciones Únicas:**
- `(user_id, role)` - Un usuario no puede tener el mismo rol duplicado

**Relaciones:**
- Un rol pertenece a un usuario (`auth.users`)
- Un rol puede pertenecer a una institución (`instituciones`)

---

### Profesores

**Tabla:** `profesores`

**Descripción:** Almacena información específica de los profesores del sistema.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del profesor | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | Referencia al usuario | FK → `auth.users.id`, NOT NULL, UNIQUE |
| `especialidad` | TEXT | Especialidad del profesor | NULL |
| `activo` | BOOLEAN | Indica si el profesor está activo | NULL, DEFAULT true |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un profesor pertenece a un usuario (`auth.users`)
- Un profesor puede tener múltiples asignaciones (`asignaciones_profesor`)
- Un profesor puede crear múltiples guías de tema (`guias_tema`)
- Un profesor puede dictar múltiples clases (`clases`)
- Un profesor puede aprobar guías (`guias_clase_versiones`)

---

### Alumnos

**Tabla:** `alumnos`

**Descripción:** Almacena información específica de los alumnos del sistema.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del alumno | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | Referencia al usuario | FK → `auth.users.id`, NOT NULL, UNIQUE |
| `grado` | TEXT | Grado académico del alumno | NOT NULL |
| `seccion` | TEXT | Sección del alumno | NOT NULL |
| `edad` | INTEGER | Edad del alumno | NULL |
| `caracteristicas` | JSONB | Características adicionales del alumno | NULL, DEFAULT '{}' |
| `activo` | BOOLEAN | Indica si el alumno está activo | NULL, DEFAULT true |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un alumno pertenece a un usuario (`auth.users`)
- Un alumno puede estar en múltiples grupos (`alumnos_grupo`)
- Un alumno puede tener múltiples apoderados (`apoderados`)
- Un alumno puede tener múltiples respuestas a quizzes (`respuestas_alumno`)

---

### Apoderados

**Tabla:** `apoderados`

**Descripción:** Almacena la relación entre apoderados (padres/tutores) y alumnos.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del apoderado | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `user_id` | UUID | Referencia al usuario | FK → `auth.users.id`, NOT NULL, UNIQUE |
| `id_alumno` | UUID | Referencia al alumno | FK → `alumnos.id`, NOT NULL |
| `relacion` | relacion_apoderado | Tipo de relación (padre, madre, tutor) | NOT NULL (ver ENUMs) |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un apoderado pertenece a un usuario (`auth.users`)
- Un apoderado está relacionado con un alumno (`alumnos`)

---

## Entidades de Relación

### Asignaciones Profesor

**Tabla:** `asignaciones_profesor`

**Descripción:** Relaciona profesores con materias y grupos para un año escolar específico.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la asignación | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_profesor` | UUID | Referencia al profesor | FK → `profesores.id`, NOT NULL |
| `id_materia` | UUID | Referencia a la materia | FK → `materias.id`, NOT NULL |
| `id_grupo` | UUID | Referencia al grupo | FK → `grupos.id`, NOT NULL |
| `anio_escolar` | TEXT | Año escolar de la asignación | NOT NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una asignación pertenece a un profesor (`profesores`)
- Una asignación pertenece a una materia (`materias`)
- Una asignación pertenece a un grupo (`grupos`)

---

### Alumnos Grupo

**Tabla:** `alumnos_grupo`

**Descripción:** Relaciona alumnos con grupos para un año escolar específico.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la relación | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_alumno` | UUID | Referencia al alumno | FK → `alumnos.id`, NOT NULL |
| `id_grupo` | UUID | Referencia al grupo | FK → `grupos.id`, NOT NULL |
| `anio_escolar` | TEXT | Año escolar de la relación | NOT NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Restricciones Únicas:**
- `(id_alumno, id_grupo, anio_escolar)` - Un alumno no puede estar en el mismo grupo dos veces en el mismo año

**Relaciones:**
- Una relación pertenece a un alumno (`alumnos`)
- Una relación pertenece a un grupo (`grupos`)

---

## Entidades de Configuración

### Años Escolares

**Tabla:** `anios_escolares`

**Descripción:** Define los años escolares de una institución.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del año escolar | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_institucion` | UUID | Referencia a la institución | FK → `instituciones.id`, NOT NULL |
| `anio_escolar` | TEXT | Nombre del año escolar (ej: "2024-2025") | NOT NULL |
| `fecha_inicio` | DATE | Fecha de inicio del año escolar | NOT NULL |
| `fecha_fin` | DATE | Fecha de fin del año escolar | NOT NULL |
| `activo` | BOOLEAN | Indica si es el año escolar activo | NULL, DEFAULT false |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un año escolar pertenece a una institución (`instituciones`)
- Un año escolar puede tener múltiples períodos académicos (`periodos_academicos`)

---

### Períodos Académicos

**Tabla:** `periodos_academicos`

**Descripción:** Define los períodos académicos (bimestres, trimestres, etc.) dentro de un año escolar.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del período | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_anio_escolar` | UUID | Referencia al año escolar | FK → `anios_escolares.id`, NOT NULL |
| `nombre` | TEXT | Nombre del período (ej: "Bimestre 1", "Trimestre 1") | NOT NULL |
| `numero` | INTEGER | Número del período (1, 2, 3, 4) | NOT NULL |
| `fecha_inicio` | DATE | Fecha de inicio del período | NOT NULL |
| `fecha_fin` | DATE | Fecha de fin del período | NOT NULL |
| `activo` | BOOLEAN | Indica si es el período activo | NULL, DEFAULT false |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un período académico pertenece a un año escolar (`anios_escolares`)

---

### Configuración Alertas

**Tabla:** `configuracion_alertas`

**Descripción:** Almacena la configuración de alertas del sistema para una institución.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la configuración | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_institucion` | UUID | Referencia a la institución | FK → `instituciones.id`, NOT NULL, UNIQUE |
| `dias_urgente` | INTEGER | Días para considerar una clase como urgente | NULL |
| `dias_proxima` | INTEGER | Días para considerar una clase como próxima | NULL |
| `dias_programada` | INTEGER | Días para considerar una clase como programada | NULL |
| `dias_lejana` | INTEGER | Días para considerar una clase como lejana | NULL |
| `rango_dias_clases_pendientes` | INTEGER | Rango de días para mostrar clases pendientes | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una configuración pertenece a una institución (`instituciones`) - relación 1:1

---

## Entidades de Análisis

### Métricas Clase

**Tabla:** `metricas_clase`

**Descripción:** Almacena métricas y estadísticas generadas a partir de los resultados de quizzes.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la métrica | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_clase` | UUID | Referencia a la clase | FK → `clases.id`, NOT NULL |
| `tipo` | tipo_quiz | Tipo de quiz que generó la métrica (previo/post) | NOT NULL (ver ENUMs) |
| `datos_estadisticos` | JSONB | Datos estadísticos (promedios, desviaciones, etc.) | NULL |
| `recomendaciones` | JSONB | Recomendaciones generadas por IA | NULL |
| `fecha_generacion` | TIMESTAMPTZ | Fecha de generación de la métrica | NULL |

**Relaciones:**
- Una métrica pertenece a una clase (`clases`)

---

### Resultados Clase

**Tabla:** `resultados_clase`

**Descripción:** Almacena resultados agregados de una clase.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único del resultado | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_clase` | UUID | Referencia a la clase | FK → `clases.id`, NOT NULL |
| `id_evaluacion` | UUID | Referencia a la evaluación (quiz) | NULL |
| `cantidad_estudiantes` | INTEGER | Cantidad de estudiantes que participaron | NULL |
| `promedio_puntaje` | NUMERIC | Promedio de puntajes | NULL |
| `tasa_participacion` | NUMERIC | Tasa de participación (porcentaje) | NULL |
| `tasa_completacion` | NUMERIC | Tasa de completación (porcentaje) | NULL |
| `nivel_comprension` | NUMERIC | Nivel de comprensión promedio | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Un resultado pertenece a una clase (`clases`)

---

### Calificaciones

**Tabla:** `calificaciones`

**Descripción:** Almacena las calificaciones de las respuestas de los alumnos.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la calificación | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_respuesta_alumno` | UUID | Referencia a la respuesta del alumno | FK → `respuestas_alumno.id`, NOT NULL, UNIQUE |
| `nota_numerica` | NUMERIC | Nota numérica obtenida | NULL |
| `porcentaje_aciertos` | NUMERIC | Porcentaje de aciertos | NULL |
| `retroalimentacion` | JSONB | Retroalimentación generada | NULL |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una calificación pertenece a una respuesta de alumno (`respuestas_alumno`) - relación 1:1

---

### Recomendaciones

**Tabla:** `recomendaciones`

**Descripción:** Almacena recomendaciones generadas para mejorar clases futuras basadas en resultados previos.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la recomendación | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_clase` | UUID | Referencia a la clase actual | FK → `clases.id`, NOT NULL |
| `id_clase_anterior` | UUID | Referencia a la clase anterior que generó la recomendación | NULL |
| `contenido` | TEXT | Contenido de la recomendación | NOT NULL |
| `aplicada` | BOOLEAN | Indica si la recomendación fue aplicada | NULL, DEFAULT false |
| `created_at` | TIMESTAMPTZ | Fecha y hora de creación | NULL, DEFAULT NOW() |

**Relaciones:**
- Una recomendación pertenece a una clase (`clases`)

---

### Propuestas Actualización

**Tabla:** `propuestas_actualizacion`

**Descripción:** Almacena propuestas de actualización de temas realizadas por profesores.

| Campo | Tipo | Descripción | Restricciones |
|-------|------|-------------|---------------|
| `id` | UUID | Identificador único de la propuesta | PK, NOT NULL, DEFAULT uuid_generate_v4() |
| `id_profesor` | UUID | Referencia al profesor que propone | FK → `profesores.id`, NOT NULL |
| `id_tema` | UUID | Referencia al tema a actualizar | FK → `temas.id`, NOT NULL |
| `descripcion` | TEXT | Descripción de la propuesta | NOT NULL |
| `justificacion` | TEXT | Justificación de la propuesta | NULL |
| `estado` | estado_propuesta | Estado de la propuesta (pendiente, aprobada, rechazada) | NULL (ver ENUMs) |
| `fecha_propuesta` | TIMESTAMPTZ | Fecha de la propuesta | NULL |
| `fecha_respuesta` | TIMESTAMPTZ | Fecha de respuesta | NULL |

**Relaciones:**
- Una propuesta pertenece a un profesor (`profesores`)
- Una propuesta pertenece a un tema (`temas`)

---

## Enumeraciones (ENUMs)

### app_role

**Descripción:** Roles disponibles en el sistema.

**Valores:**
- `admin` - Administrador de la institución
- `profesor` - Docente que crea y gestiona clases
- `alumno` - Estudiante que participa en clases y quizzes
- `apoderado` - Tutor que monitorea el progreso del alumno

---

### estado_clase

**Descripción:** Estados posibles de una clase/sesión.

**Valores:**
- `borrador` - Clase en estado borrador, sin guía generada
- `generando_clase` - Generando la guía de clase con IA
- `editando_guia` - Editando la guía de clase
- `guia_aprobada` - Guía aprobada, lista para generar quiz pre
- `quiz_pre_generando` - Generando quiz previo
- `quiz_pre_enviado` - Quiz previo enviado a alumnos
- `analizando_quiz_pre` - Analizando resultados del quiz previo
- `modificando_guia` - Modificando guía basada en recomendaciones
- `guia_final` - Guía final aprobada
- `clase_programada` - Clase programada y lista
- `en_clase` - Clase en ejecución
- `quiz_post_generando` - Generando quiz posterior
- `quiz_post_enviado` - Quiz posterior enviado
- `analizando_resultados` - Analizando resultados del quiz post
- `completada` - Clase completada
- `programada` - Clase programada (estado legacy)
- `ejecutada` - Clase ejecutada (estado legacy)
- `cancelada` - Clase cancelada

---

### estado_quiz

**Descripción:** Estados de un quiz.

**Valores:**
- `borrador` - Quiz en creación, no publicado
- `publicado` - Quiz disponible para alumnos
- `cerrado` - Quiz cerrado, no acepta más respuestas

---

### estado_respuesta

**Descripción:** Estados de una respuesta de alumno.

**Valores:**
- `en_progreso` - El alumno está respondiendo el quiz
- `completado` - El alumno completó el quiz

---

### estado_propuesta

**Descripción:** Estados de una propuesta de actualización.

**Valores:**
- `pendiente` - Propuesta pendiente de revisión
- `aprobada` - Propuesta aprobada
- `rechazada` - Propuesta rechazada

---

### tipo_quiz

**Descripción:** Tipos de quiz disponibles.

**Valores:**
- `previo` - Quiz previo a la clase (diagnóstico)
- `post` - Quiz posterior a la clase (evaluación)

---

### tipo_pregunta

**Descripción:** Tipos de preguntas disponibles.

**Valores:**
- `opcion_multiple` - Pregunta de opción múltiple
- `verdadero_falso` - Pregunta de verdadero o falso
- `respuesta_corta` - Pregunta de respuesta corta

---

### relacion_apoderado

**Descripción:** Tipos de relación de un apoderado con un alumno.

**Valores:**
- `padre` - Padre del alumno
- `madre` - Madre del alumno
- `tutor` - Tutor legal del alumno

---

## Diagrama de Relaciones Principales

```
instituciones
  ├── anios_escolares
  │     └── periodos_academicos
  ├── plan_anual
  │     └── materias
  │           └── temas
  │                 ├── guias_tema
  │                 └── clases
  │                       ├── guias_clase_versiones
  │                       ├── quizzes
  │                       │     └── preguntas
  │                       │           └── respuestas_detalle
  │                       ├── metricas_clase
  │                       ├── resultados_clase
  │                       └── recomendaciones
  ├── grupos
  │     ├── alumnos_grupo
  │     ├── asignaciones_profesor
  │     └── clases
  ├── configuracion_alertas
  └── profiles

profesores
  ├── guias_tema
  ├── clases
  └── asignaciones_profesor

alumnos
  ├── alumnos_grupo
  ├── respuestas_alumno
  │     ├── respuestas_detalle
  │     └── calificaciones
  └── apoderados
```

---

## Notas Importantes

1. **UUIDs**: Todas las tablas principales utilizan UUID como identificador primario para mayor seguridad y escalabilidad.

2. **Timestamps**: La mayoría de las tablas incluyen `created_at` y algunas `updated_at` para auditoría.

3. **JSONB**: Se utiliza extensivamente para almacenar datos estructurados flexibles (contenido de guías, opciones de preguntas, características, etc.).

4. **RLS (Row Level Security)**: Todas las tablas tienen políticas RLS habilitadas para seguridad a nivel de fila.

5. **Soft Deletes**: Algunas entidades utilizan campos `activo` en lugar de eliminación física.

6. **Versiones**: El sistema de versiones en `guias_clase_versiones` permite iteración y mejoras sin perder historial.

7. **Estados**: El sistema de estados en `clases` controla el flujo completo del ciclo de vida de una clase.

---

**Última actualización:** Diciembre 2024


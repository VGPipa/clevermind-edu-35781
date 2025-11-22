# Flujo y Lógica General de la Aplicación EduThink

## 1. Arquitectura General

### Stack Tecnológico
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: React Query (TanStack Query) para cacheo y sincronización
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Autenticación**: Supabase Auth
- **Routing**: React Router v6

### Estructura de Carpetas
```
src/
├── pages/          # Páginas principales por rol
│   ├── admin/      # Dashboard, Plan Anual, Asignaciones, Configuración
│   ├── profesor/   # Dashboard, Planificación, Generar Clase, etc.
│   ├── alumno/     # Dashboard del alumno
│   └── apoderado/  # Dashboard del apoderado
├── components/     # Componentes reutilizables
│   ├── admin/      # Componentes específicos de admin
│   ├── profesor/   # Componentes específicos de profesor
│   └── ui/         # Componentes UI base (shadcn)
├── integrations/   # Integraciones (Supabase client)
└── lib/            # Utilidades y helpers

supabase/
├── functions/      # Edge Functions (backend serverless)
└── migrations/     # Migraciones de base de datos
```

---

## 2. Sistema de Autenticación y Roles

### Roles Disponibles
La aplicación maneja 4 roles principales definidos en el enum `app_role`:
- **admin**: Administrador de la institución
- **profesor**: Docente que crea y gestiona clases
- **alumno**: Estudiante que participa en clases y quizzes
- **apoderado**: Tutor que monitorea el progreso del alumno

### Flujo de Autenticación

1. **Login/Registro** (`/auth`)
   - Usuario ingresa credenciales
   - Supabase Auth valida y crea sesión
   - Se consulta `user_roles` para obtener el rol del usuario
   - Redirección según rol: `/{role}/dashboard`

2. **Protección de Rutas**
   - `AppLayout` verifica sesión activa
   - Si no hay sesión → redirige a `/auth`
   - Si hay sesión → carga rol y muestra sidebar correspondiente

3. **Edge Functions Authentication**
   - Todas las Edge Functions usan `authenticateProfesor()` o similar
   - Verifican token JWT del header `Authorization`
   - Validan que el usuario tenga el rol apropiado

---

## 3. Flujos por Rol

### 3.1. Administrador

**Rutas principales:**
- `/admin/dashboard` - Vista general de la institución
- `/admin/plan-anual` - Gestión del plan anual académico
- `/admin/asignaciones` - Asignar profesores a materias/grupos
- `/admin/configuracion` - Configuración de alertas y calendario

**Funcionalidades clave:**
- Crear y gestionar años escolares
- Configurar períodos académicos (bimestres)
- Crear planes anuales por grado
- Definir materias y temas
- Asignar profesores a grupos y materias
- Configurar alertas del sistema

**Edge Functions:**
- `get-anios-escolares-admin`
- `manage-anio-escolar`
- `manage-periodo-academico`
- `get-plan-anual-admin`
- `get-asignaciones-admin`
- `manage-configuracion-alertas`

---

### 3.2. Profesor (Flujo Principal)

El flujo del profesor es el más complejo y está dividido en varias etapas:

#### Estados del ciclo de clase

Para evitar interpretaciones distintas entre módulos, agrupamos el enum `estado_clase` en tres etapas:

| Etapa | Estados incluidos | Significado |
|-------|------------------|-------------|
| **Guía** | `borrador`, `generando_clase`, `editando_guia`, `guia_aprobada`, `modificando_guia` | Estamos preparando o corrigiendo la guía específica. |
| **Evaluaciones** | `guia_final`, `quiz_pre_generando`, `quiz_pre_enviado`, `analizando_quiz_pre`, `quiz_post_generando`, `quiz_post_enviado`, `analizando_resultados` | La guía ya está lista y estamos creando/enviando quizzes PRE/POST. |
| **Cierre** | `clase_programada`, `preparada`, `en_clase`, `completada`, `ejecutada`, `programada` | La clase ya superó la validación (o está en ejecución) y solo queda seguimiento/cierre. |

> **Definición unificada:** “Generar Clase” implica completar **todo** el flujo (guía + evaluación PRE + evaluación POST + validación). Generar la guía es el segundo paso del flujo, no el final.

#### **A. Planificación Académica**

**Ruta:** `/profesor/planificacion`

**Proceso:**
1. El profesor ve todas sus materias asignadas organizadas por bimestres
2. Cada materia muestra sus temas con estados:
   - `pendiente`: Sin guía maestra
   - `en_progreso`: Con guía maestra y algunas sesiones
   - `completado`: Todas las sesiones completadas

3. **Iniciar Tema** (crear guía maestra):
   - Click en "Iniciar Tema" → abre `IniciarTemaDialog`
   - Profesor ingresa:
     - Total de sesiones estimadas
     - Contexto del grupo
     - Metodologías preferidas
   - Edge Function `iniciar-tema`:
     - Genera guía maestra con IA (objetivos, estructura de sesiones, recursos)
     - Crea registro en `guias_tema`
     - **NO crea sesiones/clases aún**, solo la estructura

**Edge Functions:**
- `get-planificacion-profesor` - Obtiene materias, temas y progreso
- `iniciar-tema` - Genera guía maestra con IA

**Componentes:**
- `Planificacion.tsx` - Página principal
- `TemaCard.tsx` - Tarjeta de tema con acciones
- `IniciarTemaDialog.tsx` - Diálogo para crear guía maestra
- `EditarGuiaTemaDialog.tsx` - Editar guía maestra existente

---

#### **B. Programar Sesiones**

**Rutas:** 
- `/profesor/planificacion/tema/:temaId` - Detalle del tema
- `/profesor/mis-temas` - Lista de temas con guías maestras

**Proceso:**
1. Profesor selecciona un tema que ya tiene guía maestra
2. Click en "Programar Sesión" → abre `ProgramarSesionDialog`
3. Profesor selecciona:
   - Grupo (salón)
   - Número de sesión (de la estructura de la guía maestra)
   - Fecha programada
   - Duración
   - Contexto específico (opcional)

4. Edge Function `programar-sesion`:
   - Valida que existe guía maestra
   - Verifica que no exista ya esa sesión (tema + grupo + número)
   - Crea registro en `clases` con:
     - `estado: 'borrador'`
     - `id_guia_tema` (vinculado a la guía maestra)
     - Contexto preliminar
     - **NO genera guía de clase aún**

**Edge Functions:**
- `get-tema-detalle` - Obtiene tema, guía maestra y sesiones programadas
- `programar-sesion` - Crea sesión en estado borrador
- `get-mis-temas` - Lista temas con guías maestras

**Componentes:**
- `TemaDetalle.tsx` - Vista detallada del tema
- `ProgramarSesionDialog.tsx` - Diálogo para programar sesión
- `SesionCard.tsx` - Tarjeta de sesión con estado

---

#### **C. Generar Guía de Clase**

**Ruta:** `/profesor/generar-clase`

**Flujo Completo:**

**Paso 1: Selección de Sesión**
- Si no hay parámetros → muestra `SeleccionarSesionSection`
- Lista sesiones pendientes (estados: `borrador`, `generando_clase`, `editando_guia`, etc.)
- Profesor selecciona una sesión o crea clase extraordinaria

**Paso 2: Contexto (si viene `?clase=<id>`)**
- **Precarga automática:**
  - Tema y Grupo se cargan desde la sesión programada
  - Campos bloqueados (solo lectura) con badge "Bloqueado"
  - Resto de campos editables: metodologías, edad, contexto específico

- **Al avanzar:**
  - Si es sesión preprogramada → `UPDATE` a `clases` (actualiza contexto, cambia estado a `generando_clase`)
  - Si es clase nueva → `crear-clase` Edge Function (crea nueva clase)

**Paso 3: Generar Guía**
- Edge Function `generar-guia-clase`:
  - Usa la guía maestra del tema como base
  - Genera guía específica con IA usando:
    - Contexto del grupo
    - Metodologías seleccionadas
    - Estructura de la sesión específica
  - Crea versión en `guias_clase_versiones` con `estado: 'borrador'`
  - Actualiza `clases.estado` a `editando_guia`

**Paso 4: Evaluación Pre**
- Edge Function `generar-evaluacion` (tipo: 'pre')
- Crea quiz diagnóstico en `quizzes`

**Paso 5: Evaluación Post**
- Edge Function `generar-evaluacion` (tipo: 'post')
- Crea quiz de evaluación final

**Paso 6: Validar**
- Edge Function `validar-clase`
- Verifica que todo esté completo
- Cambia estado a `guia_aprobada` o `clase_programada`

**Edge Functions:**
- `get-sesiones-pendientes` - Lista sesiones que necesitan guía
- `crear-clase` - Crea clase nueva (solo para extraordinarias)
- `generar-guia-clase` - Genera guía de sesión con IA
- `generar-evaluacion` - Genera quizzes pre/post
- `validar-clase` - Valida y aprueba clase

**Componentes:**
- `GenerarClase.tsx` - Flujo completo de generación
- `SeleccionarSesionSection.tsx` - Selector de sesiones pendientes

---

#### **D. Dashboard y Gestión**

**Ruta:** `/profesor/dashboard`

**Secciones:**

1. **Estadísticas Generales**
   - Clases esta semana
   - Materias asignadas
   - Total estudiantes
   - Promedio general

2. **Clases en Preparación**
   - Sesiones que necesitan atención:
     - Sin guía (`tiene_guia: false`)
     - Guía pendiente (`estado: borrador, generando_clase, editando_guia`)
     - Evaluación pre pendiente
     - Evaluación post pendiente

3. **Calendario de Clases**
   - Clases listas organizadas por:
     - Hoy
     - Mañana
     - Esta semana
     - Próximamente

**Edge Functions:**
- `dashboard-profesor` - Obtiene todas las clases y estadísticas

---

#### **E. Mis Salones**

**Ruta:** `/profesor/mis-salones`

**Vista organizada por salón (grupo):**
- Cada salón muestra:
  - Temas con sesiones
  - Progreso por tema
  - Resultados de alumnos
  - Recomendaciones

**Edge Functions:**
- `get-mis-salones` - Obtiene salones con temas y sesiones

---

#### **F. Post-Clase**

**Rutas:**
- `/profesor/ver-guia/:claseId` - Ver guía generada
- `/profesor/editar-guia/:claseId` - Editar guía antes de aprobar
- `/profesor/gestionar-quizzes/:claseId` - Gestionar quizzes
- `/profesor/recomendaciones-quiz-pre/:claseId` - Ver recomendaciones del quiz pre
- `/profesor/retroalimentaciones/:claseId` - Ver retroalimentaciones de alumnos

**Flujo Post-Clase:**
1. Profesor envía quiz PRE → alumnos responden
2. Edge Function `procesar-respuestas-quiz-pre` analiza resultados
3. Se generan recomendaciones para ajustar la guía
4. Profesor puede modificar guía basado en recomendaciones
5. Aprobar guía → estado `guia_final`
6. Dictar clase → estado `en_clase`
7. Enviar quiz POST → alumnos responden
8. Generar retroalimentaciones individuales

**Edge Functions:**
- `enviar-quiz` - Publica quiz para alumnos
- `procesar-respuestas-quiz-pre` - Analiza respuestas y genera recomendaciones
- `aplicar-recomendaciones-guia` - Aplica recomendaciones a la guía
- `aprobar-guia` - Aprueba guía final
- `generar-retroalimentaciones` - Genera retroalimentaciones con IA

---

### 3.3. Alumno

**Ruta:** `/alumno/dashboard`

**Funcionalidades:**
- Ver clases asignadas
- Responder quizzes (pre y post)
- Ver retroalimentaciones
- Ver progreso personal

---

### 3.4. Apoderado

**Ruta:** `/apoderado/dashboard`

**Funcionalidades:**
- Ver progreso del alumno
- Ver retroalimentaciones
- Ver clases y temas

---

## 4. Estados y Transiciones

### Estados de Clase (Sesión)

```
borrador
  ↓ (al generar contexto)
generando_clase
  ↓ (al generar guía)
editando_guia
  ↓ (al aprobar)
guia_aprobada
  ↓ (al generar quiz pre)
quiz_pre_generando
  ↓ (al enviar)
quiz_pre_enviado
  ↓ (al procesar)
analizando_quiz_pre
  ↓ (al aplicar recomendaciones)
modificando_guia
  ↓ (al aprobar guía final)
guia_final
  ↓ (al programar)
clase_programada
  ↓ (al iniciar clase)
en_clase
  ↓ (al generar quiz post)
quiz_post_generando
  ↓ (al enviar)
quiz_post_enviado
  ↓ (al procesar)
analizando_resultados
  ↓ (al completar)
completada
```

### Estados de Quiz

- `borrador` - En creación
- `publicado` - Disponible para alumnos
- `cerrado` - Ya no acepta respuestas

---

## 5. Estructura de Datos Clave

### Tablas Principales

**`guias_tema`** - Guías maestras por tema
- `id_tema` - Tema asociado
- `id_profesor` - Profesor que creó la guía
- `contenido` - JSONB con objetivos, competencias, recursos
- `estructura_sesiones` - JSONB con estructura de cada sesión
- `total_sesiones` - Número total de sesiones

**`clases`** - Sesiones/clases programadas
- `id_tema` - Tema de la clase
- `id_grupo` - Grupo (salón)
- `id_profesor` - Profesor
- `id_guia_tema` - Guía maestra asociada
- `id_guia_version_actual` - Versión actual de la guía de clase
- `numero_sesion` - Número de sesión (1, 2, 3...)
- `estado` - Estado actual
- `fecha_programada` - Fecha de la clase
- `contexto` - Contexto específico

**`guias_clase_versiones`** - Versiones de guías de clase
- `id_clase` - Clase asociada
- `version_numero` - Número de versión
- `objetivos` - Objetivos de aprendizaje
- `estructura` - Estructura de la clase
- `preguntas_socraticas` - Preguntas para pensamiento crítico
- `estado` - borrador, aprobada, etc.

**`quizzes`** - Evaluaciones
- `id_clase` - Clase asociada
- `tipo` - 'previo' o 'post'
- `estado` - borrador, publicado, cerrado

**`asignaciones_profesor`** - Asignaciones de profesores
- `id_profesor` - Profesor
- `id_materia` - Materia
- `id_grupo` - Grupo
- `anio_escolar` - Año escolar

---

## 6. Edge Functions Principales

### Autenticación
- `_shared/auth.ts` - Helpers de autenticación

### Profesor - Planificación
- `get-planificacion-profesor` - Obtiene materias y temas con progreso
- `iniciar-tema` - Genera guía maestra con IA
- `actualizar-guia-tema` - Actualiza guía maestra
- `get-tema-detalle` - Detalle completo de un tema
- `get-temas-planificacion` - Lista todos los temas

### Profesor - Sesiones
- `programar-sesion` - Crea sesión en estado borrador
- `get-sesiones-pendientes` - Lista sesiones que necesitan guía
- `get-mis-salones` - Obtiene salones con temas y sesiones

### Profesor - Generación de Clases
- `crear-clase` - Crea clase nueva (solo extraordinarias)
- `generar-guia-clase` - Genera guía de sesión con IA
- `generar-evaluacion` - Genera quizzes pre/post
- `validar-clase` - Valida y aprueba clase

### Profesor - Post-Clase
- `enviar-quiz` - Publica quiz
- `procesar-respuestas-quiz-pre` - Analiza respuestas y genera recomendaciones
- `aplicar-recomendaciones-guia` - Aplica recomendaciones
- `aprobar-guia` - Aprueba guía final
- `generar-retroalimentaciones` - Genera retroalimentaciones

### Profesor - Dashboard y Métricas
- `dashboard-profesor` - Dashboard completo
- `get-metricas-profesor` - Métricas del profesor
- `get-perfil-profesor` - Perfil del profesor

### Admin
- `get-anios-escolares-admin` - Gestiona años escolares
- `manage-anio-escolar` - CRUD de años escolares
- `manage-periodo-academico` - CRUD de períodos
- `get-plan-anual-admin` - Obtiene plan anual
- `get-asignaciones-admin` - Gestiona asignaciones
- `get-configuracion-alertas` - Configuración de alertas
- `manage-configuracion-alertas` - CRUD de configuración

---

## 7. Flujo Completo del Profesor (Resumen)

```
1. PLANIFICACIÓN
   └─> Ver materias y temas asignados
       └─> Iniciar Tema (crear guía maestra)
           └─> Genera estructura de sesiones (NO crea clases aún)

2. PROGRAMAR SESIONES
   └─> Seleccionar tema con guía maestra
       └─> Programar Sesión
           └─> Crea clase en estado 'borrador' (solo contexto)

3. GENERAR GUÍA DE CLASE
   └─> Dashboard → "En preparación" o "Generar Clase"
       └─> Seleccionar sesión programada
           └─> Paso 1: Contexto (Tema/Grupo bloqueados)
           └─> Paso 2: Generar Guía (con IA)
           └─> Paso 3: Evaluación Pre
           └─> Paso 4: Evaluación Post
           └─> Paso 5: Validar

4. PRE-CLASE
   └─> Enviar Quiz PRE
       └─> Alumnos responden
       └─> Procesar respuestas
       └─> Ver recomendaciones
       └─> Ajustar guía si es necesario
       └─> Aprobar guía final

5. DICTAR CLASE
   └─> Estado: 'en_clase'

6. POST-CLASE
   └─> Enviar Quiz POST
       └─> Alumnos responden
       └─> Generar retroalimentaciones
       └─> Estado: 'completada'
```

---

## 8. Puntos Clave del Diseño

### Separación de Responsabilidades

1. **Guía Maestra (`guias_tema`)**
   - Se crea UNA VEZ por tema
   - Define estructura general y sesiones
   - NO genera guías de clase individuales

2. **Sesiones (`clases`)**
   - Se crean al PROGRAMAR (estado `borrador`)
   - Vinculadas a guía maestra (`id_guia_tema`)
   - Cada sesión puede tener múltiples versiones de guía

3. **Guías de Clase (`guias_clase_versiones`)**
   - Se generan al crear la guía específica de la sesión
   - Basadas en la guía maestra pero personalizadas
   - Versiones permiten iteración y mejoras

### Estados y Validaciones

- Los estados son secuenciales y controlan qué acciones están disponibles
- Las validaciones aseguran que no se avance sin completar pasos previos
- Los quizzes solo se pueden enviar cuando la clase está en el estado correcto

### IA y Personalización

- La IA se usa para:
  - Generar guías maestras (estructura general)
  - Generar guías de clase (personalizadas por sesión)
  - Generar quizzes (pre y post)
  - Analizar respuestas y generar recomendaciones
  - Generar retroalimentaciones personalizadas

---

## 9. Consideraciones de Seguridad

- **RLS (Row Level Security)**: Todas las tablas tienen políticas RLS
- **Autenticación en Edge Functions**: Todas verifican token JWT
- **Validación de Propiedad**: Los profesores solo pueden gestionar sus propias clases
- **Validación de Roles**: Las funciones verifican que el usuario tenga el rol apropiado

---

## 10. Mejoras Recientes Implementadas

### Corrección del Flujo de Generación de Clases

**Problema anterior:**
- Al iniciar tema se creaban sesiones automáticamente
- No había separación clara entre guía maestra y guías de sesión
- Tema y Grupo no se bloqueaban al generar clase desde sesión programada

**Solución implementada:**
1. `iniciar-tema` solo crea guía maestra (NO sesiones)
2. `programar-sesion` crea sesión en estado `borrador` (solo contexto)
3. `get-sesiones-pendientes` incluye estado `borrador` para mostrar sesiones recién programadas
4. `GenerarClase` precarga y bloquea Tema/Grupo cuando viene `?clase=<id>`
5. Actualiza sesión existente en lugar de crear nueva cuando es sesión preprogramada

---

Este documento proporciona una visión completa de la lógica y flujos de la aplicación EduThink.



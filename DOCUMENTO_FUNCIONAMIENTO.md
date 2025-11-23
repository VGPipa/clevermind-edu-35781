# Documento de Funcionamiento de la Aplicación EduThink

## 1. Propósito y Alcance
EduThink es una plataforma para instituciones escolares que automatiza la planificación, creación y seguimiento de clases con apoyo de IA. El sistema conecta a cuatro actores —administradores, profesores, alumnos y apoderados— para coordinar currículas, generar guías de sesión, aplicar evaluaciones diagnósticas/post y distribuir retroalimentaciones personalizadas.

Este documento explica cómo opera la aplicación de extremo a extremo: arquitectura, módulos principales, flujo por rol, manejo de datos y mecanismos de seguridad.

---

## 2. Propuesta de Valor
- **Planificación centralizada:** el administrador define años escolares, planes anuales y asignaciones.
- **Productividad docente:** los profesores generan guías y evaluaciones asistidos por IA y ven recomendaciones basadas en resultados reales.
- **Seguimiento del aprendizaje:** alumnos y apoderados acceden a quizzes, retroalimentaciones y progreso.
- **Trazabilidad completa:** cada sesión de clase recorre estados definidos, lo que facilita auditoría y alertas tempranas.

---

## 3. Arquitectura General
- **Frontend:** React + TypeScript + Vite. UI basada en Tailwind CSS y componentes shadcn/ui. Estado remoto gestionado con TanStack Query.
- **Routing:** React Router v6. `src/App.tsx` define rutas públicas (`/auth`) y privadas segmentadas por rol (`/admin/*`, `/profesor/*`, `/alumno/*`, `/apoderado/*`).
- **Backend:** Supabase actúa como BaaS (PostgreSQL + Storage + Auth). La lógica se encapsula en Edge Functions Deno (`supabase/functions/*`).
- **Autenticación:** Supabase Auth emite JWT; el frontend lo guarda en sesión y cada Edge Function valida el rol mediante helpers en `_shared/auth.ts`.
- **Infraestructura de datos:** migraciones versionadas en `supabase/migrations/`. La definición exhaustiva de entidades reside en `DICCIONARIO_DATOS.md`.

---

## 4. Componentes del Frontend
- `src/pages/admin/*`: dashboards administrativos, plan anual, asignaciones y configuración.
- `src/pages/profesor/*`: dashboards operativos, planificación, generación de clases, gestión de quizzes, métricas, capacitación y detalle de temas/salones.
- `src/pages/alumno/Dashboard.tsx` y `src/pages/apoderado/Dashboard.tsx`: vistas simplificadas para seguimiento.
- `src/components/`: UI reutilizable segmentada por dominio (`admin`, `profesor`, `layout`, `ui`). Los diálogos y tablas específicos encapsulan interacción compleja (p. ej. `IniciarTemaDialog`, `ProgramarSesionDialog`, `AsignacionesTable`).
- `src/integrations/supabase/client.ts`: inicializa el cliente Supabase con credenciales de entorno.
- `src/lib/*`: helpers de validación (`asignacionValidations`), utilitarios de fechas y mapeos de estados (`classStateStages.ts`).

---

## 5. Autenticación y Autorización
1. **Ingreso:** los usuarios acceden vía `/auth`. Al autenticarse, se consulta `user_roles` para determinar el rol principal.
2. **Protección de rutas:** `AppLayout` verifica la sesión activa y redirige a `/auth` si expira. El sidebar y las acciones se ajustan según el rol.
3. **Edge Functions:** toda función inicia con `authenticateProfesor`/`authenticateAdmin`. Se valida el token JWT, se recupera el perfil y se comprueba que pertenezca al rol solicitado y a la institución correcta.
4. **RLS:** Row Level Security en Supabase asegura que cada usuario solo pueda consultar/editar registros permitidos (clases del propio profesor, alumnos asignados, etc.).

---

## 6. Flujos por Rol

### 6.1 Administrador
- **Rutas clave:** `/admin/dashboard`, `/admin/plan-anual`, `/admin/asignaciones`, `/admin/configuracion`.
- **Responsabilidades:**
  - Crear años escolares y períodos académicos (`manage-anio-escolar`, `manage-periodo-academico`).
  - Construir planes anuales por grado y materias (`get-plan-anual-admin`).
  - Asignar profesores a materias y grupos (`get-asignaciones-admin`).
  - Configurar políticas de alertas y calendarios (`get-configuracion-alertas`, `manage-configuracion-alertas`).
- **Indicadores:** el dashboard muestra estado de planes, asignaciones pendientes y alertas configuradas.

### 6.2 Profesor
El flujo docente está segmentado en etapas que garantizan consistencia entre planeamiento, ejecución y seguimiento:

1. **Planificación Académica (`/profesor/planificacion`):**
   - TanStack Query consume `get-planificacion-profesor` para listar materias por bimestre con progreso y estado de cada tema (pendiente, en progreso, completado).
   - Acción principal: **Iniciar tema**, que llama a `iniciar-tema`. La IA genera una guía maestra (`guias_tema`) con estructura de sesiones, objetivos, recursos y metodologías.

2. **Programación de Sesiones (`/profesor/planificacion/tema/:id` y `/profesor/mis-temas`):**
   - `ProgramarSesionDialog` crea registros en `clases` con estado `borrador` mediante la Edge Function `programar-sesion`. No se genera guía aún; solo se define el contexto (grupo, fecha, duración, número de sesión).

3. **Generación de Clase (`/profesor/generar-clase`):**
   - Paso 1: seleccionar una sesión pendiente (`get-sesiones-pendientes`). El sistema bloquea Tema/Grupo si provienen de una sesión ya programada.
   - Paso 2: completar o ajustar contexto (metodologías, consideraciones del grupo). Se actualiza la clase o se crea una extraordinaria (`crear-clase`).
   - Paso 3: solicitar guía personalizada (`generar-guia-clase`). Se crea una versión en `guias_clase_versiones` y el estado pasa a `editando_guia`.
   - Paso 4-5: generar quizzes previo y posterior (`generar-evaluacion` con tipo `previo` y `post`). Los quizzes pasan a `borrador` listos para revisión.
   - Paso 6: validar el conjunto (`validar-clase`). La clase queda en `guia_aprobada` o `clase_programada` según completitud.

4. **Ejecución y Seguimiento:**
   - **Dashboard (`/profesor/dashboard`):** Edge Function `dashboard-profesor` consolida métricas, clases en preparación y calendario diario/semanal.
   - **Mis Salones (`/profesor/mis-salones`):** `get-mis-salones` agrupa información por grupo con progreso y resultados.
   - **Gestión de Quizzes:** `enviar-quiz` publica el quiz PRE/POST para alumnos; `procesar-respuestas-quiz-pre` analiza diagnósticos y sugiere ajustes; `aplicar-recomendaciones-guia` incorpora cambios en la guía.
   - **Cierre:** tras el quiz post, `generar-retroalimentaciones` produce feedback individual y grupal. La clase termina en `completada`.

5. **Capacitación y soporte:** páginas adicionales (`/profesor/metricas`, `/profesor/capacitacion`, `/profesor/capacitacion/nodo/:id`) presentan nodos de aprendizaje y evaluaciones internas.

### 6.3 Alumno
- **Ruta:** `/alumno/dashboard`.
- **Funcionalidad:** ver clases asignadas, responder quizzes publicados (previo o post) y leer retroalimentaciones personalizadas. Los estados del quiz (`borrador`, `publicado`, `cerrado`) regulan la disponibilidad.

### 6.4 Apoderado
- **Ruta:** `/apoderado/dashboard`.
- **Funcionalidad:** monitorear el progreso del alumno, revisar retroalimentaciones y notas por clase, y anticipar sesiones futuras.

---

## 7. Ciclo de Vida de una Clase
1. `borrador` → sesión programada sin guía.
2. `generando_clase` → recopilación de contexto y llamada a `generar-guia-clase`.
3. `editando_guia` → profesor revisa/ajusta la versión creada.
4. `guia_aprobada` → se habilita generación de evaluaciones.
5. `quiz_pre_generando` → creación del diagnóstico; luego `quiz_pre_enviado`.
6. `analizando_quiz_pre` → IA genera recomendaciones; estado puede pasar a `modificando_guia`.
7. `guia_final` / `clase_programada` → lista para impartir.
8. `en_clase` → sesión en ejecución.
9. `quiz_post_generando` / `quiz_post_enviado` → evaluación final.
10. `analizando_resultados` → cálculo de métricas y retroalimentaciones.
11. `completada` → clase cerrada con historial y métricas persistidas.

Los helpers en `src/lib/classStateStages.ts` agrupan estados en etapas (Guía, Evaluaciones, Cierre) para simplificar filtros en el frontend y en las funciones Edge.

---

## 8. Uso de IA
- **Guías maestras (`iniciar-tema`):** genera objetivos, estructura y recursos basados en contexto del grupo.
- **Guías de sesión (`generar-guia-clase`):** personaliza actividades, tiempos y preguntas detonantes.
- **Evaluaciones (`generar-evaluacion`):** crea quizzes PRE y POST con diferentes tipos de preguntas y explica respuestas correctas.
- **Recomendaciones y ajustes (`procesar-respuestas-quiz-pre`, `aplicar-recomendaciones-guia`):** analiza desempeño diagnóstico y sugiere cambios concretos.
- **Retroalimentaciones (`generar-retroalimentaciones`):** produce mensajes individuales y colectivos después del quiz post.

Cada llamada persiste la salida en tablas específicas (`guias_tema`, `guias_clase_versiones`, `quizzes`, `recomendaciones`, `retroalimentaciones`) para trazabilidad y versionado.

---

## 9. Modelo de Datos Esencial
> Referencia completa: `DICCIONARIO_DATOS.md`.

- **`plan_anual` / `materias` / `temas`:** definen la currícula anual por grado.
- **`guias_tema`:** guía maestra por tema (estructura general y total de sesiones).
- **`clases`:** sesiones programadas vinculadas a tema, grupo y profesor. Registra estado, fecha y contexto.
- **`guias_clase_versiones`:** versiones iterativas de una guía de sesión; permite cambios sin perder historial.
- **`quizzes`, `preguntas`, `respuestas_alumno`:** evaluaciones diagnósticas y finales con detalle de respuestas y calificaciones.
- **`metricas_clase`, `resultados_clase`, `recomendaciones`:** resumen estadístico y acciones sugeridas.
- **`asignaciones_profesor`:** relaciona docentes, materias y grupos por año.
- **`configuracion_alertas` y `periodos_academicos`:** parametrizan la visualización y reglas de urgencia en dashboards.

---

## 10. Edge Functions Destacadas
| Categoría | Funciones |
|-----------|-----------|
| Autenticación y utilitarios | `_shared/auth.ts`, `_shared/classStateStages.ts` |
| Planificación profesor | `get-planificacion-profesor`, `iniciar-tema`, `actualizar-guia-tema`, `get-mis-temas`, `get-tema-detalle` |
| Sesiones y clases | `programar-sesion`, `get-sesiones-pendientes`, `crear-clase`, `get-mis-salones` |
| Generación asistida | `generar-guia-clase`, `generar-evaluacion`, `validar-clase`, `generar-retroalimentaciones` |
| Evaluaciones | `enviar-quiz`, `procesar-respuestas-quiz-pre`, `aplicar-recomendaciones-guia`, `aprobar-guia` |
| Dashboards | `dashboard-profesor`, `get-metricas-profesor`, `get-perfil-profesor` |
| Administración | `get-anios-escolares-admin`, `manage-anio-escolar`, `manage-periodo-academico`, `get-plan-anual-admin`, `get-asignaciones-admin`, `get-configuracion-alertas`, `manage-configuracion-alertas` |

Cada función:
- Maneja CORS y preflight.
- Valida rol/autorización.
- Ejecuta consultas PostgREST o SQL directo.
- Devuelve respuestas estándar usando `createSuccessResponse` / `createErrorResponse`.

---

## 11. Seguridad y Buenas Prácticas
- **RLS activa:** evita accesos cruzados entre instituciones y roles.
- **Validación de propiedad:** Edge Functions verifican que los IDs solicitados pertenezcan al usuario autenticado (p. ej. un profesor no puede editar una clase de otro).
- **Versionamiento:** el modelo de `guias_clase_versiones` y registros de quizzes garantizan que nunca se pierda historial.
- **Alertas configurables:** la tabla `configuracion_alertas` define umbrales (días) para etiquetar clases como urgentes, próximas, programadas o lejanas, lo que impacta en las tarjetas del dashboard.

---

## 12. Operación Diaria Resumida
1. **Administrador** prepara la currícula anual, registra grupos y asigna profesores.
2. **Profesor** inicia temas pendientes y programa sesiones.
3. Para cada sesión, el profesor:
   - Completa contexto.
   - Genera guía y quizzes con IA.
   - Valida y envía el quiz previo.
   - Ajusta la guía según diagnósticos.
   - Dicta la clase y aplica el quiz post.
   - Revisa métricas y comparte retroalimentaciones.
4. **Alumnos** responden quizzes y reciben feedback.
5. **Apoderados** consultan resultados y progreso.
6. El ciclo reinicia para la siguiente sesión/tema, manteniendo trazabilidad completa.

---

## 13. Ejecución Local y Deploy
- Requisitos: Node.js 18+, npm o bun.
- Pasos estándar:
  ```bash
  npm install
  npm run dev
  ```
- Variables relevantes: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (en `.env` o configuración de entorno).
- Deploy: se gestiona desde Lovable (`Share -> Publish`) y puede asociarse a un dominio personalizado.

---

## 14. Referencias Rápidas
- **Flujo detallado:** `FLUJO_APLICACION.md`.
- **Diccionario de datos:** `DICCIONARIO_DATOS.md`.
- **Scripts auxiliares:** `scripts/crear-clase-sintetica.*` para cargar datos sintéticos.
- **Métricas y configuraciones recientes:** revisar migraciones en `supabase/migrations`.

---

Este documento debe servir como guía para onboarding técnico y funcional. Ante cambios sustanciales en flujos o datos, actualizarlo junto con los archivos de referencia mencionados.


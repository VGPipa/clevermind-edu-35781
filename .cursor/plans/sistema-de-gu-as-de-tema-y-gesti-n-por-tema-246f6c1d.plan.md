<!-- 246f6c1d-a596-40f0-a65e-a7850b4f1d78 914057e0-bda9-4cce-94fc-06ff758e233a -->
# Reestructuración de navegación: Mis Salones y Temas en Planificación

## Objetivo

Reorganizar la navegación del profesor para separar claramente:

- **Planificación → Temas**: Crear/iniciar temas y gestionar guías maestras
- **Mis Salones**: Gestionar sesiones programadas y ejecutadas por salón
- **Generar Clase**: Modificar para seleccionar sesiones precreadas o crear clase extraordinaria

## Cambios en Sidebar

### 1. Agregar "Mis Salones" al sidebar

- **Archivo**: `src/components/layout/AppSidebar.tsx`
- Agregar nuevo item "Mis Salones" con icono apropiado (ej: `Users` o `School`)
- URL: `/profesor/mis-salones`
- Mantener "Generar Clase" pero cambiar comportamiento

## Nueva página: Mis Salones

### 2. Crear página principal Mis Salones

- **Archivo**: `src/pages/profesor/MisSalones.tsx`
- Estructura con tabs internos (si es necesario) o vista única
- Organización: **Primero por Salón, luego por Tema**
- Solo mostrar temas que tienen guía maestra Y sesiones creadas
- Mostrar sesiones programadas y ejecutadas por salón

### 3. Edge Function: get-mis-salones

- **Archivo**: `supabase/functions/get-mis-salones/index.ts`
- Obtener asignaciones del profesor
- Para cada salón (grupo):
- Obtener temas con guía maestra (`guias_tema`)
- Obtener sesiones (clases) programadas y ejecutadas
- Filtrar: solo temas que tienen al menos una sesión creada
- Calcular progreso por tema y salón
- Retornar estructura: `{ salones: [{ grupo, temas: [{ tema, sesiones, progreso }] }] }`

### 4. Componente: SalónCard

- **Archivo**: `src/components/profesor/SalonCard.tsx`
- Muestra información del salón (nombre, grado, sección, cantidad alumnos)
- Lista de temas con sesiones
- Progreso general del salón
- Acciones: ver sesiones, programar nueva sesión

### 5. Componente: SesionCard

- **Archivo**: `src/components/profesor/SesionCard.tsx`
- Muestra información de sesión (número, fecha, estado, tema)
- Acciones: ver detalles, editar, gestionar quizzes, ver retroalimentaciones
- Badges de estado y alertas de proximidad

## Subsección Temas en Planificación

### 6. Modificar página Planificación

- **Archivo**: `src/pages/profesor/Planificacion.tsx`
- Agregar tabs o sección "Temas" dentro de la página
- Vista de lista de todos los temas con:
- Filtros: por materia, bimestre, estado
- Estatus: tiene guía maestra, tiene sesiones, pendiente
- Acciones: Iniciar Tema, Ver/Editar Guía, Ver Sesiones

### 7. Edge Function: get-temas-planificacion

- **Archivo**: `supabase/functions/get-temas-planificacion/index.ts`
- Obtener todos los temas del profesor (de asignaciones)
- Para cada tema:
- Verificar si tiene guía maestra (`guias_tema`)
- Contar sesiones creadas (`clases` con `id_guia_tema`)
- Determinar estatus: `sin_guia`, `con_guia_sin_sesiones`, `con_sesiones`
- Retornar lista con información completa y estatus

### 8. Componente: TemaListCard

- **Archivo**: `src/components/profesor/TemaListCard.tsx`
- Muestra tema con estatus visual (badges)
- Botones según estatus:
- Sin guía: "Iniciar Tema"
- Con guía sin sesiones: "Ver Guía", "Programar Primera Sesión"
- Con sesiones: "Ver Guía", "Gestionar Sesiones", "Ver en Mis Salones"

### 9. Nueva página: Detalle de Tema

- **Archivo**: `src/pages/profesor/TemaDetalle.tsx`
- Ruta: `/profesor/planificacion/tema/:temaId`
- Muestra:
- Información del tema
- Guía maestra completa (objetivos, estructura de sesiones, recursos)
- Lista de sesiones programadas (con salón)
- Progreso general
- Acciones:
- Editar Guía Maestra (abre `EditarGuiaTemaDialog`)
- Programar Nueva Sesión (requiere seleccionar salón)
- Ver sesión específica

### 10. Edge Function: get-tema-detalle

- **Archivo**: `supabase/functions/get-tema-detalle/index.ts`
- Obtener tema completo con guía maestra
- Obtener todas las sesiones (clases) asociadas al tema
- Agrupar por salón
- Calcular estadísticas de progreso

## Modificar Generar Clase

### 11. Modificar GenerarClase

- **Archivo**: `src/pages/profesor/GenerarClase.tsx`
- Al entrar, mostrar diálogo de selección:
- Opción 1: "Seleccionar Sesión Precreada"
- Lista de sesiones pendientes (de temas con guía maestra)
- Filtrar por tema y salón
- Preseleccionar siguiente sesión disponible
- Opción 2: "Clase Extraordinaria"
- Formulario completo para crear clase sin tema asociado
- Similar al flujo actual pero sin tema

### 12. Edge Function: get-sesiones-pendientes

- **Archivo**: `supabase/functions/get-sesiones-pendientes/index.ts`
- Obtener sesiones (clases) del profesor que:
- Tienen `id_guia_tema` (son de temas con guía)
- Estado: `guia_aprobada`, `guia_final`, o similar (pendientes de ejecutar)
- Incluir información de tema, salón, número de sesión
- Ordenar por fecha programada y número de sesión

### 13. Componente: SeleccionarSesionDialog

- **Archivo**: `src/components/profesor/SeleccionarSesionDialog.tsx`
- Diálogo con:
- Filtros: tema, salón
- Lista de sesiones pendientes
- Preselección de siguiente sesión
- Botón "Clase Extraordinaria"
- Al seleccionar sesión, redirigir al flujo de generación con `claseId`

## Rutas y navegación

### 14. Actualizar App.tsx

- **Archivo**: `src/App.tsx`
- Agregar ruta: `/profesor/mis-salones` → `MisSalones`
- Agregar ruta: `/profesor/planificacion/tema/:temaId` → `TemaDetalle`
- Mantener ruta `/profesor/mis-temas` (puede redirigir o mantenerse)

### 15. Actualizar navegación en componentes

- **Archivo**: `src/components/profesor/TemaCard.tsx`
- Cambiar "Programar Sesión" → "Ver Tema" o "Gestionar Tema"
- Navegar a `/profesor/planificacion/tema/:temaId`
- **Archivo**: `src/pages/profesor/Planificacion.tsx`
- Actualizar `handleProgramarClase` para navegar a detalle de tema

## Componentes compartidos

### 16. Componente: ProgramarSesionDialog (mejorado)

- **Archivo**: `src/components/profesor/ProgramarSesionDialog.tsx`
- Requiere seleccionar salón primero
- Lista de sesiones pendientes de la guía maestra
- Preselección de siguiente sesión
- Campos: número de sesión, fecha, duración, contexto específico

### 17. Actualizar EditarGuiaTemaDialog

- **Archivo**: `src/components/profesor/EditarGuiaTemaDialog.tsx`
- Asegurar que funciona desde múltiples contextos
- Botón "Ir a Mis Salones" puede cambiar según contexto

## Consideraciones técnicas

### 18. Validaciones

- En `programar-sesion`: validar que tema tenga guía maestra
- En `get-mis-salones`: filtrar solo temas con sesiones creadas
- En `get-temas-planificacion`: incluir todos los temas (con o sin guía)

### 19. Estados y badges

- Estados de tema: `sin_guia`, `con_guia_sin_sesiones`, `con_sesiones`, `en_progreso`, `completado`
- Estados de sesión: usar estados existentes de `clases`
- Badges visuales para cada estado

### 20. Performance

- Usar React Query para cachear datos
- Lazy loading de sesiones por salón
- Paginación si hay muchos temas/sesiones

## To-Dos de Implementación

### Fase 1: Edge Functions Backend

1. **Crear `get-temas-planificacion` Edge Function**

- Obtener todos los temas del profesor desde asignaciones
- Verificar existencia de guía maestra para cada tema
- Contar sesiones creadas por tema
- Determinar estatus: `sin_guia`, `con_guia_sin_sesiones`, `con_sesiones`
- Retornar lista completa con información de materia, bimestre y estatus

2. **Crear `get-tema-detalle` Edge Function**

- Obtener tema completo con relaciones (materia, bimestre)
- Obtener guía maestra asociada
- Obtener todas las sesiones (clases) del tema agrupadas por salón
- Calcular estadísticas de progreso (sesiones completadas, programadas, pendientes)
- Retornar estructura completa para vista de detalle

3. **Crear `get-mis-salones` Edge Function**

- Obtener asignaciones del profesor
- Agrupar por salón (grupo)
- Para cada salón: obtener temas con guía maestra que tienen al menos una sesión creada
- Obtener sesiones programadas y ejecutadas por tema y salón
- Calcular progreso por tema y salón
- Retornar estructura: `{ salones: [{ grupo, temas: [{ tema, sesiones, progreso }] }] }`

4. **Crear `get-sesiones-pendientes` Edge Function**

- Obtener sesiones (clases) del profesor con `id_guia_tema`
- Filtrar por estados pendientes: `guia_aprobada`, `guia_final`, `editando_guia`
- Incluir información de tema, salón, número de sesión, fecha programada
- Ordenar por fecha programada y número de sesión
- Retornar lista para diálogo de selección

### Fase 2: Componentes Base

5. **Crear componente `TemaListCard`**

- Mostrar información del tema (nombre, descripción, materia, bimestre)
- Badges de estatus visual (sin guía, con guía, con sesiones)
- Botones contextuales según estatus:
- Sin guía: "Iniciar Tema"
- Con guía sin sesiones: "Ver Guía", "Programar Primera Sesión"
- Con sesiones: "Ver Guía", "Gestionar Sesiones", "Ver en Mis Salones"
- Navegación a detalle de tema

6. **Crear componente `SalonCard`**

- Mostrar información del salón (nombre, grado, sección, cantidad alumnos)
- Lista de temas con sesiones asociadas
- Progreso general del salón (barra de progreso)
- Acciones: ver todas las sesiones, programar nueva sesión
- Expandible para mostrar detalles de temas

7. **Crear componente `SesionCard`**

- Mostrar información de sesión (número, tema, fecha programada/ejecutada, estado)
- Badges de estado y alertas de proximidad (usar `AlertaBadge`)
- Acciones: ver detalles, editar, gestionar quizzes, ver retroalimentaciones
- Navegación a páginas de gestión según estado

8. **Crear componente `ProgramarSesionDialog` (mejorado)**

- Selector de salón (requerido)
- Lista de sesiones pendientes de la guía maestra del tema
- Preselección automática de siguiente sesión disponible
- Campos: número de sesión (readonly si viene de lista), fecha, duración, contexto específico
- Validación de campos requeridos
- Integración con `programar-sesion` Edge Function

9. **Crear componente `SeleccionarSesionDialog`**

- Diálogo modal para seleccionar sesión precreada o crear clase extraordinaria
- Filtros: tema, salón
- Lista de sesiones pendientes con información relevante
- Preselección de siguiente sesión disponible
- Botón "Clase Extraordinaria" que abre formulario completo
- Navegación a `GenerarClase` con parámetros apropiados

### Fase 3: Páginas Principales

10. **Crear página `TemaDetalle`**

- Ruta: `/profesor/planificacion/tema/:temaId`
- Sección de información del tema (nombre, descripción, materia, bimestre, duración)
- Sección de guía maestra (objetivos, estructura de sesiones, recursos, metodologías)
- Sección de sesiones programadas agrupadas por salón
- Progreso general del tema
- Acciones: Editar Guía Maestra, Programar Nueva Sesión, Ver en Mis Salones
- Breadcrumbs para navegación

11. **Modificar página `Planificacion.tsx`**

- Agregar tabs o sección "Temas" dentro de la página
- Vista de lista de todos los temas usando `TemaListCard`
- Filtros: por materia, bimestre, estatus (sin guía, con guía, con sesiones)
- Búsqueda por nombre de tema
- Estadísticas generales (total temas, temas con guía, temas con sesiones)
- Navegación a detalle de tema al hacer clic

12. **Crear página `MisSalones`**

- Ruta: `/profesor/mis-salones`
- Organización: primero por salón, luego por tema
- Usar `SalonCard` para cada salón
- Solo mostrar temas que tienen guía maestra Y al menos una sesión creada
- Mostrar sesiones programadas y ejecutadas
- Filtros opcionales: por salón, por materia
- Vista de lista o grid según preferencia

13. **Modificar página `GenerarClase.tsx`**

- Al entrar sin parámetros, mostrar `SeleccionarSesionDialog`
- Si viene con `claseId`, continuar flujo normal
- Si viene con `temaId`, verificar si tiene guía y sesiones, sino redirigir a Temas
- Agregar opción "Clase Extraordinaria" que permite crear clase sin tema
- Mantener flujo actual para clases extraordinarias

### Fase 4: Navegación y Sidebar

14. **Actualizar `AppSidebar.tsx`**

- Agregar item "Mis Salones" con icono apropiado (ej: `School` o `Users`)
- URL: `/profesor/mis-salones`
- Mantener "Generar Clase" en su posición actual
- Asegurar que "Planificación" sigue visible

15. **Actualizar `App.tsx` con nuevas rutas**

- Agregar ruta: `/profesor/mis-salones` → `MisSalones`
- Agregar ruta: `/profesor/planificacion/tema/:temaId` → `TemaDetalle`
- Verificar que todas las rutas existentes siguen funcionando

16. **Actualizar navegación en componentes existentes**

- `TemaCard.tsx`: Cambiar "Programar Sesión" → "Ver Tema" o "Gestionar Tema"
- `TemaCard.tsx`: Navegar a `/profesor/planificacion/tema/:temaId` en lugar de generar-clase
- `Planificacion.tsx`: Actualizar `handleProgramarClase` para navegar a detalle de tema
- `EditarGuiaTemaDialog.tsx`: Ajustar botones de navegación según contexto

### Fase 5: Integración y Ajustes

17. **Actualizar `EditarGuiaTemaDialog`**

- Asegurar que funciona desde múltiples contextos (Planificación, TemaDetalle)
- Botón "Ir a Mis Salones" solo si hay sesiones creadas
- Botón "Ver en Planificación" para volver a lista de temas

18. **Agregar validaciones y manejo de errores**

- Validar en `programar-sesion` que tema tenga guía maestra
- Validar en `get-mis-salones` que solo incluya temas con sesiones
- Manejar casos edge: tema sin guía, guía sin sesiones, salón sin asignación
- Mensajes de error claros y acciones sugeridas

19. **Agregar estados y badges visuales**

- Estados de tema: `sin_guia`, `con_guia_sin_sesiones`, `con_sesiones`, `en_progreso`, `completado`
- Badges con colores distintivos para cada estado
- Integrar `AlertaBadge` en `SesionCard` para proximidad
- Indicadores de progreso consistentes

20. **Optimización y testing**

- Usar React Query para cachear datos de Edge Functions
- Implementar loading states en todas las páginas
- Verificar que la navegación funciona correctamente entre secciones
- Probar flujos completos: crear tema → programar sesión → gestionar en Mis Salones
- Verificar que filtros y búsquedas funcionan correctamente

### To-dos

- [x] Restaurar Edge Functions: get-mis-salones, get-tema-detalle, get-temas-planificacion, get-sesiones-pendientes
- [x] Restaurar componentes: SalonCard, SesionCard, TemaListCard, ProgramarSesionDialog, SeleccionarSesionDialog
- [ ] Restaurar páginas: MisSalones.tsx, TemaDetalle.tsx
- [ ] Actualizar Planificacion.tsx con sección Temas y tabs
- [ ] Actualizar App.tsx con rutas de mis-salones y tema-detalle
- [ ] Actualizar AppSidebar.tsx con Mis Salones
- [ ] Actualizar GenerarClase.tsx con SeleccionarSesionDialog
- [ ] Actualizar config.toml con las nuevas Edge Functions
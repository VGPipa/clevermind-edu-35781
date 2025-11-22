# Análisis: Comparación entre Diagrama Esperado y Flujo Actual

## Diferencias Identificadas

### 1. ❌ **Generación de Guías de Clase - Sesiones Próximas vs Sesión Próxima**

**Diagrama esperado:**
- Paso 1: "Genera la guía de clase de las sesiones próximas"
- Paso 2: "Genera la guía de clase de la sesión próxima"

**Flujo actual:**
- Solo se genera la guía de clase para UNA sesión específica a la vez
- No hay distinción entre "generar para sesiones próximas" y "generar para sesión próxima"
- El profesor selecciona una sesión y genera su guía individualmente

**Pregunta:** ¿Quieres que el profesor pueda generar guías para múltiples sesiones próximas de una vez, o solo para la próxima sesión?

---

### 2. ⚠️ **Orden de Generación de Quizzes**

**Diagrama esperado:**
1. Genera quiz previo
2. Genera quiz post
3. Envía quiz previo
4. Da la clase
5. Envía quiz post

**Flujo actual:**
- En el flujo de "Generar Clase" (pasos 3 y 4), se generan ambos quizzes ANTES de enviar el quiz previo
- Esto está alineado con el diagrama ✅

**Observación:** El orden parece correcto, pero necesito confirmar si quieres que se generen ambos quizzes al mismo tiempo o si el quiz post debe generarse después de enviar el quiz previo.

---

### 3. ❌ **Generación de Guía del Tema - Nivel de Detalle**

**Diagrama esperado:**
- Nota: "Genera nombre preliminar y contexto para cada clase, pero NO la guía completa"

**Flujo actual:**
- `iniciar-tema` genera una guía maestra COMPLETA con:
  - Objetivos generales
  - Competencias
  - Estructura de sesiones (con título, contenido clave, duración)
  - Recursos
  - Estrategias de evaluación
  - Actividades transversales

**Pregunta:** ¿Quieres que la guía del tema solo genere nombres preliminares y contexto básico para cada sesión, o mantener la guía maestra completa actual?

---

### 4. ✅ **Programación de Sesiones**

**Diagrama esperado:**
- "Programa las sesiones del Tema"

**Flujo actual:**
- El profesor programa sesiones individuales desde el detalle del tema
- Cada sesión se programa con: grupo, número de sesión, fecha, duración, contexto

**Estado:** ✅ Funciona correctamente

---

### 5. ⚠️ **Feedback del Profesor**

**Diagrama esperado:**
- "Recibe feedback de cada alumno y de la clase"

**Flujo actual:**
- El profesor puede:
  - Ver recomendaciones del quiz pre (generadas automáticamente)
  - Ver retroalimentaciones individuales de alumnos (generadas después del quiz post)
  - Ver retroalimentación grupal (generada después del quiz post)
- Las retroalimentaciones se GENERAN automáticamente, no se "reciben" pasivamente

**Pregunta:** ¿El término "recibe feedback" significa que el sistema debe notificar al profesor cuando hay feedback disponible, o está bien que el profesor vaya a la página de retroalimentaciones?

---

### 6. ✅ **Flujo de Alumno**

**Diagrama esperado:**
1. Resuelven quiz previo
2. Resuelven quiz post
3. Recibe feedback individual

**Flujo actual:**
- Los alumnos pueden responder quizzes cuando están publicados
- Reciben retroalimentaciones individuales después del quiz post

**Estado:** ✅ Funciona correctamente

---

### 7. ✅ **Flujo de Padres**

**Diagrama esperado:**
- "Recibe feedback individual del hijo"

**Flujo actual:**
- Los padres pueden ver retroalimentaciones de sus hijos

**Estado:** ✅ Funciona correctamente

---

### 8. ✅ **Flujo de Directivo/Admin**

**Diagrama esperado:**
1. Carga de Currícula (define materias por período y grado)
2. Asigna materia y grado a docente

**Flujo actual:**
- Admin puede crear planes anuales (materias por grado)
- Admin puede asignar profesores a materias y grupos

**Estado:** ✅ Funciona correctamente

---

## Resumen de Preguntas Clave

1. **Generación de guías para múltiples sesiones:**
   - ¿Quieres que el profesor pueda generar guías para varias sesiones próximas de una vez?
   - ¿O solo para la próxima sesión?

2. **Nivel de detalle de la guía del tema:**
   - ¿La guía del tema debe ser solo nombres preliminares y contexto básico?
   - ¿O mantener la guía maestra completa actual?

3. **Feedback del profesor:**
   - ¿Necesitas notificaciones cuando hay feedback disponible?
   - ¿O está bien que el profesor vaya a la página de retroalimentaciones?

4. **Orden de generación de quizzes:**
   - ¿Está bien generar ambos quizzes (pre y post) antes de enviar el quiz previo?
   - ¿O prefieres que el quiz post se genere después de enviar el quiz previo?

---

## Funcionalidades que Parecen Faltar o Diferir

1. **Generación masiva de guías de clase:** No existe la capacidad de generar guías para múltiples sesiones próximas de una vez

2. **Notificaciones de feedback:** No hay sistema de notificaciones para alertar al profesor cuando hay feedback disponible

3. **Guía del tema simplificada:** Actualmente genera una guía completa, no solo nombres preliminares


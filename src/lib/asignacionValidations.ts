import { supabase } from "@/integrations/supabase/client";

export interface AsignacionData {
  id_profesor: string;
  id_materia: string;
  id_grupo: string;
  anio_escolar: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export async function validateAsignacion(
  data: AsignacionData,
  existingAsignacionId?: string
): Promise<ValidationResult> {
  const warnings: string[] = [];

  try {
    // 1. Verificar que el profesor esté activo
    const { data: profesor, error: profesorError } = await supabase
      .from("profesores")
      .select("activo")
      .eq("id", data.id_profesor)
      .maybeSingle();

    if (profesorError) {
      return { isValid: false, error: "Error al verificar el profesor" };
    }

    if (!profesor) {
      return { isValid: false, error: "Profesor no encontrado" };
    }

    if (!profesor.activo) {
      return { isValid: false, error: "El profesor no está activo" };
    }

    // 2. Verificar compatibilidad de grado entre materia y grupo
    const { data: materia, error: materiaError } = await supabase
      .from("materias")
      .select("id_plan_anual, plan_anual(grado)")
      .eq("id", data.id_materia)
      .single();

    if (materiaError || !materia) {
      return { isValid: false, error: "Error al verificar la materia" };
    }

    const { data: grupo, error: grupoError } = await supabase
      .from("grupos")
      .select("grado")
      .eq("id", data.id_grupo)
      .single();

    if (grupoError || !grupo) {
      return { isValid: false, error: "Error al verificar el grupo" };
    }

    const materiaPlanAnual = materia.plan_anual as { grado: string } | null;
    if (!materiaPlanAnual) {
      return {
        isValid: false,
        error: "La materia no tiene un plan anual asociado",
      };
    }

    if (materiaPlanAnual.grado !== grupo.grado) {
      return {
        isValid: false,
        error: `La materia es de ${materiaPlanAnual.grado} pero el grupo es de ${grupo.grado}`,
      };
    }

    // 3. Verificar duplicados (solo si no es edición o si cambió algún campo)
    const { data: existingAsignacion, error: duplicateError } = await supabase
      .from("asignaciones_profesor")
      .select("id")
      .eq("id_profesor", data.id_profesor)
      .eq("id_materia", data.id_materia)
      .eq("id_grupo", data.id_grupo)
      .eq("anio_escolar", data.anio_escolar)
      .maybeSingle();

    if (duplicateError) {
      return { isValid: false, error: "Error al verificar duplicados" };
    }

    if (existingAsignacion && existingAsignacion.id !== existingAsignacionId) {
      return {
        isValid: false,
        error: "Ya existe una asignación idéntica para este profesor, materia y grupo",
      };
    }

    // 4. Verificar carga horaria del profesor
    const { data: asignacionesProfesor, error: asignacionesError } =
      await supabase
        .from("asignaciones_profesor")
        .select("id_materia, materias(horas_semanales)")
        .eq("id_profesor", data.id_profesor)
        .eq("anio_escolar", data.anio_escolar);

    if (asignacionesError) {
      return { isValid: false, error: "Error al verificar carga horaria" };
    }

    // Calcular horas totales excluyendo la asignación actual si es edición
    let horasTotales = 0;
    asignacionesProfesor?.forEach((asig) => {
      if (asig.id_materia !== existingAsignacionId) {
        const materia = asig.materias as { horas_semanales: number } | null;
        horasTotales += materia?.horas_semanales || 0;
      }
    });

    // Agregar horas de la nueva/editada asignación
    const { data: nuevaMateria } = await supabase
      .from("materias")
      .select("horas_semanales")
      .eq("id", data.id_materia)
      .single();

    horasTotales += nuevaMateria?.horas_semanales || 0;

    if (horasTotales > 40) {
      warnings.push(
        `El profesor tendrá ${horasTotales} horas semanales (máximo recomendado: 40)`
      );
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    console.error("Error en validación de asignación:", error);
    return { isValid: false, error: "Error inesperado en la validación" };
  }
}

export function getCurrentAnioEscolar(): string {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11

  // Si estamos entre enero-junio, el año escolar es el año anterior
  // Si estamos entre julio-diciembre, el año escolar es el año actual
  return currentMonth < 6 ? (currentYear - 1).toString() : currentYear.toString();
}

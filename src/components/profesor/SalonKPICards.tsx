import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SalonKPICardsProps {
  resumen: {
    promedio_nota?: number | null;
    comprension_promedio?: number | null;
    participacion_promedio?: number | null;
    completitud_promedio?: number | null;
    alumnos_en_riesgo?: number;
    quizzes_pendientes?: number;
    promedio_quiz_pre?: number | null;
    promedio_quiz_post?: number | null;
  };
}

export function SalonKPICards({ resumen }: SalonKPICardsProps) {
  const mejoraPromedio = 
    resumen.promedio_quiz_pre !== null && resumen.promedio_quiz_post !== null
      ? resumen.promedio_quiz_post - resumen.promedio_quiz_pre
      : null;

  const getTendencia = (valor: number | null) => {
    if (valor === null) return null;
    if (valor > 0.5) return "up";
    if (valor < -0.5) return "down";
    return "stable";
  };

  const tendencia = getTendencia(mejoraPromedio);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Promedio Nota */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Promedio Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {resumen.promedio_nota !== null && resumen.promedio_nota !== undefined
              ? `${resumen.promedio_nota.toFixed(1)} / 20`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Basado en resultados de quizzes
          </p>
        </CardContent>
      </Card>

      {/* Comprensión Promedio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Comprensión Promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {resumen.comprension_promedio !== null && resumen.comprension_promedio !== undefined
              ? `${Math.round(resumen.comprension_promedio * 100) / 100}%`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Porcentaje de aciertos promedio
          </p>
        </CardContent>
      </Card>

      {/* Participación Promedio */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Participación Promedio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {resumen.participacion_promedio !== null && resumen.participacion_promedio !== undefined
              ? `${Math.round(resumen.participacion_promedio * 100) / 100}%`
              : "—"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Tasa de participación en quizzes
          </p>
        </CardContent>
      </Card>

      {/* Alumnos en Riesgo */}
      <Card className={cn(
        resumen.alumnos_en_riesgo && resumen.alumnos_en_riesgo > 0
          ? "border-amber-200 bg-amber-50/60"
          : ""
      )}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            Alumnos en Riesgo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {resumen.alumnos_en_riesgo ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Bajo rendimiento o poca participación
          </p>
        </CardContent>
      </Card>

      {/* Quizzes Pendientes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Quizzes Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {resumen.quizzes_pendientes ?? 0}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Quizzes sin completar por todos los alumnos
          </p>
        </CardContent>
      </Card>

      {/* Comparación Quiz Pre vs Post */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Mejora Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          {mejoraPromedio !== null ? (
            <>
              <div className="text-2xl font-bold flex items-center gap-2">
                {tendencia === "up" && (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">+{mejoraPromedio.toFixed(1)}</span>
                  </>
                )}
                {tendencia === "down" && (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="text-red-600">{mejoraPromedio.toFixed(1)}</span>
                  </>
                )}
                {tendencia === "stable" && (
                  <>
                    <span>{mejoraPromedio.toFixed(1)}</span>
                  </>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                <div>Pre: {resumen.promedio_quiz_pre?.toFixed(1) ?? "—"}</div>
                <div>Post: {resumen.promedio_quiz_post?.toFixed(1) ?? "—"}</div>
              </div>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground mt-1">
                No hay datos de quiz pre/post
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


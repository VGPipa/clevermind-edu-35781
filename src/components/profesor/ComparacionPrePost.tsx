import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ClaseConResultados } from "@/hooks/use-mis-clases-profesor";

interface ComparacionPrePostProps {
  clases: ClaseConResultados[];
}

export function ComparacionPrePost({ clases }: ComparacionPrePostProps) {
  const clasesConQuizzes = clases.filter(
    (c) => c.metricas?.promedio_quiz_pre !== null && c.metricas?.promedio_quiz_post !== null
  );

  if (clasesConQuizzes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparación Quiz Pre vs Post</CardTitle>
          <CardDescription>No hay datos suficientes para mostrar el gráfico</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const data = clasesConQuizzes.map((clase) => ({
    nombre: clase.tema.nombre.substring(0, 20) + (clase.tema.nombre.length > 20 ? "..." : ""),
    "Quiz Pre": clase.metricas?.promedio_quiz_pre || 0,
    "Quiz Post": clase.metricas?.promedio_quiz_post || 0,
    mejora: clase.metricas?.mejora_promedio || 0,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación Quiz Pre vs Post</CardTitle>
        <CardDescription>Evolución del desempeño de los alumnos</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="nombre"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: number) => value.toFixed(1)} />
            <Legend />
            <Bar dataKey="Quiz Pre" fill="#8884d8" />
            <Bar dataKey="Quiz Post" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


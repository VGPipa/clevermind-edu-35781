import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatPeruDateTime } from "@/lib/timezone";
import type { QuizData } from "@/hooks/use-mis-clases-alumno";

interface EvolucionNotasChartProps {
  quizzes: QuizData[];
}

export function EvolucionNotasChart({ quizzes }: EvolucionNotasChartProps) {
  // Filtrar solo quizzes completados con calificación
  const quizzesCompletados = quizzes
    .filter(
      (q) =>
        q.respuesta_alumno?.estado === "completado" &&
        q.respuesta_alumno?.calificacion?.nota_numerica !== null
    )
    .sort((a, b) => {
      const fechaA = a.respuesta_alumno?.fecha_envio || "";
      const fechaB = b.respuesta_alumno?.fecha_envio || "";
      return fechaA.localeCompare(fechaB);
    });

  if (quizzesCompletados.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Notas</CardTitle>
          <CardDescription>No hay datos suficientes para mostrar el gráfico</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Preparar datos para el gráfico
  const data = quizzesCompletados.map((quiz, index) => {
    const nota = quiz.respuesta_alumno?.calificacion?.nota_numerica || 0;
    const fecha = quiz.respuesta_alumno?.fecha_envio
      ? new Date(quiz.respuesta_alumno.fecha_envio)
      : new Date();
    const fechaFormateada = fecha.toLocaleDateString("es-PE", {
      month: "short",
      day: "numeric",
    });

    return {
      nombre: `Quiz ${index + 1}`,
      fecha: fechaFormateada,
      nota: Number(nota.toFixed(1)),
      materia: quiz.clase.tema.materia.nombre,
    };
  });

  // Calcular promedio móvil (últimas 3 notas)
  const promedioMovil = data.map((_, index) => {
    const inicio = Math.max(0, index - 2);
    const subconjunto = data.slice(inicio, index + 1);
    const promedio =
      subconjunto.reduce((sum, item) => sum + item.nota, 0) / subconjunto.length;
    return {
      ...data[index],
      promedio: Number(promedio.toFixed(1)),
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolución de Notas</CardTitle>
        <CardDescription>Progreso de tus calificaciones a lo largo del tiempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={promedioMovil}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="fecha"
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              domain={[0, 20]}
              tick={{ fontSize: 12 }}
              label={{ value: "Nota", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(value: number) => value.toFixed(1)}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return `${payload[0].payload.nombre} - ${payload[0].payload.materia}`;
                }
                return label;
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="nota"
              stroke="#8884d8"
              strokeWidth={2}
              name="Nota"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="promedio"
              stroke="#82ca9d"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Promedio Móvil (3)"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


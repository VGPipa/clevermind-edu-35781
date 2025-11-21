import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ClaseConResultados } from "@/hooks/use-mis-clases-profesor";

interface DistribucionNotasChartProps {
  clase: ClaseConResultados;
}

export function DistribucionNotasChart({ clase }: DistribucionNotasChartProps) {
  const notas = clase.resultados_alumnos
    .map((a) => a.nota_quiz_post)
    .filter((n): n is number => typeof n === "number");

  if (notas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Notas</CardTitle>
          <CardDescription>No hay datos suficientes para mostrar el gráfico</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Crear rangos de notas
  const rangos = [
    { rango: "0-5", min: 0, max: 5 },
    { rango: "6-10", min: 6, max: 10 },
    { rango: "11-15", min: 11, max: 15 },
    { rango: "16-20", min: 16, max: 20 },
  ];

  const distribucion = rangos.map((r) => ({
    rango: r.rango,
    cantidad: notas.filter((n) => n >= r.min && n <= r.max).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución de Notas</CardTitle>
        <CardDescription>{clase.tema.nombre}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distribucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rango" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="cantidad" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


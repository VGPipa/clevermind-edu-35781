import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { MetricasGlobales } from "@/types/metricas-salon";
interface MetricasGlobalesSalonProps {
  metricas: MetricasGlobales;
  nombreSalon: string;
}
export function MetricasGlobalesSalon({
  metricas,
  nombreSalon
}: MetricasGlobalesSalonProps) {
  if (!metricas) {
    return <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay métricas globales disponibles</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Resumen del salón</h2>
        <p className="text-muted-foreground text-sm">
          Métricas del grupo durante el año escolar
        </p>
      </div>
    </div>;
}
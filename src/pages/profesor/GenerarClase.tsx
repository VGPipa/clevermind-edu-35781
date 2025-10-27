import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Loader2, FileText, Target, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function GenerarClase() {
  const [loading, setLoading] = useState(false);
  const [guiaGenerada, setGuiaGenerada] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    materia: "",
    grado: "",
    tema: "",
    duracion: "90",
    objetivos: "",
    contextoAlumnos: ""
  });

  const handleGenerar = async () => {
    if (!formData.materia || !formData.tema || !formData.objetivos) {
      toast.error("Por favor completa todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generar-clase', {
        body: formData
      });

      if (error) throw error;

      setGuiaGenerada(data);
      toast.success("Guía de clase generada exitosamente");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Error al generar la guía de clase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Generar Guía de Clase con IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Crea guías pedagógicas personalizadas en segundos
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Información de la Clase
              </CardTitle>
              <CardDescription>Completa los datos para generar tu guía</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="materia">Materia *</Label>
                  <Select value={formData.materia} onValueChange={(value) => setFormData({...formData, materia: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona materia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="matematicas">Matemáticas</SelectItem>
                      <SelectItem value="lenguaje">Lenguaje</SelectItem>
                      <SelectItem value="ciencias">Ciencias</SelectItem>
                      <SelectItem value="historia">Historia</SelectItem>
                      <SelectItem value="ingles">Inglés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grado">Grado *</Label>
                  <Select value={formData.grado} onValueChange={(value) => setFormData({...formData, grado: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona grado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1basico">1° Básico</SelectItem>
                      <SelectItem value="2basico">2° Básico</SelectItem>
                      <SelectItem value="3basico">3° Básico</SelectItem>
                      <SelectItem value="4basico">4° Básico</SelectItem>
                      <SelectItem value="5basico">5° Básico</SelectItem>
                      <SelectItem value="6basico">6° Básico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tema">Tema de la Clase *</Label>
                <Input
                  id="tema"
                  placeholder="Ej: Suma y resta hasta 100"
                  value={formData.tema}
                  onChange={(e) => setFormData({...formData, tema: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duracion">Duración (minutos)</Label>
                <Select value={formData.duracion} onValueChange={(value) => setFormData({...formData, duracion: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="45">45 minutos</SelectItem>
                    <SelectItem value="60">60 minutos</SelectItem>
                    <SelectItem value="90">90 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="objetivos">Objetivos de Aprendizaje *</Label>
                <Textarea
                  id="objetivos"
                  placeholder="Ej: Que los alumnos aprendan a sumar y restar números hasta 100..."
                  rows={3}
                  value={formData.objetivos}
                  onChange={(e) => setFormData({...formData, objetivos: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contexto">Contexto de los Alumnos (opcional)</Label>
                <Textarea
                  id="contexto"
                  placeholder="Nivel de conocimiento previo, dificultades específicas, intereses..."
                  rows={2}
                  value={formData.contextoAlumnos}
                  onChange={(e) => setFormData({...formData, contextoAlumnos: e.target.value})}
                />
              </div>

              <Button 
                className="w-full bg-gradient-primary" 
                size="lg"
                onClick={handleGenerar}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Generar Guía con IA
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {!guiaGenerada ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Listo para generar tu guía</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Completa el formulario y presiona "Generar Guía con IA" para crear una planificación pedagógica personalizada
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Guía Generada
                  </CardTitle>
                  <CardDescription>
                    <Badge variant="secondary" className="mr-2">{guiaGenerada.materia}</Badge>
                    <Badge variant="outline">{guiaGenerada.grado}</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      {guiaGenerada.tema}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {guiaGenerada.duracion} min
                      </div>
                    </div>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <div 
                      className="p-4 rounded-lg bg-muted/50 whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{ __html: guiaGenerada.contenido }}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1" variant="outline">
                      Editar
                    </Button>
                    <Button className="flex-1">
                      Guardar Guía
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-base">💡 Consejos para mejores resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>✓ Sé específico con los objetivos de aprendizaje</p>
                <p>✓ Menciona el nivel previo de conocimientos de tus alumnos</p>
                <p>✓ Indica si hay recursos específicos que quieras incluir</p>
                <p>✓ Señala cualquier adaptación necesaria para NEE</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

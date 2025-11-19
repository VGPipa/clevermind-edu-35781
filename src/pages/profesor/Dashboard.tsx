import { useMemo, ReactNode, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GraduationCap, TrendingUp, Clock, Sparkles, Calendar, CheckCircle2, Brain, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { StatsCard } from "@/components/profesor/StatsCard";
import { FechaSelector } from "@/components/profesor/FechaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isWithinInterval, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { ClaseActionsMenu } from "@/components/profesor/ClaseActionsMenu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
export default function ProfesorDashboard() {
  const navigate = useNavigate();
  const [fechaReferencia, setFechaReferencia] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [cursoFilter, setCursoFilter] = useState<string>("todos");
  const [salonFilter, setSalonFilter] = useState<string>("todos");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [timeFilterType, setTimeFilterType] = useState<string>("semana_actual");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [timeFilterOpen, setTimeFilterOpen] = useState(false);
  const {
    data: dashboardData,
    isLoading
  } = useQuery({
    queryKey: ['dashboard-profesor', fechaReferencia],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke('dashboard-profesor', {
        body: {
          fecha_referencia: fechaReferencia
        }
      });
      if (error) throw error;
      return data;
    }
  });
  const stats = [{
    title: "Clases esta semana",
    value: dashboardData?.stats?.classes_this_week?.toString() || "0",
    icon: BookOpen
  }, {
    title: "Materias asignadas",
    value: dashboardData?.stats?.assigned_subjects?.toString() || "0",
    icon: GraduationCap
  }, {
    title: "Total estudiantes",
    value: dashboardData?.stats?.total_students?.toString() || "0",
    icon: Users
  }, {
    title: "Promedio general",
    value: dashboardData?.stats?.general_average?.toString() || "0.0",
    icon: TrendingUp
  }];
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d 'de' MMMM", {
      locale: es
    });
  };
  const getClaseStage = (estado: string) => {
    const estadoMap: Record<string, {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline" | "neutral";
    }> = {
      'borrador': {
        label: "Borrador",
        variant: "neutral"
      },
      'generando_clase': {
        label: "Generando clase",
        variant: "secondary"
      },
      'editando_guia': {
        label: "Editando guía",
        variant: "neutral"
      },
      'guia_aprobada': {
        label: "Guía aprobada",
        variant: "default"
      },
      'quiz_pre_generando': {
        label: "Generando quiz PRE",
        variant: "secondary"
      },
      'quiz_pre_enviado': {
        label: "Quiz PRE enviado",
        variant: "default"
      },
      'analizando_quiz_pre': {
        label: "Analizando quiz PRE",
        variant: "secondary"
      },
      'modificando_guia': {
        label: "Modificando guía",
        variant: "secondary"
      },
      'guia_final': {
        label: "Guía final lista",
        variant: "default"
      },
      'clase_programada': {
        label: "Clase programada",
        variant: "default"
      },
      'en_clase': {
        label: "En clase",
        variant: "default"
      },
      'quiz_post_generando': {
        label: "Generando quiz POST",
        variant: "secondary"
      },
      'quiz_post_enviado': {
        label: "Quiz POST enviado",
        variant: "default"
      },
      'analizando_resultados': {
        label: "Analizando resultados",
        variant: "secondary"
      },
      'completada': {
        label: "Completada",
        variant: "default"
      }
    };
    return estadoMap[estado] || {
      label: estado,
      variant: "outline"
    };
  };

  // Función para categorizar estado de preparación (frontend)
  const getPreparacionCategory = (estado: string): string => {
    const guiaPendiente = ['borrador', 'generando_clase', 'editando_guia'];
    const evalPrePendiente = ['guia_aprobada', 'quiz_pre_generando'];
    const evalPostPendiente = ['quiz_pre_enviado', 'analizando_quiz_pre', 'modificando_guia', 'guia_final', 'quiz_post_generando'];
    
    if (guiaPendiente.includes(estado)) return 'guia_pendiente';
    if (evalPrePendiente.includes(estado)) return 'eval_pre_pendiente';
    if (evalPostPendiente.includes(estado)) return 'eval_post_pendiente';
    return 'otros';
  };

  // Separar clases en 2 bloques principales
  // Obtener lista única de cursos y salones
  const cursosDisponibles = useMemo(() => {
    const cursos = new Set<string>();
    dashboardData?.clases_pendientes?.forEach((clase: any) => {
      if (clase.materia_nombre && clase.grupo_nombre) {
        cursos.add(`${clase.materia_nombre} - ${clase.grupo_nombre}`);
      }
    });
    dashboardData?.clases_listas?.forEach((clase: any) => {
      if (clase.materia_nombre && clase.grupo_nombre) {
        cursos.add(`${clase.materia_nombre} - ${clase.grupo_nombre}`);
      }
    });
    return Array.from(cursos).sort();
  }, [dashboardData]);
  const salonesDisponibles = useMemo(() => {
    const salones = new Set<string>();
    dashboardData?.clases_pendientes?.forEach((clase: any) => {
      if (clase.grupo_nombre) {
        salones.add(clase.grupo_nombre);
      }
    });
    dashboardData?.clases_listas?.forEach((clase: any) => {
      if (clase.grupo_nombre) {
        salones.add(clase.grupo_nombre);
      }
    });
    return Array.from(salones).sort();
  }, [dashboardData]);
  const clasesEnPreparacion = useMemo(() => {
    if (!dashboardData?.clases_pendientes) return [];
    let clases = dashboardData.clases_pendientes;

    // Aplicar filtro de curso
    if (cursoFilter !== "todos") {
      clases = clases.filter((clase: any) => `${clase.materia_nombre} - ${clase.grupo_nombre}` === cursoFilter);
    }

    // Aplicar filtro de salón
    if (salonFilter !== "todos") {
      clases = clases.filter((clase: any) => clase.grupo_nombre === salonFilter);
    }

    // Aplicar filtro de estatus
    if (statusFilter !== "todos") {
      clases = clases.filter((clase: any) => getPreparacionCategory(clase.estado) === statusFilter);
    }

    return clases.map((clase: any) => ({
      ...clase,
      estado_label: getClaseStage(clase.estado).label,
      estado_variant: getClaseStage(clase.estado).variant
    }));
  }, [dashboardData, cursoFilter, salonFilter, statusFilter]);
  const clasesCalendario = useMemo(() => {
    if (!dashboardData?.clases_listas) return [];
    let clases = dashboardData.clases_listas;

    // Aplicar filtro de curso
    if (cursoFilter !== "todos") {
      clases = clases.filter((clase: any) => `${clase.materia_nombre} - ${clase.grupo_nombre}` === cursoFilter);
    }

    // Aplicar filtro de salón
    if (salonFilter !== "todos") {
      clases = clases.filter((clase: any) => clase.grupo_nombre === salonFilter);
    }

    // Aplicar filtro de tiempo
    if (timeFilterType !== "todos") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let startDate: Date;
      let endDate: Date;

      if (timeFilterType === "semana_pasada") {
        startDate = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        endDate = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
      } else if (timeFilterType === "semana_actual") {
        startDate = startOfWeek(today, { weekStartsOn: 1 });
        endDate = endOfWeek(today, { weekStartsOn: 1 });
      } else if (timeFilterType === "semana_proxima") {
        startDate = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
        endDate = endOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });
      } else if (timeFilterType === "personalizado" && customDateRange?.from) {
        startDate = customDateRange.from;
        endDate = customDateRange.to || customDateRange.from;
      } else {
        startDate = today;
        endDate = today;
      }

      clases = clases.filter((clase: any) => {
        if (!clase.fecha_programada) return false;
        const claseDate = parseISO(clase.fecha_programada.split('T')[0]);
        return isWithinInterval(claseDate, { start: startDate, end: endDate });
      });
    }

    return clases.map((clase: any) => ({
      ...clase,
      estado_label: getClaseStage(clase.estado).label,
      estado_variant: getClaseStage(clase.estado).variant
    })).sort((a: any, b: any) => {
      if (!a.fecha_programada) return 1;
      if (!b.fecha_programada) return -1;
      return new Date(a.fecha_programada).getTime() - new Date(b.fecha_programada).getTime();
    });
  }, [dashboardData, cursoFilter, salonFilter, timeFilterType, customDateRange]);

  // Agrupar clases del calendario por categorías temporales
  const groupedCalendario = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekEnd = new Date(today);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 7);
    const groups = {
      hoy: [] as typeof clasesCalendario,
      manana: [] as typeof clasesCalendario,
      estaSemana: [] as typeof clasesCalendario,
      proximamente: [] as typeof clasesCalendario
    };
    clasesCalendario.forEach((clase: any) => {
      if (!clase.fecha_programada) {
        groups.proximamente.push(clase);
        return;
      }
      const claseDate = new Date(clase.fecha_programada);
      claseDate.setHours(0, 0, 0, 0);
      if (claseDate.getTime() === today.getTime()) {
        groups.hoy.push(clase);
      } else if (claseDate.getTime() === tomorrow.getTime()) {
        groups.manana.push(clase);
      } else if (claseDate < thisWeekEnd) {
        groups.estaSemana.push(clase);
      } else {
        groups.proximamente.push(clase);
      }
    });
    return groups;
  }, [clasesCalendario]);
  const renderEmptyState = (Icon: any, title: string, description: string) => <div className="text-center py-8">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <h3 className="font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>;
  if (isLoading) {
    return <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-96" />)}
          </div>
        </div>
      </AppLayout>;
  }
  return <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inicio Profesor  </h1>
            <p className="text-muted-foreground">
              Vista general de tu actividad docente
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate("/profesor/generar-clase")} size="lg" variant="action">
              <Sparkles className="mr-2 h-5 w-5" />
              Nueva Clase con IA
            </Button>
            <FechaSelector fechaReferencia={fechaReferencia} onFechaChange={setFechaReferencia} />
          </div>
        </div>


        {/* Stats Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Estadísticas Generales</h2>
          <div className="grid gap-4 md:grid-cols-4">
            {stats.map((stat, index) => <StatsCard key={index} {...stat} />)}
          </div>
        </div>

        {/* Main Content - 2 Blocks */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Estatus de Clases</h2>
            <div className="flex gap-3">
              <Select value={cursoFilter} onValueChange={setCursoFilter}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Filtrar por curso" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="todos">Todos los cursos</SelectItem>
                  {cursosDisponibles.map(curso => <SelectItem key={curso} value={curso}>
                      {curso}
                    </SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={salonFilter} onValueChange={setSalonFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por salón" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  <SelectItem value="todos">Todos los salones</SelectItem>
                  {salonesDisponibles.map(salon => <SelectItem key={salon} value={salon}>
                      {salon}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bloque 1: Clases en Preparación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                En preparación
              </CardTitle>
              <CardDescription>
                Clases que necesitan tu atención antes de ser dictadas
              </CardDescription>
              
              {/* Filtro de estatus */}
              <div className="mt-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtrar por estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los estatus</SelectItem>
                    <SelectItem value="guia_pendiente">Guía pendiente</SelectItem>
                    <SelectItem value="eval_pre_pendiente">Evaluación Pre pendiente</SelectItem>
                    <SelectItem value="eval_post_pendiente">Evaluación Post pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {clasesEnPreparacion.length > 0 ? <div className="space-y-3">
                  {clasesEnPreparacion.map((clase: any) => <div key={clase.id} className="p-4 border rounded-lg space-y-2 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                          <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                        </div>
                        <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                      </div>
                      {clase.fecha_programada && <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Programada: {formatDate(clase.fecha_programada)}
                        </p>}
                      <ClaseActionsMenu clase={clase} />
                    </div>)}
                </div> : renderEmptyState(CheckCircle2, "¡Todo al día!", "No tienes clases pendientes de preparación")}
            </CardContent>
          </Card>

          {/* Bloque 2: Calendario de Clases */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                Programadas
              </CardTitle>
              <CardDescription>
                Clases programadas, en curso y completadas
              </CardDescription>
              
              {/* Filtro de tiempo */}
              <div className="mt-4">
                <Popover open={timeFilterOpen} onOpenChange={setTimeFilterOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start text-left font-normal w-full sm:w-auto"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {timeFilterType === 'semana_pasada' && 'Semana pasada'}
                      {timeFilterType === 'semana_actual' && 'Semana actual'}
                      {timeFilterType === 'semana_proxima' && 'Semana próxima'}
                      {timeFilterType === 'todos' && 'Todas'}
                      {timeFilterType === 'personalizado' && customDateRange?.from && customDateRange?.to && (
                        <>
                          {format(customDateRange.from, "d MMM", { locale: es })} - {format(customDateRange.to, "d MMM", { locale: es })}
                        </>
                      )}
                      {timeFilterType === 'personalizado' && !customDateRange?.to && customDateRange?.from && (
                        <>
                          {format(customDateRange.from, "d MMM", { locale: es })}
                        </>
                      )}
                      {timeFilterType === 'personalizado' && !customDateRange?.from && 'Rango personalizado'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 z-50 bg-card" align="start">
                    <div className="space-y-4">
                      {/* Filtros rápidos */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Filtros rápidos</h4>
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <Button
                            variant={timeFilterType === 'semana_pasada' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              setTimeFilterType('semana_pasada');
                              setCustomDateRange(undefined);
                              setTimeFilterOpen(false);
                            }}
                          >
                            Semana pasada
                          </Button>
                          <Button
                            variant={timeFilterType === 'semana_actual' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              setTimeFilterType('semana_actual');
                              setCustomDateRange(undefined);
                              setTimeFilterOpen(false);
                            }}
                          >
                            Semana actual
                          </Button>
                          <Button
                            variant={timeFilterType === 'semana_proxima' ? 'default' : 'outline'}
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              setTimeFilterType('semana_proxima');
                              setCustomDateRange(undefined);
                              setTimeFilterOpen(false);
                            }}
                          >
                            Semana próxima
                          </Button>
                        </div>
                      </div>

                      {/* Separador */}
                      <div className="border-t" />

                      {/* Rango personalizado */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Rango personalizado</h4>
                        <CalendarComponent
                          mode="range"
                          selected={customDateRange}
                          onSelect={(range) => {
                            setCustomDateRange(range);
                            if (range?.from) {
                              setTimeFilterType('personalizado');
                            }
                          }}
                          numberOfMonths={2}
                          locale={es}
                          className="pointer-events-auto"
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </CardHeader>
            <CardContent>
              {clasesCalendario.length > 0 ? <div className="space-y-4">
                  {/* HOY */}
                  {groupedCalendario.hoy.length > 0 && <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">HOY</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(new Date().toISOString().split('T')[0])}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedCalendario.hoy.map((clase: any) => <div key={clase.id} className="p-3 border rounded-lg bg-destructive/5 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                              </div>
                              <Badge variant={clase.estado_variant as any} className={clase.estado === 'en_clase' ? 'animate-pulse' : ''}>
                                {clase.estado_label}
                              </Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>)}
                      </div>
                    </div>}

                  {/* MAÑANA */}
                  {groupedCalendario.manana.length > 0 && <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">MAÑANA</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(new Date(Date.now() + 86400000).toISOString().split('T')[0])}</span>
                      </div>
                      <div className="space-y-2">
                        {groupedCalendario.manana.map((clase: any) => <div key={clase.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                              </div>
                              <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>)}
                      </div>
                    </div>}

                  {/* ESTA SEMANA */}
                  {groupedCalendario.estaSemana.length > 0 && <div>
                      <Badge variant="outline" className="text-xs mb-2">ESTA SEMANA</Badge>
                      <div className="space-y-2">
                        {groupedCalendario.estaSemana.map((clase: any) => <div key={clase.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                                {clase.fecha_programada && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(clase.fecha_programada)}
                                  </p>}
                              </div>
                              <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>)}
                      </div>
                    </div>}

                  {/* PRÓXIMAMENTE */}
                  {groupedCalendario.proximamente.length > 0 && <div>
                      <Badge variant="outline" className="text-xs mb-2">PRÓXIMAMENTE</Badge>
                      <div className="space-y-2">
                        {groupedCalendario.proximamente.slice(0, 5).map((clase: any) => <div key={clase.id} className="p-3 border rounded-lg space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{clase.tema_nombre}</p>
                                <p className="text-xs text-muted-foreground">{clase.materia_nombre} • {clase.grupo_nombre}</p>
                                {clase.fecha_programada && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(clase.fecha_programada)}
                                  </p>}
                              </div>
                              <Badge variant={clase.estado_variant as any}>{clase.estado_label}</Badge>
                            </div>
                            <ClaseActionsMenu clase={clase} />
                          </div>)}
                      </div>
                      {groupedCalendario.proximamente.length > 5 && <p className="text-xs text-muted-foreground text-center mt-2">
                          +{groupedCalendario.proximamente.length - 5} clases más
                        </p>}
                    </div>}
                </div> : renderEmptyState(Calendar, "No hay clases en calendario", "Las clases programadas aparecerán aquí")}
            </CardContent>
          </Card>
          </div>
        </div>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-orange-500" />
              Recomendaciones IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData?.recomendaciones && dashboardData.recomendaciones.length > 0 ? <div className="space-y-3">
                {dashboardData.recomendaciones.map((rec: any) => <div key={rec.id} className="p-4 border rounded-lg bg-purple-500/5 border-purple-500/20">
                    <p className="text-sm">{rec.contenido}</p>
                    {rec.id_clase_anterior && <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-purple-600" onClick={() => navigate(`/profesor/recomendaciones-quiz-pre/${rec.id_clase_anterior}`)}>
                        Ver detalles →
                      </Button>}
                  </div>)}
              </div> : renderEmptyState(Brain, "No hay recomendaciones", "Las recomendaciones de IA aparecerán aquí")}
          </CardContent>
        </Card>
      </div>
    </AppLayout>;
}
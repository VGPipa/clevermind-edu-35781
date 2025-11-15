import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface BreadcrumbNavigationProps {
  anioEscolar: string;
  onAnioChange: (anio: string) => void;
  grado?: string | null;
  materia?: string | null;
  onNavigateToOverview?: () => void;
  onNavigateToGrado?: () => void;
}

export function BreadcrumbNavigation({
  anioEscolar,
  onAnioChange,
  grado,
  materia,
  onNavigateToOverview,
  onNavigateToGrado,
}: BreadcrumbNavigationProps) {
  // Generate years (current year and 5 years before/after)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {grado ? (
              <BreadcrumbLink 
                onClick={onNavigateToOverview}
                className="cursor-pointer hover:text-primary"
              >
                Plan Anual
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Plan Anual</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {grado && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {materia ? (
                  <BreadcrumbLink 
                    onClick={onNavigateToGrado}
                    className="cursor-pointer hover:text-primary"
                  >
                    {grado}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{grado}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </>
          )}
          {materia && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{materia}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Select value={anioEscolar} onValueChange={onAnioChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Año escolar" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}


import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SearchAndFilterProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  filters?: {
    label: string;
    value: string;
    options: Array<{ label: string; value: string }>;
    onChange: (value: string) => void;
  }[];
  onClear?: () => void;
}

export function SearchAndFilter({
  searchValue,
  onSearchChange,
  placeholder = "Buscar...",
  filters = [],
  onClear,
}: SearchAndFilterProps) {
  const hasActiveFilters = searchValue || filters.some(f => f.value && f.value !== 'all');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
              onClick={() => onSearchChange("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {hasActiveFilters && onClear && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <X className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>
      
      {filters.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filters.map((filter, index) => (
            <div key={index} className="min-w-[150px]">
              <Select value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder={filter.label} />
                </SelectTrigger>
                <SelectContent>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


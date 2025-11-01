import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface PlanningFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (value: string) => void;
  selectedLeaveType: string;
  onLeaveTypeChange: (value: string) => void;
  selectedStatus: string;
  onStatusChange: (value: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const PlanningFilters = ({
  searchQuery,
  onSearchChange,
  selectedDepartment,
  onDepartmentChange,
  selectedLeaveType,
  onLeaveTypeChange,
  selectedStatus,
  onStatusChange,
  onClearFilters,
  activeFiltersCount,
}: PlanningFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un employé..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtres avancés
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="department">Département</Label>
                <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="Tous les départements" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les départements</SelectItem>
                    <SelectItem value="rh">Ressources Humaines</SelectItem>
                    <SelectItem value="it">Informatique</SelectItem>
                    <SelectItem value="sales">Commercial</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave-type">Type d'absence</Label>
                <Select value={selectedLeaveType} onValueChange={onLeaveTypeChange}>
                  <SelectTrigger id="leave-type">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="vacation">Congés payés</SelectItem>
                    <SelectItem value="rtt">RTT</SelectItem>
                    <SelectItem value="paternity">Congé paternité</SelectItem>
                    <SelectItem value="maternity">Congé maternité</SelectItem>
                    <SelectItem value="sickChild">Enfant malade</SelectItem>
                    <SelectItem value="unpaidExcused">Absence justifiée</SelectItem>
                    <SelectItem value="unpaidUnexcused">Absence injustifiée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Statut présence</Label>
                <Select value={selectedStatus} onValueChange={onStatusChange}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="present">Présent</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="partial">Partiel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Active Filters Display */}
        {searchQuery && (
          <Badge variant="secondary" className="gap-1">
            Recherche: {searchQuery}
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => onSearchChange("")}
            />
          </Badge>
        )}
        {selectedDepartment !== "all" && (
          <Badge variant="secondary" className="gap-1">
            Département
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => onDepartmentChange("all")}
            />
          </Badge>
        )}
        {selectedLeaveType !== "all" && (
          <Badge variant="secondary" className="gap-1">
            Type d'absence
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => onLeaveTypeChange("all")}
            />
          </Badge>
        )}
        {selectedStatus !== "all" && (
          <Badge variant="secondary" className="gap-1">
            Statut
            <X
              className="h-3 w-3 cursor-pointer hover:text-destructive"
              onClick={() => onStatusChange("all")}
            />
          </Badge>
        )}
      </div>
    </div>
  );
};

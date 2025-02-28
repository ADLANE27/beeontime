
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type EventCategory = Database["public"]["Enums"]["event_category"];

interface EventFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: EventCategory | "all";
  setSelectedCategory: (category: EventCategory | "all") => void;
  selectedPeriod: Date | null;
  setSelectedPeriod: (date: Date | null) => void;
}

export const EventFilters = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedPeriod,
  setSelectedPeriod,
}: EventFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-4">
      <Input
        placeholder="Rechercher..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-xs"
      />

      <Select 
        value={selectedCategory} 
        onValueChange={(value: EventCategory | "all") => setSelectedCategory(value)}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes les catégories</SelectItem>
          <SelectItem value="disciplinary">Disciplinaire</SelectItem>
          <SelectItem value="evaluation">Évaluation</SelectItem>
          <SelectItem value="administrative">Administratif</SelectItem>
          <SelectItem value="other">Autre</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedPeriod ? (
              format(selectedPeriod, "P", { locale: fr })
            ) : (
              <span>Sélectionner une date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedPeriod}
            onSelect={setSelectedPeriod}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {selectedPeriod && (
        <Button 
          variant="ghost" 
          onClick={() => setSelectedPeriod(null)}
          className="px-2"
        >
          Réinitialiser la date
        </Button>
      )}
    </div>
  );
};

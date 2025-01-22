import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ChevronDown, ChevronUp, Plus, Download, Trash2 } from "lucide-react";
import { NewHREventDialog } from "./NewHREventDialog";
import { HREventDetails } from "./HREventDetails";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { generateEventPDF } from "./utils";

type EventCategory = Database["public"]["Enums"]["event_category"];

const ITEMS_PER_PAGE = 10;

type SortField = "event_date" | "severity" | "category";
type SortOrder = "asc" | "desc";

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "minor":
      return "secondary";
    default:
      return "default";
  }
};

const getSeverityLabel = (severity: string) => {
  switch (severity) {
    case "critical":
      return "Critique";
    case "minor":
      return "Mineure";
    default:
      return "Standard";
  }
};

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    disciplinary: "Disciplinaire",
    evaluation: "Évaluation",
    administrative: "Administratif",
    other: "Autre"
  };
  return labels[category] || category;
};

export const HREventsList = () => {
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [selectedPeriod, setSelectedPeriod] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("event_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["hr-events", searchQuery, selectedCategory, selectedPeriod, sortField, sortOrder],
    queryFn: async () => {
      let query = supabase
        .from("hr_events")
        .select(`
          *,
          employees (
            first_name,
            last_name
          )
        `);

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (selectedCategory && selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      if (selectedPeriod) {
        const startOfDay = new Date(selectedPeriod);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedPeriod);
        endOfDay.setHours(23, 59, 59, 999);
        
        query = query.gte("event_date", startOfDay.toISOString())
                    .lte("event_date", endOfDay.toISOString());
      }

      query = query.order(sortField, { ascending: sortOrder === "asc" });

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("hr_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-events"] });
      toast.success("Événement supprimé avec succès");
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Erreur lors de la suppression de l'événement");
    },
  });

  const handleDeleteEvent = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const totalPages = events ? Math.ceil(events.length / ITEMS_PER_PAGE) : 0;
  const paginatedEvents = events?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDownloadPDF = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    await generateEventPDF(event);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Événements RH</h2>
        <Button onClick={() => setIsNewEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

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

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("event_date")}
                  >
                    Date
                    <SortIcon field="event_date" />
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("category")}
                  >
                    Type
                    <SortIcon field="category" />
                  </TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort("severity")}
                  >
                    Gravité
                    <SortIcon field="severity" />
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents?.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <TableCell>
                      {event.employees?.first_name} {event.employees?.last_name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(event.event_date), "Pp", { locale: fr })}
                    </TableCell>
                    <TableCell>
                      {getCategoryLabel(event.category)}
                    </TableCell>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(event.severity)}>
                        {getSeverityLabel(event.severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={event.status === 'open' ? 'default' : 'secondary'}
                      >
                        {event.status === 'open' ? 'Ouvert' : 'Clôturé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => handleDownloadPDF(event, e)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => handleDeleteEvent(event.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="py-2">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      <NewHREventDialog
        open={isNewEventOpen}
        onOpenChange={setIsNewEventOpen}
      />

      <HREventDetails
        eventId={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};

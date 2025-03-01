
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
import { CalendarIcon, ChevronDown, ChevronUp, Plus, Download, Trash2, Search, Filter, AlertTriangle, Circle } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gradient">Événements RH</h2>
        <Button onClick={() => setIsNewEventOpen(true)} className="shadow-sm gap-1.5">
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      <div className="glass-card p-4 rounded-xl mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="relative flex-grow max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par titre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select 
              value={selectedCategory} 
              onValueChange={(value: EventCategory | "all") => setSelectedCategory(value)}
            >
              <SelectTrigger className="w-[180px] bg-white/90">
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
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal bg-white/90">
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
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Chargement des événements...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden bg-white/70 backdrop-blur-sm shadow-sm">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Employé</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort("event_date")}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      <SortIcon field="event_date" />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      Type
                      <SortIcon field="category" />
                    </div>
                  </TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => handleSort("severity")}
                  >
                    <div className="flex items-center gap-1">
                      Gravité
                      <SortIcon field="severity" />
                    </div>
                  </TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEvents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-muted-foreground/50 mb-2" />
                        <p className="text-muted-foreground">Aucun événement trouvé</p>
                        <Button 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => setIsNewEventOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Ajouter un événement
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEvents?.map((event) => (
                    <TableRow
                      key={event.id}
                      className="cursor-pointer hover-scale hover:bg-muted/30"
                      onClick={() => setSelectedEvent(event.id)}
                    >
                      <TableCell className="font-medium">
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
                        <div className="flex items-center gap-1.5">
                          <Circle 
                            className={`h-2 w-2 ${event.status === 'open' ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`}
                          />
                          <Badge
                            variant={event.status === 'open' ? 'default' : 'secondary'}
                            className={event.status === 'open' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                          >
                            {event.status === 'open' ? 'Ouvert' : 'Clôturé'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-gray-100"
                            onClick={(e) => handleDownloadPDF(event, e)}
                          >
                            <Download className="h-4 w-4 text-primary" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-red-50 text-destructive"
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronUp className="h-4 w-4 rotate-90" /> 
                Précédent
              </Button>
              <span className="py-2 px-3 rounded bg-gray-50 text-sm">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Suivant
                <ChevronDown className="h-4 w-4 rotate-90" />
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

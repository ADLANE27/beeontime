
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import { buildHREventQuery, generateEventPDF } from "./utils";
import { NewHREventDialog } from "./NewHREventDialog";
import { HREventDetails } from "./HREventDetails";
import { EventFilters } from "./EventFilters";
import { EventsTable } from "./EventsTable";
import { EventsPagination } from "./EventsPagination";
import { useSorting } from "./hooks/useSorting";

type EventCategory = Database["public"]["Enums"]["event_category"];

const ITEMS_PER_PAGE = 10;

export const HREventsList = () => {
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [selectedPeriod, setSelectedPeriod] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { sortField, sortOrder, handleSort } = useSorting("event_date", "desc");
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["hr-events", searchQuery, selectedCategory, selectedPeriod, sortField, sortOrder],
    queryFn: async () => {
      const query = buildHREventQuery(
        searchQuery,
        selectedCategory,
        selectedPeriod,
        sortField,
        sortOrder
      );

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

  const handleDownloadPDF = async (event: any, e: React.MouseEvent) => {
    e.stopPropagation();
    await generateEventPDF(event);
  };

  const totalPages = events ? Math.ceil(events.length / ITEMS_PER_PAGE) : 0;
  const paginatedEvents = events?.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsNewEventOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel événement
        </Button>
      </div>

      <EventFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />

      {isLoading ? (
        <div>Chargement...</div>
      ) : (
        <>
          <EventsTable 
            events={paginatedEvents || []}
            onEventSelect={setSelectedEvent}
            onDelete={handleDeleteEvent}
            onDownload={handleDownloadPDF}
            sortField={sortField}
            sortOrder={sortOrder}
            handleSort={handleSort}
          />

          <EventsPagination 
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
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

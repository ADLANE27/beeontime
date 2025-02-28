
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { toast } from "sonner";
import { EventEditForm } from "./EventEditForm";
import { EventDetailsView } from "./EventDetailsView";

interface HREventDetailsProps {
  eventId: string | null;
  onClose: () => void;
}

export const HREventDetails = ({ eventId, onClose }: HREventDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ["hr-event", eventId],
    queryFn: async () => {
      if (!eventId) return null;
      const { data, error } = await supabase
        .from("hr_events")
        .select(`
          *,
          employees (
            first_name,
            last_name
          ),
          documents:hr_event_documents (*)
        `)
        .eq("id", eventId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
  });

  const { mutate: updateEvent } = useMutation({
    mutationFn: async (updatedData: any) => {
      if (!eventId) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("hr_events")
        .update({ 
          ...updatedData, 
          updated_by: user.id,
          status: updatedData.status || 'open'
        })
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-events"] });
      queryClient.invalidateQueries({ queryKey: ["hr-event", eventId] });
      toast.success("Événement mis à jour avec succès");
      setIsEditing(false);
    },
    onError: (error) => {
      console.error("Error updating event:", error);
      toast.error("Erreur lors de la mise à jour de l'événement");
    },
  });

  const { mutate: deleteEvent } = useMutation({
    mutationFn: async () => {
      if (!eventId) return;
      const { error } = await supabase
        .from("hr_events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hr-events"] });
      toast.success("Événement supprimé avec succès");
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting event:", error);
      toast.error("Erreur lors de la suppression de l'événement");
    },
  });

  if (!eventId) return null;

  const handleFormSubmit = (formData: any) => {
    updateEvent(formData);
  };

  return (
    <Dialog open={!!eventId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Détails de l'événement</span>
            <div className="flex gap-2">
              {!isEditing && event && (
                <Button
                  variant="outline"
                  onClick={() => {
                    updateEvent({
                      status: event.status === 'open' ? 'closed' : 'open'
                    });
                  }}
                >
                  {event.status === 'open' ? 'Clôturer' : 'Réouvrir'}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? "Annuler" : "Modifier"}
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => {
                  if (confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
                    deleteEvent();
                  }
                }}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Chargement...</div>
        ) : event ? (
          isEditing ? (
            <EventEditForm event={event} onSubmit={handleFormSubmit} />
          ) : (
            <EventDetailsView event={event} />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

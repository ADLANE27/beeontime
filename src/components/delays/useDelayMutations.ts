
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface UseDelayMutationsProps {
  onSuccess?: () => void;
}

export const useDelayMutations = ({ onSuccess }: UseDelayMutationsProps = {}) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  // Fonction utilitaire pour calculer la durée du retard
  const calculateDelayDuration = (scheduledTime: string, actualTime: string) => {
    const scheduledTimeDate = new Date(`2000-01-01T${scheduledTime}`);
    const actualTimeDate = new Date(`2000-01-01T${actualTime}`);
    
    // S'assurer que les dates sont valides
    if (isNaN(scheduledTimeDate.getTime()) || isNaN(actualTimeDate.getTime())) {
      console.error("Invalid time format", { scheduledTime, actualTime });
      throw new Error("Format d'heure invalide");
    }
    
    const duration = actualTimeDate.getTime() - scheduledTimeDate.getTime();
    
    // S'assurer que la durée est positive
    if (duration < 0) {
      console.warn("Negative delay duration, actual time is earlier than scheduled time", {
        scheduledTime, 
        actualTime, 
        duration
      });
      // Retourner un délai de zéro dans ce cas
      return "00:00:00";
    }
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  const addDelayMutation = useMutation({
    mutationFn: async (newDelay: {
      employee_id: string;
      date: string;
      scheduled_time: string;
      actual_time: string;
      reason: string;
    }) => {
      if (!session) {
        console.error("No active session when trying to add delay");
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }
      
      console.log('Adding new delay:', newDelay);
      
      try {
        // Calculer la durée du retard
        const formattedDuration = calculateDelayDuration(
          newDelay.scheduled_time,
          newDelay.actual_time
        );

        const { error } = await supabase
          .from('delays')
          .insert({
            ...newDelay,
            duration: formattedDuration
          });

        if (error) {
          console.error('Error adding delay:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in addDelayMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delays'] });
      toast.success("Retard enregistré avec succès");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erreur lors de l'enregistrement du retard");
      console.error('Error adding delay:', error);
    }
  });

  const updateDelayMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      if (!session) {
        console.error("No active session when trying to update delay status");
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }
      
      console.log('Updating delay status:', { id, status });
      
      try {
        const { error } = await supabase
          .from('delays')
          .update({ status })
          .eq('id', id);
          
        if (error) {
          console.error('Error updating delay status:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in updateDelayMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delays'] });
      toast.success("Statut mis à jour avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du statut");
      console.error('Error updating delay status:', error);
    }
  });

  const editDelayMutation = useMutation({
    mutationFn: async (delay: {
      id: string;
      employee_id: string;
      date: string;
      scheduled_time: string;
      actual_time: string;
      reason: string;
    }) => {
      if (!session) {
        console.error("No active session when trying to edit delay");
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }
      
      console.log('Editing delay:', delay);
      
      try {
        // Calculer la durée du retard
        const formattedDuration = calculateDelayDuration(
          delay.scheduled_time,
          delay.actual_time
        );

        const { id, ...rest } = delay;
        const { error } = await supabase
          .from('delays')
          .update({ 
            ...rest,
            duration: formattedDuration,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) {
          console.error('Error editing delay:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in editDelayMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delays'] });
      toast.success("Retard modifié avec succès");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erreur lors de la modification du retard");
      console.error('Error editing delay:', error);
    }
  });

  const deleteDelayMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!session) {
        console.error("No active session when trying to delete delay");
        throw new Error("Vous devez être connecté pour effectuer cette action");
      }
      
      console.log('Deleting delay:', id);
      
      try {
        const { error } = await supabase
          .from('delays')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error('Error deleting delay:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in deleteDelayMutation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delays'] });
      toast.success("Retard supprimé avec succès");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression du retard");
      console.error('Error deleting delay:', error);
    }
  });

  return {
    addDelayMutation,
    updateDelayMutation,
    editDelayMutation,
    deleteDelayMutation
  };
};

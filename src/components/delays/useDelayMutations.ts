
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DelayData {
  id?: string;
  employee_id: string;
  date: string;
  scheduled_time: string;
  actual_time: string;
  reason: string;
}

type UpdateStatusParams = {
  id: string;
  status: 'approved' | 'rejected';
};

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

  // Verifier la session
  const checkSession = () => {
    if (!session) {
      console.error("No active session when trying to perform delay operation");
      throw new Error("Vous devez être connecté pour effectuer cette action");
    }
  };

  // Fonction générique pour gérer les erreurs et succès des mutations
  const createMutation = <T, R>(
    mutationFn: (data: T) => Promise<R>,
    successMessage: string,
    errorMessage: string
  ) => {
    return useMutation({
      mutationFn,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['delays'] });
        toast.success(successMessage);
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(errorMessage);
        console.error(`Error: ${errorMessage}`, error);
      }
    });
  };

  // Mutation pour ajouter un retard
  const addDelayMutation = createMutation(
    async (newDelay: DelayData) => {
      checkSession();
      console.log('Adding new delay:', newDelay);
      
      try {
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

        if (error) throw error;
      } catch (error) {
        console.error('Error in addDelayMutation:', error);
        throw error;
      }
    },
    "Retard enregistré avec succès",
    "Erreur lors de l'enregistrement du retard"
  );

  // Mutation pour mettre à jour le statut d'un retard
  const updateDelayMutation = createMutation(
    async ({ id, status }: UpdateStatusParams) => {
      checkSession();
      console.log('Updating delay status:', { id, status });
      
      try {
        const { error } = await supabase
          .from('delays')
          .update({ status })
          .eq('id', id);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error in updateDelayMutation:', error);
        throw error;
      }
    },
    "Statut mis à jour avec succès",
    "Erreur lors de la mise à jour du statut"
  );

  // Mutation pour modifier un retard
  const editDelayMutation = createMutation(
    async (delay: DelayData & { id: string }) => {
      checkSession();
      console.log('Editing delay:', delay);
      
      try {
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

        if (error) throw error;
      } catch (error) {
        console.error('Error in editDelayMutation:', error);
        throw error;
      }
    },
    "Retard modifié avec succès",
    "Erreur lors de la modification du retard"
  );

  // Mutation pour supprimer un retard
  const deleteDelayMutation = createMutation(
    async (id: string) => {
      checkSession();
      console.log('Deleting delay:', id);
      
      try {
        const { error } = await supabase
          .from('delays')
          .delete()
          .eq('id', id);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error in deleteDelayMutation:', error);
        throw error;
      }
    },
    "Retard supprimé avec succès",
    "Erreur lors de la suppression du retard"
  );

  return {
    addDelayMutation,
    updateDelayMutation,
    editDelayMutation,
    deleteDelayMutation
  };
};

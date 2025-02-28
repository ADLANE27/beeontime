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

  const calculateDelayDuration = (scheduledTime: string, actualTime: string) => {
    const scheduledTimeDate = new Date(`2000-01-01T${scheduledTime}`);
    const actualTimeDate = new Date(`2000-01-01T${actualTime}`);
    
    if (isNaN(scheduledTimeDate.getTime()) || isNaN(actualTimeDate.getTime())) {
      console.error("Invalid time format", { scheduledTime, actualTime });
      throw new Error("Format d'heure invalide");
    }
    
    const duration = actualTimeDate.getTime() - scheduledTimeDate.getTime();
    
    if (duration < 0) {
      console.warn("Negative delay duration, actual time is earlier than scheduled time", {
        scheduledTime, 
        actualTime, 
        duration
      });
      return "00:00:00";
    }
    
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };

  const checkSession = () => {
    if (!session) {
      console.error("No active session when trying to perform delay operation");
      throw new Error("Vous devez être connecté pour effectuer cette action");
    }
  };

  const handleRLSError = (error: any, message: string) => {
    console.error(`Error: ${message}`, error);
    
    if (error.code === 'PGRST301' || error.code === '42501') {
      toast.error("Vous n'avez pas les permissions nécessaires pour cette action");
    } else {
      toast.error(message);
    }
    
    throw error;
  };

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
      onError: (error: any) => {
        if (error.code === 'PGRST301') {
          toast.error("Vous n'avez pas les permissions nécessaires pour cette action");
        } else if (error.code === '42501') {
          toast.error("Erreur d'autorisation: Vérifiez vos permissions");
        } else {
          toast.error(errorMessage);
        }
        console.error(`Error: ${errorMessage}`, error);
      }
    });
  };

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

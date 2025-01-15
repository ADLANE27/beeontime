import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UseDelayMutationsProps {
  onSuccess?: () => void;
}

export const useDelayMutations = ({ onSuccess }: UseDelayMutationsProps = {}) => {
  const queryClient = useQueryClient();

  const addDelayMutation = useMutation({
    mutationFn: async (newDelay: any) => {
      console.log('Adding new delay:', newDelay);
      const { error } = await supabase
        .from('delays')
        .insert(newDelay);
      if (error) {
        console.error('Error adding delay:', error);
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
      console.log('Updating delay status:', { id, status });
      const { error } = await supabase
        .from('delays')
        .update({ status })
        .eq('id', id);
      if (error) {
        console.error('Error updating delay status:', error);
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

  return {
    addDelayMutation,
    updateDelayMutation
  };
};

import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

export function useErrorHandler() {
  const handleError = (error: unknown, customMessage?: string) => {
    console.error("Error occurred:", error);
    
    // Handle PostgrestError specifically
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const pgError = error as PostgrestError;
      
      // Handle common Supabase errors
      if (pgError.code === '23505') {
        toast.error("Une entrée avec ces informations existe déjà.");
        return;
      }
      
      if (pgError.code === '42501') {
        toast.error("Vous n'avez pas les permissions nécessaires pour cette opération.");
        return;
      }
      
      if (pgError.code === '23503') {
        toast.error("Cette opération ne peut pas être effectuée car des données liées existent.");
        return;
      }
      
      if (pgError.message) {
        toast.error(`Erreur: ${pgError.message}`);
        return;
      }
    }
    
    // Handle network errors
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error("Erreur de connexion. Vérifiez votre connexion internet.");
        return;
      }
      
      toast.error(error.message);
      return;
    }
    
    // Fallback error message
    toast.error(customMessage || "Une erreur inattendue s'est produite. Veuillez réessayer.");
  };
  
  return { handleError };
}

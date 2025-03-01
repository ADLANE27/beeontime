
import { useState } from "react";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";
import { createOrUpdateEmployee } from "@/services/employeeService";

export const useEmployeeSubmit = (onSuccess: () => void, isEditing?: boolean) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      await createOrUpdateEmployee(formData, isEditing);
      
      console.log('Employee created/updated successfully');
      toast.success(isEditing ? "Employé modifié avec succès" : "Employé créé avec succès");
      onSuccess();
    } catch (error: any) {
      console.error('Error during employee submission:', error);
      const errorMessage = error.message || "Une erreur inattendue est survenue";
      toast.error(errorMessage);
      
      // Add more user-friendly details for specific error cases
      if (errorMessage.includes("auth user") || errorMessage.includes("utilisateur")) {
        toast.error("Problème avec la création du compte utilisateur. Veuillez vérifier les logs pour plus de détails.");
      } else if (errorMessage.includes("profile")) {
        toast.error("Note: Le profil n'a pas pu être mis à jour, mais la fiche employé a été créée.");
      } else if (errorMessage.includes("existe déjà")) {
        toast.error("Un employé avec cet email existe déjà. Veuillez utiliser un email différent.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};


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
      toast.error(error.message || "Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};

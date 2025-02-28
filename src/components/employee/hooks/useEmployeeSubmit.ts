
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewEmployee } from "@/types/hr";
import { toast } from "sonner";

export const useEmployeeSubmit = (
  onSuccess: () => void, 
  isEditing: boolean = false,
  employeeId?: string
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (employeeData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      // Prepare data for Supabase
      const employeeRecord = {
        first_name: employeeData.firstName,
        last_name: employeeData.lastName,
        email: employeeData.email,
        phone: employeeData.phone,
        birth_date: employeeData.birthDate,
        birth_place: employeeData.birthPlace,
        birth_country: employeeData.birthCountry,
        social_security_number: employeeData.socialSecurityNumber,
        contract_type: employeeData.contractType,
        start_date: employeeData.startDate,
        position: employeeData.position,
        work_schedule: employeeData.workSchedule,
        current_year_vacation_days: employeeData.currentYearVacationDays,
        current_year_used_days: employeeData.currentYearUsedDays,
        previous_year_vacation_days: employeeData.previousYearVacationDays,
        previous_year_used_days: employeeData.previousYearUsedDays,
        initial_password: employeeData.initialPassword,
        street_address: employeeData.streetAddress,
        city: employeeData.city,
        postal_code: employeeData.postalCode,
        country: employeeData.country
      };

      let result;
      
      if (isEditing && employeeId) {
        // Update existing employee
        result = await supabase
          .from('employees')
          .update(employeeRecord)
          .eq('id', employeeId);
      } else {
        // Pour la création d'un nouvel employé, nous allons d'abord essayer d'insérer directement 
        // l'employé sans créer de profil, car il semble que le profil soit créé automatiquement 
        // par un trigger dans Supabase lors de la création d'un utilisateur dans auth.users
        
        // Generate UUID for the new employee
        const id = crypto.randomUUID();
        
        // Créer l'employé directement
        result = await supabase
          .from('employees')
          .insert({
            id,
            ...employeeRecord
          });
          
        // Si cela échoue en raison de la contrainte de clé étrangère, nous informons l'utilisateur
        if (result.error && result.error.message.includes('violates foreign key constraint')) {
          throw new Error(
            "Impossible de créer l'employé. Veuillez d'abord créer un compte utilisateur dans le système d'authentification."
          );
        }
      }
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Success!
      toast.success(
        isEditing 
          ? "Employé mis à jour avec succès" 
          : "Nouvel employé créé avec succès"
      );
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting employee data:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
};

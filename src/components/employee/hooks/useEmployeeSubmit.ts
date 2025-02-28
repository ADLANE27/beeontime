
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
          
        if (result.error) {
          throw new Error(result.error.message);
        }
      } else {
        // Create a new employee via special edge function that handles both auth and employee creation
        const response = await supabase.functions.invoke('create-employee', {
          body: {
            employeeData: {
              ...employeeRecord,
              password: employeeData.initialPassword
            }
          }
        });
        
        // Check for errors in the response
        if (response.error) {
          throw new Error(`Erreur lors de la création de l'employé: ${response.error.message}`);
        }
        
        if (!response.data?.success) {
          throw new Error(response.data?.message || "Une erreur inconnue s'est produite lors de la création de l'employé");
        }
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

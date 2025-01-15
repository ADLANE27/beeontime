import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: 'Welcome123!',
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError || !authData.user) {
        console.error('Auth error:', authError);
        toast.error("Erreur lors de la création du compte utilisateur");
        return;
      }

      const userId = authData.user.id;
      console.log('Auth user created:', userId);

      // 2. Create employee record with the same ID as the auth user
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
          id: userId, // Use the auth user's ID here
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email.toLowerCase(),
          phone: formData.phone,
          birth_date: formData.birthDate,
          birth_place: formData.birthPlace,
          birth_country: formData.birthCountry,
          social_security_number: formData.socialSecurityNumber,
          contract_type: formData.contractType,
          start_date: formData.startDate,
          position: formData.position,
          work_schedule: formData.workSchedule,
          previous_year_vacation_days: formData.previousYearVacationDays,
          used_vacation_days: formData.usedVacationDays,
          remaining_vacation_days: formData.remainingVacationDays
        });

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        toast.error("Erreur lors de la création de l'employé");
        return;
      }

      console.log('Employee created successfully');
      toast.success("Employé créé avec succès");
      onSuccess();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting
  };
};
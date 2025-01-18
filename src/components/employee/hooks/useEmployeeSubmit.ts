import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      console.log('Creating new employee with data:', formData);
      
      // First check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single();

      let userId: string;

      if (existingUser) {
        console.log('User already exists, using existing ID:', existingUser.id);
        userId = existingUser.id;
      } else {
        // Create auth user if they don't exist
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.toLowerCase(),
          password: formData.initialPassword,
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

        userId = authData.user.id;
        console.log('Auth user created:', userId);
      }

      // Create or update employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .upsert({
          id: userId,
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
          current_year_vacation_days: formData.currentYearVacationDays,
          current_year_used_days: formData.currentYearUsedDays,
          previous_year_vacation_days: formData.previousYearVacationDays,
          previous_year_used_days: formData.previousYearUsedDays,
          initial_password: formData.initialPassword
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
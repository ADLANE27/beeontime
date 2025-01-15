import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      // 1. Create auth user with a temporary password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.toLowerCase(),
        password: 'Welcome123!', // Temporary password
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      if (authError) {
        console.error('Auth error:', authError);
        toast.error("Erreur lors de la création du compte utilisateur");
        return;
      }

      if (!authData.user) {
        console.error('No user data returned from auth signup');
        toast.error("Erreur lors de la création du compte utilisateur");
        return;
      }

      const userId = authData.user.id;
      console.log('Auth user created successfully:', userId);

      // 2. Wait for profile creation (triggered by database)
      let profile = null;
      let attempts = 0;
      const maxAttempts = 5;
      
      while (attempts < maxAttempts && !profile) {
        console.log(`Attempt ${attempts + 1} to fetch profile...`);
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
          continue;
        }

        if (profileData) {
          profile = profileData;
          console.log('Profile found:', profile);
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      if (!profile) {
        console.error('Profile creation failed after', maxAttempts, 'attempts');
        toast.error("Erreur lors de la création du profil");
        return;
      }

      // 3. Create employee record
      const { error: employeeError } = await supabase
        .from('employees')
        .insert({
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
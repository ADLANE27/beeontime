import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      console.log('Starting employee creation process...', formData);
      
      // Check if user already exists
      const { data: existingUser, error: queryError } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', formData.email)
        .maybeSingle();

      if (queryError) {
        console.error('Profile query error:', queryError);
        toast.error("Erreur lors de la vérification de l'utilisateur");
        return;
      }

      if (existingUser) {
        console.log('User already exists:', existingUser);
        toast.error("Un utilisateur avec cet email existe déjà");
        return;
      }

      // Create auth user
      console.log('Creating auth user...');
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

      // Wait for profile creation
      console.log('Waiting for profile creation...');
      let profile = null;
      let attempts = 0;
      const maxAttempts = 10;
      const delayMs = 1000;

      while (attempts < maxAttempts) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('Profile check error:', profileError);
          break;
        }

        if (profileData) {
          profile = profileData;
          console.log('Profile created successfully:', profile);
          break;
        }

        console.log(`Profile not found yet, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        attempts++;
      }

      if (!profile) {
        console.error('Profile creation failed after', maxAttempts, 'attempts');
        toast.error("Erreur lors de la création du profil utilisateur");
        return;
      }

      // Create employee record
      console.log('Creating employee record...');
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

      console.log('Employee record created successfully');
      toast.success("Employé créé avec succès");
      onSuccess();
    } catch (error: any) {
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
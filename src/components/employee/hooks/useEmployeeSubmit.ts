import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      console.log('Starting employee creation process...');
      
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

      let authData;
      let authError;
      let retryCount = 0;
      const maxRetries = 3;
      const baseDelay = 60000; // 60 seconds base delay for rate limit

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} to create auth user...`);
          
          const result = await supabase.auth.signUp({
            email: formData.email.toLowerCase(),
            password: 'Welcome123!',
            options: {
              data: {
                first_name: formData.firstName,
                last_name: formData.lastName
              }
            }
          });
          
          authData = result.data;
          authError = result.error;

          if (!authError) {
            console.log('Auth user created successfully');
            break;
          }
          
          if (authError.message.includes('rate_limit') || 
              (authError as any)?.body?.includes('over_email_send_rate_limit')) {
            const delay = baseDelay * (retryCount + 1);
            console.log(`Rate limit hit. Waiting ${delay/1000} seconds before retry...`);
            toast.error(`Limite de création d'utilisateurs atteinte. Nouvelle tentative dans ${delay/1000} secondes...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue;
          }

          console.error('Non-rate-limit auth error:', authError);
          break;
        } catch (error) {
          console.error('Network error during auth:', error);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        }
      }

      if (authError) {
        console.error('Auth Error after retries:', authError);
        toast.error("Erreur lors de la création du compte utilisateur");
        return;
      }

      if (!authData?.user) {
        console.error('No user data returned from auth signup');
        toast.error("Erreur lors de la création du compte utilisateur");
        return;
      }

      const userId = authData.user.id;
      console.log('Auth user created successfully:', userId);

      let profile = null;
      let attempts = 0;
      const maxAttempts = 10;
      const delayMs = 2000;

      while (attempts < maxAttempts) {
        try {
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

          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempts++;
        } catch (error) {
          console.error('Network error during profile check:', error);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          attempts++;
        }
      }

      if (!profile) {
        console.error('Profile creation failed after', maxAttempts, 'attempts');
        toast.error("Erreur lors de la création du profil utilisateur. Veuillez réessayer plus tard.");
        return;
      }

      let employeeCreated = false;
      retryCount = 0;

      while (retryCount < maxRetries) {
        try {
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

          if (!employeeError) {
            employeeCreated = true;
            break;
          }

          console.error('Employee creation error:', employeeError);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        } catch (error) {
          console.error('Network error during employee creation:', error);
          await new Promise(resolve => setTimeout(resolve, 2000));
          retryCount++;
        }
      }

      if (!employeeCreated) {
        console.error('Employee creation failed after retries');
        toast.error("Erreur lors de la création de l'employé. Veuillez réessayer plus tard.");
        return;
      }

      console.log('Employee created successfully');
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
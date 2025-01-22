import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void, isEditing?: boolean) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      console.log('Creating/Updating employee with data:', formData);
      
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
        
        // Only update password if it's provided and we're not in edit mode
        if (!isEditing && formData.initialPassword) {
          const { error: authError } = await supabase.functions.invoke('update-user-password', {
            body: { userId, password: formData.initialPassword }
          });

          if (authError) {
            console.error('Error updating password:', authError);
            toast.error("Erreur lors de la mise à jour du mot de passe");
            return;
          }
        }
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
          phone: formData.phone || null,
          birth_date: formData.birthDate || null,
          birth_place: formData.birthPlace || null,
          birth_country: formData.birthCountry || null,
          social_security_number: formData.socialSecurityNumber || null,
          contract_type: formData.contractType || null,
          start_date: formData.startDate || null,
          position: formData.position || null,
          work_schedule: formData.workSchedule || null,
          current_year_vacation_days: formData.currentYearVacationDays || 0,
          current_year_used_days: formData.currentYearUsedDays || 0,
          previous_year_vacation_days: formData.previousYearVacationDays || 0,
          previous_year_used_days: formData.previousYearUsedDays || 0,
          initial_password: formData.initialPassword,
          street_address: formData.streetAddress || null,
          city: formData.city || null,
          postal_code: formData.postalCode || null,
          country: formData.country || 'France'
        });

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        toast.error("Erreur lors de la création de l'employé");
        return;
      }

      console.log('Employee created/updated successfully');
      toast.success(isEditing ? "Employé modifié avec succès" : "Employé créé avec succès");
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
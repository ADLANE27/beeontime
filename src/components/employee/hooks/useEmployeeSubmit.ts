
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
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single();

      // Check if auth user exists
      const { data: { users }, error: getUserError } = await supabase.functions.invoke('update-user-password', {
        body: { 
          email: formData.email.toLowerCase(),
          checkOnly: true
        }
      });
      
      console.log('Auth user check result:', users);
      
      if (getUserError) {
        console.error('Error checking user existence:', getUserError);
        toast.error("Erreur lors de la vérification de l'utilisateur");
        return;
      }

      let userId: string;
      let authUserExists = users && users.length > 0;

      // Handle logic based on whether profile and auth user exist
      if (existingProfile && authUserExists) {
        // Both profile and auth user exist
        console.log('User exists in both profile and auth, using existing ID:', existingProfile.id);
        userId = existingProfile.id;
        
        // Only update password if it's provided and we're not in edit mode
        if (!isEditing && formData.initialPassword) {
          const { error: authError } = await supabase.functions.invoke('update-user-password', {
            body: { 
              userId, 
              password: formData.initialPassword,
              email: formData.email.toLowerCase()
            }
          });

          if (authError) {
            console.error('Error updating password:', authError);
            toast.error("Erreur lors de la mise à jour du mot de passe");
            return;
          }
        }
      } else if (existingProfile && !authUserExists) {
        // Profile exists but auth user doesn't - create auth user with the same ID if possible
        console.log('Profile exists but auth user does not');
        
        const { data: authData, error: authError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            email: formData.email.toLowerCase(),
            password: formData.initialPassword || 'Welcome123!', // Fallback password
            preferredId: existingProfile.id,
            firstName: formData.firstName,
            lastName: formData.lastName,
            createIfNotExists: true
          }
        });

        if (authError) {
          console.error('Error creating auth user:', authError);
          toast.error("Erreur lors de la création du compte utilisateur");
          return;
        }

        userId = authData.id;
        console.log('Auth user created with ID:', userId);
        
        // If IDs don't match, sync them
        if (userId !== existingProfile.id) {
          console.log('Syncing IDs from', existingProfile.id, 'to', userId);
          const { error: syncError } = await supabase.rpc('sync_employee_ids', {
            old_id: existingProfile.id,
            new_id: userId
          });
          
          if (syncError) {
            console.error('Error syncing IDs:', syncError);
            toast.error("Erreur lors de la synchronisation des identifiants");
            return;
          }
        }
      } else if (!existingProfile && authUserExists) {
        // Auth user exists but profile doesn't - use auth user ID
        userId = users[0].id;
        console.log('Auth user exists but profile does not, using auth ID:', userId);
      } else {
        // Neither exists - create both
        if (!formData.initialPassword) {
          toast.error("Un mot de passe initial est requis pour créer un nouvel utilisateur");
          setIsSubmitting(false);
          return;
        }
        
        const { data: authData, error: authError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            email: formData.email.toLowerCase(),
            password: formData.initialPassword,
            firstName: formData.firstName,
            lastName: formData.lastName,
            createIfNotExists: true
          }
        });

        if (authError || !authData) {
          console.error('Auth error:', authError);
          toast.error("Erreur lors de la création du compte utilisateur");
          return;
        }

        userId = authData.id;
        console.log('New auth user created with ID:', userId);
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

      // Update profile record to ensure first/last name synced
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: formData.email.toLowerCase(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'employee'
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Not critical, continue
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

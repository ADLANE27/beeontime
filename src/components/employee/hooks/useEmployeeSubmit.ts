import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewEmployee } from "@/types/hr";

export const useEmployeeSubmit = (onSuccess: () => void, isEditing?: boolean) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: NewEmployee) => {
    setIsSubmitting(true);
    try {
      console.log('Creating/Updating employee with data:', { 
        ...formData,
        initialPassword: formData.initialPassword ? `[Password provided, length: ${formData.initialPassword.length}]` : 'None'
      });
      
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', formData.email.toLowerCase())
        .single();

      // Explicitly check if auth user exists using email
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
        setIsSubmitting(false);
        return;
      }

      let userId: string;
      let authUserExists = users && users.length > 0;
      
      // Find matching user by email in the auth users list
      const matchingUser = authUserExists ? 
        users.find((user: any) => user.email.toLowerCase() === formData.email.toLowerCase()) : 
        null;

      // Handle logic based on whether profile and auth user exist
      if (existingProfile && matchingUser) {
        // Both profile and auth user exist
        console.log('User exists in both profile and auth, using existing ID:', existingProfile.id);
        userId = existingProfile.id;
        
        // Only update password if it's provided and we're not in edit mode
        if (!isEditing && formData.initialPassword) {
          console.log('Updating password for existing user:', userId);
          const { data: authData, error: authError } = await supabase.functions.invoke('update-user-password', {
            body: { 
              userId, 
              password: formData.initialPassword,
              email: formData.email.toLowerCase()
            }
          });

          if (authError) {
            console.error('Error updating password:', authError);
            toast.error("Erreur lors de la mise à jour du mot de passe");
            setIsSubmitting(false);
            return;
          }
          
          console.log('Password update result:', authData);
        }
      } else if (existingProfile && !matchingUser) {
        // Profile exists but auth user doesn't
        console.log('Profile exists but auth user does not');
        
        if (!formData.initialPassword) {
          toast.error("Un mot de passe initial est requis pour créer un nouvel utilisateur");
          setIsSubmitting(false);
          return;
        }
        
        console.log('Creating auth user with email:', formData.email.toLowerCase());
        const { data: authData, error: authError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            email: formData.email.toLowerCase(),
            password: formData.initialPassword,
            firstName: formData.firstName,
            lastName: formData.lastName,
            createIfNotExists: true
          }
        });

        if (authError) {
          console.error('Error creating auth user:', authError);
          toast.error("Erreur lors de la création du compte utilisateur");
          setIsSubmitting(false);
          return;
        }

        if (!authData || !authData.id) {
          console.error('No user ID returned after creation');
          toast.error("Erreur lors de la création du compte utilisateur: ID non retourné");
          setIsSubmitting(false);
          return;
        }

        userId = authData.id;
        console.log('Auth user created with ID:', userId);
        
        // We need to handle two cases:
        // 1. Delete the existing profile and create a new one with the auth ID
        // 2. Or keep the existing profile structure but update references
        
        // Option 1: Delete and recreate - simpler and less error-prone
        console.log('Deleting existing profile with ID:', existingProfile.id);
        const { error: deleteProfileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', existingProfile.id);
          
        if (deleteProfileError) {
          console.error('Error deleting old profile:', deleteProfileError);
          toast.error("Erreur lors de la mise à jour du profil");
          setIsSubmitting(false);
          return;
        }
        
        // We'll create a new profile with the auth ID below
      } else if (!existingProfile && matchingUser) {
        // Auth user exists but profile doesn't - use auth user ID
        userId = matchingUser.id;
        console.log('Auth user exists but profile does not, using auth ID:', userId);
        
        // Still update password if provided and we're not in edit mode
        if (!isEditing && formData.initialPassword) {
          console.log('Updating password for existing auth user:', userId);
          const { data: authData, error: authError } = await supabase.functions.invoke('update-user-password', {
            body: { 
              userId, 
              password: formData.initialPassword,
              email: formData.email.toLowerCase()
            }
          });

          if (authError) {
            console.error('Error updating password:', authError);
            toast.error("Erreur lors de la mise à jour du mot de passe");
            setIsSubmitting(false);
            return;
          }
          
          console.log('Password update result:', authData);
        }
      } else {
        // Neither exists - create both
        if (!formData.initialPassword) {
          toast.error("Un mot de passe initial est requis pour créer un nouvel utilisateur");
          setIsSubmitting(false);
          return;
        }
        
        console.log('Creating new auth user with password length:', formData.initialPassword.length);
        console.log('Email:', formData.email.toLowerCase());
        
        const { data: authData, error: authError } = await supabase.functions.invoke('update-user-password', {
          body: { 
            email: formData.email.toLowerCase(),
            password: formData.initialPassword,
            firstName: formData.firstName,
            lastName: formData.lastName,
            createIfNotExists: true
          }
        });

        if (authError) {
          console.error('Auth error:', authError);
          toast.error("Erreur lors de la création du compte utilisateur");
          setIsSubmitting(false);
          return;
        }

        if (!authData || !authData.id) {
          console.error('No user ID returned after creation, response:', authData);
          toast.error("Erreur lors de la création du compte utilisateur: ID non retourné");
          setIsSubmitting(false);
          return;
        }

        userId = authData.id;
        console.log('New auth user created with ID:', userId);
      }

      // CRITICAL: Create or update profile record BEFORE employee record
      // This ensures the profile always exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: formData.email.toLowerCase(),
          first_name: formData.firstName,
          last_name: formData.lastName,
          role: 'employee'
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Profile creation/update error:', profileError);
        toast.error("Erreur lors de la mise à jour du profil");
        setIsSubmitting(false);
        return;
      }
      
      console.log('Profile created/updated with ID:', userId);

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
          street_address: formData.streetAddress || null,
          city: formData.city || null,
          postal_code: formData.postalCode || null,
          country: formData.country || 'France'
        }, { onConflict: 'id' });

      if (employeeError) {
        console.error('Employee creation error:', employeeError);
        toast.error("Erreur lors de la création de l'employé");
        setIsSubmitting(false);
        return;
      }
      
      console.log('Employee record created/updated with ID:', userId);

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


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

      if (isEditing && employeeId) {
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(employeeRecord)
          .eq('id', employeeId);
          
        if (error) {
          throw new Error(error.message);
        }
        
        toast.success("Employé mis à jour avec succès");
        onSuccess();
      } else {
        // For new employee creation
        // Step 1: Create auth user using the standard signUp method
        console.log("Creating auth user for:", employeeData.email);
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email: employeeData.email,
          password: employeeData.initialPassword,
          options: {
            data: {
              first_name: employeeData.firstName,
              last_name: employeeData.lastName
            }
          }
        });
        
        if (signUpError) {
          console.error("Error creating auth user:", signUpError);
          
          // Special handling for duplicate email error
          if (signUpError.message.includes("duplicate")) {
            throw new Error(`Un utilisateur avec l'email ${employeeData.email} existe déjà`);
          }
          
          throw new Error(`Erreur lors de la création du compte: ${signUpError.message}`);
        }
        
        if (!signUpData.user) {
          throw new Error("Erreur lors de la création du compte: aucun utilisateur retourné");
        }
        
        console.log("Auth user created successfully:", signUpData.user.id);
        
        // Use the ID returned from auth
        const userId = signUpData.user.id;
        
        // Step 2: Create the employee record
        console.log("Creating employee record with ID:", userId);
        const { error: employeeError } = await supabase
          .from('employees')
          .insert({
            ...employeeRecord,
            id: userId
          });
        
        if (employeeError) {
          console.error("Error creating employee:", employeeError);
          
          // Try to clean up the auth user if employee creation fails
          try {
            // We cannot delete the user from the client side, but we can mark it for future cleanup
            console.log("Employee creation failed - user needs to be cleaned up:", userId);
          } catch (cleanupError) {
            console.error("Failed to clean up auth user:", cleanupError);
          }
          
          throw new Error(`Erreur lors de la création de l'employé: ${employeeError.message}`);
        }
        
        console.log("Employee record created successfully");
        
        // Step 3: Update the profile entry
        console.log("Creating/updating profile with ID:", userId);
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: employeeData.email,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            role: 'employee'
          });
        
        if (profileError) {
          console.error("Error updating profile:", profileError);
          
          throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
        }
        
        console.log("Profile created/updated successfully");
        console.log(`
          Employee created successfully:
          ID: ${userId}
          Email: ${employeeData.email}
          Password: ${employeeData.initialPassword}
          
          User has been created in Supabase Auth and can log in immediately.
        `);
        
        toast.success("Nouvel employé créé avec succès");
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error submitting employee data:', error);
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit, isSubmitting };
};

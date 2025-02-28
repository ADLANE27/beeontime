
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewEmployee } from "@/types/hr";
import { toast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

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
        const newUserId = uuidv4();
        console.log("Generated new user ID:", newUserId);
        
        // Step 1: Create Auth user first
        console.log("Creating auth user for:", employeeData.email);
        const { error: authError, data: authData } = await supabase.auth.admin.createUser({
          email: employeeData.email,
          password: employeeData.initialPassword,
          email_confirm: true,
          user_metadata: {
            first_name: employeeData.firstName,
            last_name: employeeData.lastName
          },
          id: newUserId
        });
        
        if (authError) {
          console.error("Error creating auth user:", authError);
          
          // Special handling for duplicate email error
          if (authError.message.includes("duplicate")) {
            throw new Error(`Un utilisateur avec l'email ${employeeData.email} existe déjà`);
          }
          
          throw new Error(`Erreur lors de la création du compte: ${authError.message}`);
        }
        
        console.log("Auth user created successfully:", authData?.user?.id);
        
        // Use the ID returned from auth
        const userId = authData?.user?.id || newUserId;
        
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
            await supabase.auth.admin.deleteUser(userId);
            console.log("Cleaned up auth user after employee creation failure");
          } catch (cleanupError) {
            console.error("Failed to clean up auth user:", cleanupError);
          }
          
          throw new Error(`Erreur lors de la création de l'employé: ${employeeError.message}`);
        }
        
        console.log("Employee record created successfully");
        
        // Step 3: Create the profile entry
        console.log("Creating profile with ID:", userId);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: employeeData.email,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            role: 'employee'
          });
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          
          // Clean up the employee record and auth user if profile creation fails
          try {
            await supabase
              .from('employees')
              .delete()
              .eq('id', userId);
            
            await supabase.auth.admin.deleteUser(userId);
            console.log("Cleaned up after profile creation failure");
          } catch (cleanupError) {
            console.error("Failed to clean up after profile error:", cleanupError);
          }
          
          throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
        }
        
        console.log("Profile created successfully");
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

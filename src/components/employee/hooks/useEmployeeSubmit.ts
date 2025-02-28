
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
        // For new employee creation, we need to use a different approach
        // Since we don't have admin rights in the frontend
        
        // Generate UUID for the new user
        const newUserId = uuidv4();
        console.log("Generated new user ID:", newUserId);
        
        // First create the employee record with this ID
        console.log("Creating employee with ID:", newUserId);
        const { data: employeeResult, error: employeeError } = await supabase
          .from('employees')
          .insert({
            ...employeeRecord,
            id: newUserId
          })
          .select();
        
        if (employeeError) {
          console.error("Error creating employee:", employeeError);
          throw new Error(`Erreur lors de la création de l'employé: ${employeeError.message}`);
        }
        
        console.log("Employee created successfully:", employeeResult);
        
        // Create a profile entry with the same ID
        console.log("Creating profile with ID:", newUserId);
        const { data: profileResult, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: newUserId,
            email: employeeData.email,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            role: 'employee'
          })
          .select();
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          
          // Try to clean up the employee record we just created
          console.log("Attempting to delete employee after profile creation failure");
          const { error: cleanupError } = await supabase
            .from('employees')
            .delete()
            .eq('id', newUserId);
            
          if (cleanupError) {
            console.error("Error cleaning up employee:", cleanupError);
          }
          
          throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
        }
        
        console.log("Profile created successfully:", profileResult);
        
        // We should create a signup-link for the user instead of direct auth creation
        // This would be sent to them via email, but for now we'll just log it
        console.log(`
          A user was created with:
          Email: ${employeeData.email}
          Password: ${employeeData.initialPassword}
          
          They should be able to sign in with these credentials after an admin activates their account.
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

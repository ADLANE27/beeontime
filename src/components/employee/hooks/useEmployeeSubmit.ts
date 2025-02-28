
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
        // For new employee creation, we'll first try to sign up a new user through auth
        
        // First, try to create a user in auth
        console.log("Creating a new user for:", employeeData.email);
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: employeeData.email,
          password: employeeData.initialPassword,
          email_confirm: true,
          user_metadata: {
            first_name: employeeData.firstName,
            last_name: employeeData.lastName
          }
        });
        
        if (authError) {
          console.error("Error creating user in auth:", authError);
          throw new Error(`Erreur lors de la création de l'utilisateur: ${authError.message}`);
        }
        
        if (!authData.user) {
          throw new Error("Échec de la création du compte utilisateur");
        }
        
        console.log("Auth user created successfully:", authData.user.id);
        
        // Now we can create the employee record with the user's ID
        const userId = authData.user.id;
        
        console.log("Creating employee with ID:", userId);
        const { data: employeeResult, error: employeeError } = await supabase
          .from('employees')
          .insert({
            ...employeeRecord,
            id: userId
          })
          .select();
        
        if (employeeError) {
          console.error("Error creating employee:", employeeError);
          // We should try to clean up the auth user we just created to avoid orphaned records
          console.log("Attempting to delete auth user after employee creation failure");
          const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
          
          if (deleteUserError) {
            console.error("Error cleaning up auth user:", deleteUserError);
          }
          
          throw new Error(`Erreur lors de la création de l'employé: ${employeeError.message}`);
        }
        
        console.log("Employee created successfully:", employeeResult);
        
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

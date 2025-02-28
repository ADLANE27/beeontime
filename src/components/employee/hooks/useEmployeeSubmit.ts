
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
        // For new employee creation, we need a transaction-like approach
        
        // Generate UUID for the new user
        const newUserId = uuidv4();
        console.log("Generated new user ID:", newUserId);
        
        // First create a profile entry
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
          throw new Error(`Erreur lors de la création du profil: ${profileError.message}`);
        }
        
        console.log("Profile created successfully:", profileResult);
        
        // Verify profile was created
        const { data: verifyProfile, error: verifyError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newUserId)
          .single();
        
        if (verifyError || !verifyProfile) {
          console.error("Profile verification failed:", verifyError);
          throw new Error(`Erreur de vérification du profil: ${verifyError?.message || "Profil non trouvé"}`);
        }
        
        console.log("Profile verified, creating employee with ID:", newUserId);
        
        // Then create the employee record with the same ID
        const { data: employeeResult, error: employeeError } = await supabase
          .from('employees')
          .insert({
            ...employeeRecord,
            id: newUserId
          })
          .select();
        
        if (employeeError) {
          console.error("Error creating employee:", employeeError);
          // Try to clean up the profile we just created to avoid orphaned records
          const { error: cleanupError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', newUserId);
            
          if (cleanupError) {
            console.error("Error cleaning up profile:", cleanupError);
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

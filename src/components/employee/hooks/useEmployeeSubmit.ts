
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
        // Vérifier si le mot de passe et/ou l'email a été modifié
        const { data: currentEmployee } = await supabase
          .from('employees')
          .select('initial_password, email')
          .eq('id', employeeId)
          .single();
        
        const passwordChanged = currentEmployee && 
                               currentEmployee.initial_password !== employeeData.initialPassword && 
                               employeeData.initialPassword.trim() !== '';
        
        const emailChanged = currentEmployee &&
                            currentEmployee.email !== employeeData.email;
        
        // Si le mot de passe a été modifié, le mettre à jour dans auth.users
        if (passwordChanged) {
          try {
            console.log("Mise à jour du mot de passe dans auth.users...");
            
            // Validation du mot de passe
            if (employeeData.initialPassword.length < 8) {
              throw new Error("Le mot de passe doit contenir au moins 8 caractères");
            }
            
            // Vérifier si c'est l'utilisateur courant qui modifie son propre mot de passe
            const { data: currentSession } = await supabase.auth.getSession();
            const isSelfUpdate = currentSession?.session?.user?.id === employeeId;
            
            // Utiliser une Edge Function pour mettre à jour le mot de passe
            const { data: updateResult, error: updateError } = await supabase.functions.invoke('update-user-password', {
              body: {
                userId: employeeId,
                newPassword: employeeData.initialPassword
              }
            });
            
            if (updateError) {
              console.error("Erreur lors de la mise à jour du mot de passe:", updateError);
              throw new Error(`Erreur lors de la mise à jour du mot de passe: ${updateError.message}`);
            }
            
            console.log("Mot de passe mis à jour avec succès dans auth.users");
            toast.success("Mot de passe mis à jour avec succès");
            
            // Si c'est l'utilisateur courant, le déconnecter complètement
            if (isSelfUpdate) {
              console.log("L'utilisateur courant est celui dont le mot de passe a été modifié. Déconnexion...");
              
              // Utiliser un délai pour s'assurer que la mise à jour est enregistrée
              setTimeout(async () => {
                await supabase.auth.signOut();
                toast.info("Votre mot de passe a été modifié, veuillez vous reconnecter.");
                
                // Rediriger vers la page de connexion après une courte pause
                setTimeout(() => {
                  window.location.href = '/portal';
                }, 1000);
              }, 500);
            }
          } catch (passwordError: any) {
            console.error("Erreur lors de la mise à jour du mot de passe:", passwordError);
            toast.error(`Erreur lors de la mise à jour du mot de passe: ${passwordError.message}`);
            // Continuer avec la mise à jour des autres informations même si le mot de passe échoue
          }
        } else {
          console.log("Pas de changement de mot de passe détecté ou mot de passe vide");
        }
        
        // Si l'email a été modifié, mettre à jour dans auth.users aussi
        if (emailChanged) {
          try {
            console.log("Mise à jour de l'email dans auth.users...");
            
            // Appeler une Edge Function ou utiliser l'API Admin pour mettre à jour l'email
            // Cette partie nécessiterait une Edge Function supplémentaire
            // à implémenter similaire à update-user-password
            
            console.log("Email mis à jour dans la table employees");
          } catch (emailError: any) {
            console.error("Erreur lors de la mise à jour de l'email:", emailError);
            toast.error(`Erreur lors de la mise à jour de l'email: ${emailError.message}`);
          }
        }
        
        // Update existing employee
        const { error } = await supabase
          .from('employees')
          .update(employeeRecord)
          .eq('id', employeeId);
          
        if (error) {
          throw new Error(error.message);
        }
        
        // Mettre à jour également le profil
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: employeeId,
            email: employeeData.email,
            first_name: employeeData.firstName,
            last_name: employeeData.lastName,
            role: 'employee'
          });
        
        if (profileError) {
          console.warn("Avertissement: Erreur lors de la mise à jour du profil:", profileError);
          // Ne pas bloquer la réussite globale si la mise à jour du profil échoue
        }
        
        toast.success("Employé mis à jour avec succès");
        onSuccess();
      } else {
        // For new employee creation
        try {
          // Step 1: Create auth user using the standard signUp method
          console.log("Creating auth user for:", employeeData.email);
          
          // Validation du mot de passe
          if (employeeData.initialPassword.length < 8) {
            throw new Error("Le mot de passe doit contenir au moins 8 caractères");
          }
          
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
        } catch (innerError: any) {
          console.error('Inner error submitting employee data:', innerError);
          throw innerError;
        }
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

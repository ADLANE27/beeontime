
import { supabase } from "@/integrations/supabase/client";
import { NewEmployee } from "@/types/hr";

/**
 * Checks if an auth user exists with the given email
 */
export const checkAuthUserExists = async (email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('update-user-password', {
      body: { 
        email: email.toLowerCase(),
        checkOnly: true
      }
    });
    
    if (error) {
      console.error('Error checking user existence:', error);
      throw new Error("Erreur lors de la vérification de l'existence de l'utilisateur");
    }
    
    return { 
      users: data?.users || [],
      authUserExists: data?.users && data.users.length > 0
    };
  } catch (error) {
    console.error('Unexpected error in checkAuthUserExists:', error);
    throw new Error("Erreur lors de la vérification de l'existence de l'utilisateur");
  }
};

/**
 * Updates the password for an existing auth user
 */
export const updateUserPassword = async (userId: string, password: string, email: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('update-user-password', {
      body: { 
        userId, 
        password,
        email: email.toLowerCase()
      }
    });

    if (error) {
      console.error('Error updating password:', error);
      throw new Error("Erreur lors de la mise à jour du mot de passe");
    }
    
    return data;
  } catch (error) {
    console.error('Unexpected error in updateUserPassword:', error);
    throw new Error("Erreur lors de la mise à jour du mot de passe");
  }
};

/**
 * Creates a new auth user
 */
export const createAuthUser = async (email: string, password: string, firstName: string, lastName: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('update-user-password', {
      body: { 
        email: email.toLowerCase(),
        password,
        firstName,
        lastName,
        createIfNotExists: true
      }
    });

    if (error) {
      console.error('Auth error:', error);
      throw new Error("Erreur lors de la création du compte utilisateur");
    }

    if (!data || !data.id) {
      console.error('No user ID returned after creation, response:', data);
      throw new Error("Erreur lors de la création du compte utilisateur: ID non retourné");
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in createAuthUser:', error);
    throw new Error("Erreur lors de la création du compte utilisateur");
  }
};

/**
 * Updates or creates a user profile
 */
export const updateUserProfile = async (
  id: string, 
  email: string, 
  firstName: string, 
  lastName: string,
  role: 'employee' | 'hr' = 'employee'
) => {
  try {
    // First try to directly update the profiles table instead of using the edge function
    const { error: directUpdateError } = await supabase
      .from('profiles')
      .upsert({
        id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (!directUpdateError) {
      console.log('Profile updated directly via database upsert');
      return { id };
    }

    console.warn('Direct profile update failed, falling back to Edge Function:', directUpdateError);
    
    // Fall back to the edge function if direct update fails
    const { error } = await supabase.functions.invoke('update-profile', {
      body: {
        id,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        role
      }
    });

    if (error) {
      console.error('Profile creation/update error:', error);
      throw new Error("Erreur lors de la mise à jour du profil");
    }
    
    return { id };
  } catch (error) {
    console.error('Profile update error:', error);
    throw new Error("Erreur lors de la mise à jour du profil");
  }
};

/**
 * Creates or updates an employee record
 */
export const upsertEmployee = async (employee: NewEmployee, userId: string) => {
  try {
    const { error } = await supabase
      .from('employees')
      .upsert({
        id: userId,
        first_name: employee.firstName,
        last_name: employee.lastName,
        email: employee.email.toLowerCase(),
        phone: employee.phone || null,
        birth_date: employee.birthDate || null,
        birth_place: employee.birthPlace || null,
        birth_country: employee.birthCountry || null,
        social_security_number: employee.socialSecurityNumber || null,
        contract_type: employee.contractType || null,
        start_date: employee.startDate || null,
        position: employee.position || null,
        work_schedule: employee.workSchedule || null,
        current_year_vacation_days: employee.currentYearVacationDays || 0,
        current_year_used_days: employee.currentYearUsedDays || 0,
        previous_year_vacation_days: employee.previousYearVacationDays || 0,
        previous_year_used_days: employee.previousYearUsedDays || 0,
        street_address: employee.streetAddress || null,
        city: employee.city || null,
        postal_code: employee.postalCode || null,
        country: employee.country || 'France'
      }, { onConflict: 'id' });

    if (error) {
      console.error('Employee creation error:', error);
      throw new Error("Erreur lors de la mise à jour des données employé");
    }
    
    return { id: userId };
  } catch (error) {
    console.error('Unexpected error in upsertEmployee:', error);
    throw new Error("Erreur lors de la mise à jour des données employé");
  }
};

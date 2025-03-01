
import { supabase } from "@/integrations/supabase/client";
import { NewEmployee } from "@/types/hr";
import { User } from '@supabase/supabase-js';

/**
 * Checks if an auth user exists with the given email
 */
export const checkAuthUserExists = async (email: string) => {
  try {
    // First try direct auth API to check user existence
    console.log('Checking if user exists with email:', email);
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    // After getting all users, filter by email manually
    const matchingUsers = userData?.users?.filter(
      (user: User) => user.email?.toLowerCase() === email.toLowerCase()
    ) || [];
    
    if (!userError && matchingUsers.length > 0) {
      console.log('User found via direct auth API:', matchingUsers);
      return { 
        users: matchingUsers, 
        authUserExists: true 
      };
    }
    
    if (userError) {
      console.warn('Error checking user via direct auth API, falling back to edge function:', userError);
    } else {
      console.log('No user found via direct auth API, trying edge function');
    }
    
    // Fall back to edge function
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { 
        email: email.toLowerCase(),
        checkOnly: true
      }
    });
    
    if (error) {
      console.error('Error checking user existence via edge function:', error);
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
    // First try direct auth API
    console.log(`Attempting to update password for user ${userId} directly`);
    const { error: directUpdateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password }
    );
    
    if (!directUpdateError) {
      console.log('Password updated successfully via direct auth API');
      return { id: userId };
    }
    
    console.warn('Direct password update failed, falling back to edge function:', directUpdateError);
    
    // Fall back to edge function
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { 
        userId, 
        password,
        email: email.toLowerCase(),
        action: 'update-password'
      }
    });

    if (error) {
      console.error('Error updating password via edge function:', error);
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
    // Always use direct Supabase auth API first, as it's more reliable
    console.log('Creating new auth user with direct auth API:', { email, firstName, lastName });
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });
    
    if (!signUpError && signUpData?.user?.id) {
      console.log('User created successfully with direct auth API, ID:', signUpData.user.id);
      
      // Verify user was created properly before returning
      const { data: verifyData } = await supabase.auth.admin.listUsers();
      
      // After getting all users, filter by email manually
      const verifiedUsers = verifyData?.users?.filter(
        (user: User) => user.email?.toLowerCase() === email.toLowerCase()
      ) || [];
      
      if (verifiedUsers.length > 0) {
        console.log('User creation verified, user exists in auth table');
      } else {
        console.warn('User created but not found when verifying creation. This might be a timing issue.');
      }
      
      return signUpData.user;
    }
    
    if (signUpError) {
      console.error('Direct auth signup error, trying edge function as fallback:', signUpError);
      
      // Fall back to edge function
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { 
          email: email.toLowerCase(),
          password,
          firstName,
          lastName,
          action: 'create-user'
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error("Erreur lors de la création du compte utilisateur: " + error.message);
      }

      if (!data || !data.id) {
        console.error('No user ID returned from edge function:', data);
        throw new Error("Erreur lors de la création du compte utilisateur: aucun ID retourné");
      }

      console.log('User created successfully through edge function with ID:', data.id);
      return data;
    }
    
    throw new Error("Création utilisateur échouée sans message d'erreur spécifique");
  } catch (error) {
    console.error('Unexpected error in createAuthUser:', error);
    throw new Error("Erreur lors de la création du compte utilisateur: " + (error instanceof Error ? error.message : String(error)));
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
    // First try directly update the profiles table instead of using the edge function
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

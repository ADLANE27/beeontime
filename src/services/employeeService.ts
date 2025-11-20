
import { NewEmployee } from "@/types/hr";
import { 
  checkAuthUserExists, 
  createAuthUser, 
  updateUserPassword, 
  updateUserProfile, 
  upsertEmployee 
} from "@/api/employee";

/**
 * Creates or updates an employee with all related records
 */
export const createOrUpdateEmployee = async (formData: NewEmployee, isEditing = false) => {
  // Sanitize email to lowercase
  const email = formData.email.toLowerCase();
  
  console.log('Creating/Updating employee with data:', { 
    email: formData.email,
    firstName: formData.firstName,
    lastName: formData.lastName
  });
  
  try {
    // Check if auth user exists using email
    const { users, authUserExists } = await checkAuthUserExists(email);
    console.log('Auth user check result:', users);
    
    let userId: string;
    
    // Find matching user by email in the auth users list
    const matchingUser = authUserExists ? 
      users.find((user: any) => user.email.toLowerCase() === email) : 
      null;

    if (matchingUser) {
      // Auth user exists - use the existing ID
      userId = matchingUser.id;
      console.log('Auth user exists, using existing ID:', userId);
      
      // Only update password if it's provided and we're in edit mode
      if (formData.initialPassword && formData.initialPassword.trim() !== '') {
        console.log('Updating password for existing user:', userId);
        await updateUserPassword(userId, formData.initialPassword, email);
        console.log('Password updated successfully');
      }
    } else {
      // Create new auth user
      if (!formData.initialPassword || formData.initialPassword.trim() === '') {
        throw new Error("Un mot de passe initial est requis pour créer un nouvel utilisateur");
      }
      
      console.log('Creating new auth user with email:', email);
      try {
        const authData = await createAuthUser(
          email, 
          formData.initialPassword,
          formData.firstName, 
          formData.lastName
        );

        userId = authData.id;
        console.log('New auth user created with ID:', userId);
        
        // Double check if user was actually created
        const { users: verifyUsers } = await checkAuthUserExists(email);
        if (!verifyUsers || verifyUsers.length === 0) {
          console.error('User was reportedly created but cannot be found in auth users list');
          throw new Error("L'utilisateur a été créé mais n'a pas pu être vérifié. Veuillez réessayer ou contacter l'administrateur.");
        }
      } catch (error) {
        console.error('Failed to create auth user:', error);
        throw new Error(`Erreur lors de la création de l'utilisateur: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    try {
      // Only update profile if we're creating a new user or if it's an editing operation
      if (!matchingUser || isEditing) {
        console.log('Creating/updating profile with ID:', userId);
        await updateUserProfile(userId, email, formData.firstName, formData.lastName);
        console.log('Profile created/updated with ID:', userId);
      }
    } catch (profileError) {
      console.error('Profile update failed, but proceeding with employee record creation:', profileError);
      // We'll continue with employee creation even if profile update fails
    }

    // Create or update employee record
    await upsertEmployee(formData, userId);
    console.log('Employee record created/updated with ID:', userId);
    
    return { userId };
  } catch (error) {
    console.error('Error in createOrUpdateEmployee:', error);
    throw error;
  }
};

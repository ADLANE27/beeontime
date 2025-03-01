
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Creates a fallback profile when network issues prevent fetching the real one
 * @param userId The user ID to create a fallback profile for
 * @returns A basic fallback profile
 */
function createFallbackProfile(userId: string, email?: string, role?: string): Profile {
  console.log("Creating fallback profile for user:", userId);
  
  // Force role to HR for known admin email
  if (email === "a.debassi@aftraduction.fr") {
    console.log("Creating HR profile for known admin email:", email);
    return {
      id: userId,
      role: "hr", 
      email: email || "",
      first_name: "",
      last_name: ""
    };
  }
  
  // Ensure role is either "employee" or "hr"
  const validRole: "employee" | "hr" = role === "hr" ? "hr" : "employee";
  
  return {
    id: userId,
    role: validRole, // Now using type-safe role
    email: email || "",
    first_name: "",
    last_name: ""
  };
}

/**
 * Determines if an email address belongs to an HR user based on common patterns
 * @param email The email address to check
 * @returns True if the email matches HR patterns
 */
function isHrEmail(email: string): boolean {
  if (!email) return false;
  
  email = email.toLowerCase();
  
  // Check explicitly for a.debassi first
  if (email === "a.debassi@aftraduction.fr") {
    console.log("Admin email detected:", email);
    return true;
  }
  
  // HR-specific email patterns
  return email.startsWith("rh@") || 
         email.startsWith("hr@") ||
         email.includes(".rh@") || 
         email.includes(".hr@");
}

/**
 * Ensures the admin profile exists in the database
 * @param userId The user ID to create profile for
 * @param email The admin email
 */
async function ensureAdminProfile(userId: string, email: string): Promise<Profile> {
  console.log("Ensuring admin profile exists for:", email, "userId:", userId);
  
  try {
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Error checking for existing profile:", fetchError);
      // Return a fallback profile with HR role
      return createFallbackProfile(userId, email, "hr");
    }
    
    if (existingProfile) {
      console.log("Existing profile found:", existingProfile);
      
      // Update role to HR if not already
      if (existingProfile.role !== "hr") {
        console.log("Updating existing profile to HR role");
        const { error } = await supabase
          .from("profiles")
          .update({ role: "hr" })
          .eq("id", userId);
          
        if (error) {
          console.error("Failed to update profile to HR:", error);
        } else {
          console.log("Successfully updated profile to HR role");
          // Return updated profile
          return {
            ...existingProfile,
            role: "hr"
          };
        }
      }
      
      return existingProfile as Profile;
    } else {
      // Create new HR profile
      console.log("No profile found, creating new HR profile");
      const newProfile = {
        id: userId,
        email: email,
        role: "hr" as const,
        first_name: "",
        last_name: ""
      };
      
      const { error } = await supabase
        .from("profiles")
        .insert(newProfile);
        
      if (error) {
        console.error("Failed to create HR profile:", error);
        return createFallbackProfile(userId, email, "hr");
      } else {
        console.log("Successfully created HR profile");
        return newProfile;
      }
    }
  } catch (err) {
    console.error("Error in ensureAdminProfile:", err);
    return createFallbackProfile(userId, email, "hr");
  }
}

/**
 * Checks if a user is the admin by ID and updates their profile if needed
 */
export async function checkAndUpdateAdminUser(userId: string): Promise<boolean> {
  console.log("Checking if user is admin by ID:", userId);
  
  try {
    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting user or no user found:", userError);
      return false;
    }
    
    // If this is the specific admin ID
    if (userId === "1b5ca1ab-4bf0-4fff-a15e-00ac039143a5" || 
        user.email === "a.debassi@aftraduction.fr") {
      console.log("Admin user confirmed by ID or email");
      await ensureAdminProfile(userId, user.email || "");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error in checkAndUpdateAdminUser:", error);
    return false;
  }
}

/**
 * Fetches a user profile by checking both profiles and employees tables
 * @param userId The user ID to fetch the profile for
 * @returns The profile data or null if not found in either table
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.error("Cannot fetch profile: userId is empty");
    return null;
  }

  console.log("Attempting to fetch profile for user:", userId);
  
  // Special admin user handling - always check first
  if (userId === "1b5ca1ab-4bf0-4fff-a15e-00ac039143a5") {
    console.log("Special admin user detected by ID:", userId);
    const isAdmin = await checkAndUpdateAdminUser(userId);
    if (isAdmin) {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      
      if (adminProfile) {
        console.log("Admin profile loaded:", adminProfile);
        return {
          ...adminProfile,
          role: "hr" // Force HR role for this specific user
        } as Profile;
      }
    }
  }
  
  try {
    // Try to get auth user for email determination first
    const { data: { user } } = await supabase.auth.getUser();
    
    // Special case for a.debassi admin email
    if (user && user.email === "a.debassi@aftraduction.fr") {
      console.log("Admin user detected, ensuring profile");
      const adminProfile = await ensureAdminProfile(userId, user.email);
      return adminProfile;
    }
    
    // Faster direct approach - query both tables at once
    const [profilesResult, employeesResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("employees").select("id, first_name, last_name, email").eq("id", userId).maybeSingle()
    ]);
    
    // Check if we got a profile from profiles table
    if (profilesResult.data && !profilesResult.error) {
      console.log("Profile found in profiles table:", profilesResult.data.role);
      return profilesResult.data as Profile;
    }
    
    // Check if we got an employee record
    if (employeesResult.data && !employeesResult.error) {
      console.log("Employee record found, returning it as profile");
      
      // Create a profile from employee data
      return {
        id: employeesResult.data.id,
        role: "employee", // Default role for employees
        first_name: employeesResult.data.first_name,
        last_name: employeesResult.data.last_name,
        email: employeesResult.data.email
      };
    }
    
    // If we get here, no profile was found in either table
    console.log("No profile found for user:", userId);
    
    if (!user || !user.email) {
      console.log("No auth user found, using minimal fallback");
      return createFallbackProfile(userId, undefined, "employee");
    }
    
    console.log("Using auth user email for role determination:", user.email);
    
    // If admin email is recognized, create an HR profile and save it
    if (isHrEmail(user.email)) {
      const hrProfile = await ensureAdminProfile(userId, user.email);
      return hrProfile;
    }
    
    // For non-HR users, return employee fallback
    return createFallbackProfile(userId, user.email, "employee");
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    // Try to get auth user for better fallback profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // For known admin emails, create HR profile
        const role: "employee" | "hr" = isHrEmail(user.email || "") ? "hr" : "employee";
        return createFallbackProfile(userId, user.email, role);
      }
    } catch (e) {
      console.warn("Could not get user email for fallback profile");
    }
    
    // Return a basic fallback profile with minimal data
    return createFallbackProfile(userId, undefined, "employee");
  }
}

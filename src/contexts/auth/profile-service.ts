
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Creates a fallback profile when network issues prevent fetching the real one
 * @param userId The user ID to create a fallback profile for
 * @returns A basic fallback profile
 */
function createFallbackProfile(userId: string, email?: string, role?: string): Profile {
  console.log("Creating fallback profile for user:", userId);
  return {
    id: userId,
    role: role || "employee", // Default conservative role
    email: email || "",
    first_name: "",
    last_name: ""
  };
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
  
  try {
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
    
    // Try to get auth user for better fallback profile
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if user has a specific email domain to determine role
    let role = "employee";
    if (user?.email?.includes("@aftraduction.fr")) {
      // Try to detect HR email
      if (user.email.startsWith("rh@") || user.email.startsWith("hr@") || 
          user.email.includes(".rh@") || user.email.includes(".hr@")) {
        role = "hr";
      }
    }
    
    // Return a fallback profile with intelligent role guess
    return createFallbackProfile(userId, user?.email, role);
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    // Try to get auth user for better fallback profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return createFallbackProfile(userId, user.email);
      }
    } catch (e) {
      console.warn("Could not get user email for fallback profile");
    }
    
    // Return a basic fallback profile with minimal data
    return createFallbackProfile(userId);
  }
}

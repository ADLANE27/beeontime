
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Fetches a user profile from the profiles table
 * @param userId The user ID to fetch the profile for
 * @returns The profile data or null if not found
 */
async function fetchProfileFromProfilesTable(userId: string): Promise<Profile | null> {
  try {
    console.log("Attempting to fetch profile from profiles table for:", userId);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching from profiles table:", error);
      throw new Error(`Failed to fetch from profiles table: ${error.message}`);
    }
    
    if (data) {
      console.log("Profile found in profiles table:", data.role);
    } else {
      console.log("No profile found in profiles table for user:", userId);
    }
    
    return data as Profile | null;
  } catch (error) {
    console.error("Network error fetching profile from profiles table:", error);
    throw error; // Let the caller handle this error or retry
  }
}

/**
 * Fetches employee data and converts it to a profile format
 * @param userId The user ID to fetch the employee data for
 * @returns The profile data created from employee data or null if not found
 */
async function fetchProfileFromEmployeesTable(userId: string): Promise<Profile | null> {
  try {
    console.log("Attempting to fetch employee data for:", userId);
    
    // Important: Select only columns that actually exist in the employees table
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching from employees table:", error);
      throw new Error(`Failed to fetch from employees table: ${error.message}`);
    }
    
    if (!data) {
      console.log("No employee record found for user:", userId);
      return null;
    }
    
    console.log("Employee record found:", data);
    
    // Create a profile from employee data
    return {
      id: data.id,
      role: "employee", // Default role for employees - 'role' doesn't exist in employees table
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email
    };
  } catch (error) {
    console.error("Network error fetching from employees table:", error);
    throw error; // Let the caller handle this error or retry
  }
}

/**
 * Creates a fallback profile when network issues prevent fetching the real one
 * @param userId The user ID to create a fallback profile for
 * @returns A basic fallback profile
 */
function createFallbackProfile(userId: string, email?: string): Profile {
  console.log("Creating fallback profile for user:", userId);
  return {
    id: userId,
    role: "employee", // Default conservative role
    email: email || ""
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
    // First try the profiles table with a direct approach for speed
    const profileData = await fetchProfileFromProfilesTable(userId);
    if (profileData) {
      console.log("Profile found in profiles table, returning it");
      return profileData;
    }
    
    // If no profile found, try the employees table as fallback
    console.log("No profile found, checking employees table");
    const employeeData = await fetchProfileFromEmployeesTable(userId);
    if (employeeData) {
      console.log("Employee record found, returning it as profile");
      return employeeData;
    }
    
    // If we get here, no profile was found in either table
    console.log("No profile found for user:", userId);
    
    // Get auth user email if available - for better fallback profile
    let userEmail = "";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    } catch (e) {
      console.warn("Could not get user email for fallback profile");
    }
    
    // Return a fallback profile with minimal data
    return createFallbackProfile(userId, userEmail);
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    // Get auth user email if available - for better fallback profile
    let userEmail = "";
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    } catch (e) {
      console.warn("Could not get user email for fallback profile");
    }
    
    // Return a fallback profile with minimal data
    return createFallbackProfile(userId, userEmail);
  }
}

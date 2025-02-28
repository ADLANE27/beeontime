
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Fetches a user profile from the profiles table
 * @param userId The user ID to fetch the profile for
 * @returns The profile data or null if not found
 */
async function fetchProfileFromProfilesTable(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching from profiles table:", error);
    throw new Error(`Failed to fetch from profiles table: ${error.message}`);
  }
  
  return data as Profile | null;
}

/**
 * Fetches employee data and converts it to a profile format
 * @param userId The user ID to fetch the employee data for
 * @returns The profile data created from employee data or null if not found
 */
async function fetchProfileFromEmployeesTable(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, email")
    .eq("id", userId)
    .maybeSingle();
    
  if (error) {
    console.error("Error fetching from employees table:", error);
    throw new Error(`Failed to fetch from employees table: ${error.message}`);
  }
  
  if (!data) return null;
  
  // Create a profile from employee data
  return {
    id: data.id,
    role: "employee", // Default role for employees
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email
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

  try {
    console.log("Attempting to fetch profile for user:", userId);
    
    // First try the profiles table
    const profileData = await fetchProfileFromProfilesTable(userId);
    if (profileData) {
      console.log("Profile found in profiles table");
      return profileData;
    }
    
    // If no profile found, try the employees table as fallback
    console.log("No profile found, checking employees table");
    const employeeData = await fetchProfileFromEmployeesTable(userId);
    if (employeeData) {
      console.log("Employee record found");
      return employeeData;
    }
    
    // No profile found in either table
    console.log("No profile found in either table");
    return null;
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    throw error; // Re-throw to allow proper handling upstream
  }
}

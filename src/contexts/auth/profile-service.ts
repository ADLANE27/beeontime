
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.error("Cannot fetch profile: userId is empty");
    return null;
  }

  try {
    console.log("Attempting to fetch profile for user:", userId);
    
    // First try the profiles table
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Error fetching from profiles table:", profileError);
      throw profileError;
    }

    if (profileData) {
      console.log("Profile found in profiles table");
      return profileData as Profile;
    }
    
    // If no profile found, try the employees table
    console.log("No profile found, checking employees table");
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();
      
    if (employeeError) {
      console.error("Error fetching from employees table:", employeeError);
      throw employeeError;
    }
    
    if (employeeData) {
      console.log("Employee record found");
      // Create a profile from employee data
      return {
        id: employeeData.id,
        role: "employee", // Default role for employees
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email
      };
    }
    
    // No profile found in either table
    console.log("No profile found in either table");
    return null;
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    return null;
  }
}

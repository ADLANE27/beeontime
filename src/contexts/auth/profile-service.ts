
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    // Try to get profile from the profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }

    // If profile was found, return it
    if (data) {
      return data as Profile;
    } 
    
    // Try fallback to employees table
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (employeeError) {
      console.error("Error in employee fallback fetch:", employeeError);
      throw employeeError;
    }
    
    if (employeeData) {
      // Create a profile-like object from employee data
      return {
        id: employeeData.id,
        role: "employee", // Default role for employees
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email
      };
    }
    
    // If no profile found in either table, return minimal fallback profile
    return {
      id: userId,
      role: "employee", // Default fallback role
      email: "",
      first_name: "",
      last_name: ""
    };
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    // Return a minimal profile to prevent login loops
    return {
      id: userId,
      role: "employee", // Default fallback role
      email: "",
      first_name: "",
      last_name: ""
    };
  }
}

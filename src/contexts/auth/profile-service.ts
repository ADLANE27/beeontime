
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    console.log("Fetching profile for user:", userId);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }

    if (data) {
      console.log("Profile data retrieved:", {
        id: data.id,
        role: data.role
      });
      return data as Profile;
    } 
    
    console.log("No profile found in profiles table, checking employees table...");
    // Try fallback to employees table if profile not found
    const { data: employeeData, error: employeeError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (employeeError) {
      console.error("Error in employee fallback fetch:", employeeError);
    }
    
    if (employeeData) {
      console.log("Employee data found as fallback");
      // Create a profile-like object from employee data
      const profileFromEmployee: Profile = {
        id: employeeData.id,
        role: "employee", // Default role for employees
        first_name: employeeData.first_name,
        last_name: employeeData.last_name,
        email: employeeData.email
      };
      return profileFromEmployee;
    }
    
    // Minimal fallback profile
    console.log("Creating minimal fallback profile");
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

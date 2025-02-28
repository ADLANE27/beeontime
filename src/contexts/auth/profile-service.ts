
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

export async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    console.log("Fetching profile for user:", userId);
    
    // Add a small delay to ensure supabase is properly initialized
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
        role: data.role,
        email: data.email,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim()
      });
      return data as Profile;
    } else {
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
      
      // If all else fails, get user info from auth and create a minimal profile
      try {
        console.log("Attempting to create minimal profile from auth data");
        const { data: userData, error: userError } = await supabase.auth.getUser(userId);
        
        if (userError) {
          console.error("Error getting user auth data:", userError);
        }
        
        if (userData?.user) {
          const email = userData.user.email;
          console.log("Created minimal profile from auth data with email:", email);
          return {
            id: userId,
            role: "employee", // Default role
            email: email || "",
            first_name: "",
            last_name: ""
          };
        }
      } catch (authError) {
        console.error("Error creating minimal profile from auth:", authError);
      }
      
      // Last resort fallback - create a minimal profile without attempting to fetch email
      console.log("Creating absolute minimal fallback profile");
      return {
        id: userId,
        role: "employee", // Default fallback role
        email: "",
        first_name: "",
        last_name: ""
      };
    }
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    // Return a minimal profile to prevent login loops
    console.log("Returning emergency fallback profile due to error");
    return {
      id: userId,
      role: "employee", // Default fallback role
      email: "",
      first_name: "",
      last_name: ""
    };
  }
}

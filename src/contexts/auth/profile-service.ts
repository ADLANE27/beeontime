
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
        role: data.role,
        email: data.email,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim()
      });
      return data as Profile;
    } else {
      console.log("No profile found for user:", userId);
      // Try fallback to employees table if profile not found
      const { data: employeeData, error: employeeError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
        
      if (employeeError) {
        console.error("Error in employee fallback fetch:", employeeError);
        return null;
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
      
      // If all else fails, create a minimal profile from auth data
      try {
        const { data: userData } = await supabase.auth.getUser(userId);
        if (userData?.user) {
          console.log("Creating minimal profile from auth data");
          return {
            id: userData.user.id,
            role: "employee", // Default role
            email: userData.user.email || "",
            first_name: "",
            last_name: ""
          };
        }
      } catch (authError) {
        console.error("Error getting user from auth:", authError);
      }
      
      return null;
    }
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    return null;
  }
}

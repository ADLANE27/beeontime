
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Creates a fallback profile when network issues prevent fetching the real one
 * @param userId The user ID to create a fallback profile for
 * @returns A basic fallback profile
 */
function createFallbackProfile(userId: string, email?: string, role?: string): Profile {
  console.log("Creating fallback profile for user:", userId);
  
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
  
  // HR-specific email patterns
  return email.startsWith("rh@") || 
         email.startsWith("hr@") ||
         email.includes(".rh@") || 
         email.includes(".hr@") ||
         email === "a.debassi@aftraduction.fr"; // Adding known admin email
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
    
    if (!user || !user.email) {
      console.log("No auth user found, using minimal fallback");
      return createFallbackProfile(userId, undefined, "employee");
    }
    
    console.log("Using auth user email for role determination:", user.email);
    
    // If admin email is recognized, create an HR profile and save it
    if (isHrEmail(user.email)) {
      const hrProfile: Profile = {
        id: userId,
        role: "hr",
        email: user.email,
        first_name: "",
        last_name: ""
      };
      
      // Try to save this profile to the database for future logins
      try {
        const { error } = await supabase.from("profiles").insert({
          id: userId,
          email: user.email,
          role: "hr"
        });
        
        if (error) {
          console.error("Failed to save HR profile:", error);
        } else {
          console.log("Successfully created HR profile in database");
        }
      } catch (err) {
        console.error("Error saving HR profile:", err);
      }
      
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

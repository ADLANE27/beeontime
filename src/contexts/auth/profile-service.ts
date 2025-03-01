
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
    role: validRole,
    email: email || "",
    first_name: "",
    last_name: ""
  };
}

/**
 * Determines if an email address belongs to an HR user based on common patterns
 */
function isHrEmail(email: string): boolean {
  if (!email) return false;
  
  email = email.toLowerCase();
  
  // Known admin email
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
 * Quick method to create/update an admin profile
 */
async function ensureAdminProfile(userId: string, email: string): Promise<Profile> {
  console.log("Quick admin profile setup for:", email);
  
  try {
    // Check for existing profile
    const { data: existingProfile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) throw error;
    
    if (existingProfile) {
      // If profile exists but not HR, update it
      if (existingProfile.role !== "hr") {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ role: "hr" })
          .eq("id", userId);
        
        if (updateError) throw updateError;
        
        return { ...existingProfile, role: "hr" };
      }
      
      return existingProfile as Profile;
    }
    
    // Create new profile - fixing the type issue by ensuring email is always provided
    const newProfile = {
      id: userId,
      email: email, // Ensure email is always present and not optional
      role: "hr",
      first_name: "",
      last_name: ""
    };
    
    const { error: insertError } = await supabase
      .from("profiles")
      .insert(newProfile);
      
    if (insertError) throw insertError;
    
    return newProfile as Profile;
  } catch (error) {
    console.error("Error in ensureAdminProfile:", error);
    return createFallbackProfile(userId, email, "hr");
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

  console.log("Fetching profile for user:", userId);
  
  try {
    // Try to get auth user for email determination first
    const { data: { user } } = await supabase.auth.getUser();
    
    // Special case for known admin email - fast path
    if (user && user.email === "a.debassi@aftraduction.fr") {
      console.log("Admin user detected, returning HR profile");
      return await ensureAdminProfile(userId, user.email);
    }
    
    // Try to get profile from database
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (!error && profile) {
      console.log("Profile found in database:", profile.role);
      return profile as Profile;
    }
    
    // If no profile in profiles table, check employees table
    const { data: employee, error: employeeError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, email")
      .eq("id", userId)
      .maybeSingle();
      
    if (!employeeError && employee) {
      console.log("Employee record found, creating profile");
      return {
        id: employee.id,
        role: "employee",
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email
      };
    }
    
    // If we get here, no profile was found
    console.log("No profile found for user:", userId);
    
    if (user && user.email) {
      console.log("Using email for role determination:", user.email);
      
      // Check if HR email
      if (isHrEmail(user.email)) {
        return await ensureAdminProfile(userId, user.email);
      }
      
      // Return employee fallback for non-HR users
      return createFallbackProfile(userId, user.email, "employee");
    }
    
    // Last resort fallback
    return createFallbackProfile(userId, undefined, "employee");
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    
    // Try to get user email for better fallback
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user && user.email) {
        const role = isHrEmail(user.email) ? "hr" : "employee";
        return createFallbackProfile(userId, user.email, role);
      }
    } catch (e) {
      console.warn("Could not get user email for fallback profile");
    }
    
    // Basic fallback
    return createFallbackProfile(userId, undefined, "employee");
  }
}

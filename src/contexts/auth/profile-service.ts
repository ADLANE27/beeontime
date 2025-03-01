
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "./types";

/**
 * Fetches a user profile from the profiles table
 * @param userId The user ID to fetch the profile for
 * @returns The profile data or null if not found
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  if (!userId) {
    console.error("Cannot fetch profile: userId is empty");
    return null;
  }

  console.log("Fetching profile for user:", userId);
  
  try {
    // Simple profile fetch from database
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    
    if (profile) {
      console.log("Profile found:", profile.role);
      return profile as Profile;
    }
    
    console.log("No profile found for user:", userId);
    return null;
    
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
}

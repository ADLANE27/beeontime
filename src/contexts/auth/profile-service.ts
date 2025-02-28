
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
      return null;
    }

    if (data) {
      console.log("Profile data retrieved:", data);
      return data as Profile;
    } else {
      console.log("No profile found for user:", userId);
      return null;
    }
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    return null;
  }
}

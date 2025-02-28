
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Profile } from "./types";

export async function fetchProfile(userId: string, forceRefresh = false): Promise<Profile | null> {
  try {
    console.log("Fetching profile for user:", userId, forceRefresh ? "(forced refresh)" : "");
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      toast.error("Erreur lors du chargement du profil utilisateur");
      return null;
    }

    if (data) {
      console.log("Profile data retrieved:", data);
      return data as Profile;
    } else {
      console.log("No profile found for user:", userId);
      
      // Tentative de création d'un profil par défaut si aucun n'existe
      if (forceRefresh) {
        const userData = await supabase.auth.getUser();
        if (userData.data?.user) {
          const email = userData.data.user.email;
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: email,
              role: "employee" // Rôle par défaut
            });
            
          if (insertError) {
            console.error("Error creating default profile:", insertError);
            toast.error("Impossible de créer un profil utilisateur par défaut");
            return null;
          }
          
          // Récupérer le profil nouvellement créé
          const { data: newProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();
            
          console.log("Created default profile:", newProfile);
          return newProfile as Profile;
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error("Exception in fetchProfile:", error);
    toast.error("Erreur lors de la récupération du profil");
    return null;
  }
}


import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

interface RequestBody {
  userId: string;
  newPassword: string;
}

serve(async (req) => {
  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Créer un client Supabase avec le rôle de service (permissions admin)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer le corps de la requête
    const { userId, newPassword } = await req.json() as RequestBody;

    // Validation des paramètres
    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: "userId et newPassword sont requis" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validation du mot de passe
    if (newPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: "Le mot de passe doit contenir au moins 8 caractères" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Mise à jour du mot de passe dans auth.users
    const { error } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Succès
    return new Response(
      JSON.stringify({ success: true, message: "Mot de passe mis à jour avec succès" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exception dans update-user-password:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

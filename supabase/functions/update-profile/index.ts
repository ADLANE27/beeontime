
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.14';

interface ProfileUpdateRequest {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the service role key - needed to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get the request body
    const requestData: ProfileUpdateRequest = await req.json();
    console.log("Profile update request:", requestData);

    if (!requestData.id || !requestData.email) {
      return new Response(
        JSON.stringify({ error: "User ID and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Prepare the profile data
    const profileData = {
      id: requestData.id,
      email: requestData.email.toLowerCase(),
      ...(requestData.first_name && { first_name: requestData.first_name }),
      ...(requestData.last_name && { last_name: requestData.last_name }),
      ...(requestData.role && { role: requestData.role }),
    };

    // Update or create the profile using upsert with service role (bypasses RLS)
    const { data, error } = await supabaseClient
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (error) {
      console.error("Error updating profile:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("Profile updated successfully:", requestData.id);
    return new Response(
      JSON.stringify({ success: true, message: "Profile updated successfully" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

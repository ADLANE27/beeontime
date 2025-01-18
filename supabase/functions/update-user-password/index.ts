import { serve } from 'https://deno.fresh.dev/std@v9.6.1/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { userId, password } = await req.json();
    console.log('Updating password for user:', userId);

    // Initialize Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Update the user's password
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: password }
    );

    if (error) {
      console.error('Error updating password:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Password updated successfully');
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (err) {
    console.error('Error in update-user-password function:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
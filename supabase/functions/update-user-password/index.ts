
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { userId, password, email } = await req.json()

    console.log('Received request to update password for user:', userId, 'with email:', email);

    // First check if the user exists in auth system
    const { data: authUser, error: authCheckError } = await supabaseClient.auth.admin.getUserById(userId);
    
    if (authCheckError || !authUser.user) {
      console.log('User not found in auth system, attempting to create auth user');
      
      // Create the auth user if they don't exist
      if (email) {
        const { data: newAuthData, error: createError } = await supabaseClient.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { recovery_mode: true }
        });
        
        if (createError) {
          console.error('Error creating auth user:', createError);
          return new Response(
            JSON.stringify({ error: `Error creating auth user: ${createError.message}` }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
            }
          );
        }
        
        // If the created ID doesn't match our expected ID, we need to update records
        if (newAuthData.user && newAuthData.user.id !== userId) {
          console.log('Created user with different ID. Created:', newAuthData.user.id, 'Expected:', userId);
          
          // Option 1: Update the profiles and employees table to use the new ID
          const { error: updateError } = await supabaseClient.rpc('sync_employee_ids', {
            old_id: userId,
            new_id: newAuthData.user.id
          });
          
          if (updateError) {
            console.error('Error updating IDs:', updateError);
            return new Response(
              JSON.stringify({ error: `Error updating IDs: ${updateError.message}` }),
              {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
              }
            );
          }
          
          return new Response(
            JSON.stringify({ message: 'Auth user created and IDs synced successfully', newId: newAuthData.user.id }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        
        return new Response(
          JSON.stringify({ message: 'Auth user created successfully' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Email is required to create auth user' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }

    console.log('Updating password for existing auth user');
    
    // If user exists, update password
    const { error } = await supabaseClient.auth.admin.updateUserById(
      userId,
      { password: password }
    )

    if (error) {
      console.error('Error updating password:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({ message: 'Password updated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})

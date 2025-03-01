
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

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
    // Create Supabase client with admin privileges
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const requestData = await req.json();
    const { email, password, firstName, lastName, action, userId, checkOnly } = requestData;
    
    console.log('Received request:', { 
      email, 
      passwordProvided: !!password, 
      userId,
      firstName, 
      lastName, 
      action,
      checkOnly 
    });
    
    // Just check if user exists
    if (checkOnly && email) {
      console.log(`Checking if user exists with email ${email}`);
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('Error listing users:', error);
        throw error;
      }
      
      // Filter users by email
      const matchingUsers = users?.users?.filter(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      ) || [];
      
      console.log(`Found ${matchingUsers.length} matching users`);
      
      return new Response(
        JSON.stringify({ users: matchingUsers }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Update existing user password
    if (action === 'update-password' && userId && password) {
      console.log(`Updating password for user ${userId}`);
      
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      );
      
      if (error) {
        console.error('Error updating password:', error);
        throw error;
      }
      
      console.log('Password updated successfully');
      
      return new Response(
        JSON.stringify({ id: userId, email }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Create new user
    if (action === 'create-user' && email && password) {
      console.log(`Creating new user with email ${email}`);
      
      // Check if user already exists
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('Error listing users:', listError);
        throw listError;
      }
      
      // Filter users by email
      const existingUsers = listData?.users?.filter(user => 
        user.email?.toLowerCase() === email.toLowerCase()
      ) || [];
      
      if (existingUsers.length > 0) {
        console.log(`User with email ${email} already exists`);
        
        // Update password if needed
        if (password) {
          const userId = existingUsers[0].id;
          console.log(`Updating password for existing user ${userId}`);
          
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            userId,
            { password }
          );
          
          if (updateError) {
            console.error('Error updating password:', updateError);
            throw updateError;
          }
        }
        
        return new Response(
          JSON.stringify({ 
            id: existingUsers[0].id, 
            email: existingUsers[0].email,
            created: false,
            message: 'User already exists'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
      
      // Create new user with userMetadata
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      });
      
      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }
      
      if (!userData?.user) {
        throw new Error('Failed to create user: No user data returned');
      }
      
      console.log(`User created successfully with ID ${userData.user.id}`);
      
      // Verify user was created
      const { data: verifyData, error: verifyError } = await supabase.auth.admin.getUserById(
        userData.user.id
      );
      
      if (verifyError) {
        console.error('Error verifying user creation:', verifyError);
      } else {
        console.log('User creation verified:', verifyData);
      }
      
      return new Response(
        JSON.stringify({ 
          id: userData.user.id, 
          email: userData.user.email,
          created: true,
          message: 'User created successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // If we got here, the request was invalid
    return new Response(
      JSON.stringify({ 
        error: 'Invalid request. Required parameters missing or action not supported.',
        receivedParams: { email, action, userId }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

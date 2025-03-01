
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
    const { email, password, userId, preferredId, firstName, lastName, createIfNotExists, checkOnly } = requestData;
    
    console.log('Received request:', { 
      email, 
      passwordProvided: !!password, 
      userId, 
      preferredId, 
      firstName, 
      lastName, 
      createIfNotExists, 
      checkOnly 
    });
    
    // Just check if user exists
    if (checkOnly && email) {
      try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({
          filters: {
            email: email
          }
        });
        
        console.log('Check only results:', { 
          usersFound: users?.length, 
          error: error?.message 
        });
        
        return new Response(
          JSON.stringify({ users }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        console.error('Error during user check:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }
    
    // Update existing user's password
    if (userId) {
      // Get the user's email if not provided
      let userEmail = email;
      try {
        if (!userEmail) {
          const { data: { users } } = await supabase.auth.admin.listUsers({
            filters: {
              id: userId,
            },
          });
          
          if (users && users.length > 0) {
            userEmail = users[0].email;
          } else {
            throw new Error('User not found');
          }
        }
        
        console.log(`Updating password for user ${userId} with email ${userEmail}`);
        
        // Update password
        if (password) {
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
            JSON.stringify({ id: userId, email: userEmail }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } else {
          return new Response(
            JSON.stringify({ id: userId, email: userEmail, message: 'No password update needed' }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
      } catch (error) {
        console.error('Error updating user password:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }
    
    // Create new user if requested and doesn't exist
    if (createIfNotExists && email) {
      try {
        // Check if user already exists
        const { data: { users } } = await supabase.auth.admin.listUsers({
          filters: {
            email: email,
          },
        });
        
        console.log(`Checking if user exists with email ${email}: ${users?.length > 0}`);
        
        // User exists, return their ID
        if (users && users.length > 0) {
          const existingUser = users[0];
          
          console.log(`User exists with ID ${existingUser.id}`);
          
          // Update password if provided
          if (password) {
            console.log(`Updating password for existing user ${existingUser.id}`);
            
            const { error } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password }
            );
            
            if (error) {
              console.error('Error updating password:', error);
              throw error;
            }
            
            console.log('Password updated successfully');
          }
          
          return new Response(
            JSON.stringify({ 
              id: existingUser.id, 
              email: existingUser.email,
              created: false,
              updated: !!password
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }
        
        // User doesn't exist, create new
        if (!password) {
          throw new Error('Password is required to create a new user');
        }
        
        const userData = {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName
          }
        };
        
        console.log('Creating new user with data:', {
          email,
          passwordProvided: !!password,
          firstName,
          lastName
        });
        
        // Try to create with preferred ID if provided
        if (preferredId) {
          try {
            console.log(`Attempting to create user with preferred ID ${preferredId}`);
            
            const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
              ...userData,
              id: preferredId,
            });
            
            if (adminError) {
              console.error('Error creating user with preferred ID:', adminError);
              // Fall back to automatic ID generation
            } else if (adminUser?.user) {
              console.log(`User created successfully with preferred ID ${adminUser.user.id}`);
              
              return new Response(
                JSON.stringify({ 
                  id: adminUser.user.id, 
                  email: adminUser.user.email,
                  created: true
                }),
                {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200,
                }
              );
            }
          } catch (err) {
            console.error('Exception creating user with preferred ID:', err);
            // Fall back to automatic ID generation
          }
        }
        
        // Create user with automatic ID
        console.log('Creating user with automatic ID');
        
        const { data: user, error } = await supabase.auth.admin.createUser(userData);
        
        if (error) {
          console.error('Error creating user:', error);
          throw error;
        }
        
        if (!user?.user) {
          throw new Error('Failed to create user: No user data returned');
        }
        
        console.log(`User created successfully with ID ${user.user.id}`);
        
        return new Response(
          JSON.stringify({ 
            id: user.user.id, 
            email: user.user.email,
            created: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error) {
        console.error('Error creating user:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          }
        );
      }
    }
    
    // If we got here, not enough info was provided
    return new Response(
      JSON.stringify({ error: 'Insufficient information provided to create or update user' }),
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
        status: 400,
      }
    );
  }
});


import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.47.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
        auth: {
          persistSession: false
        }
      }
    )

    const { userId, email, password, checkOnly, createIfNotExists, preferredId, firstName, lastName } = await req.json()
    console.log('Received request with params:', { userId, email, checkOnly, createIfNotExists, preferredId })

    // If checkOnly is true, just check if user exists and return result
    if (checkOnly && email) {
      console.log('Checking if user exists:', email)
      const { data: users, error } = await supabaseClient.auth.admin.listUsers({
        filters: {
          email: email
        }
      })
      
      if (error) {
        console.error('Error checking user:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      return new Response(
        JSON.stringify({ users: users.users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If createIfNotExists and we have email + password, create the user
    if (createIfNotExists && email && password) {
      console.log('Creating user with email:', email)
      
      // Try to create with preferred ID if provided
      let createOptions = {}
      if (preferredId) {
        console.log('Attempting to use preferred ID:', preferredId)
        createOptions = {
          data: {
            first_name: firstName,
            last_name: lastName
          },
          user_metadata: {
            first_name: firstName,
            last_name: lastName
          }
        }
      }
      
      const { data: userData, error: createError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        ...createOptions
      })
      
      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      console.log('User created successfully with ID:', userData.user.id)
      return new Response(
        JSON.stringify({ id: userData.user.id, message: 'User created successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Standard password update
    if (userId && password) {
      console.log('Updating password for user:', userId)
      const { error } = await supabaseClient.auth.admin.updateUserById(
        userId,
        { password }
      )
      
      if (error) {
        console.error('Error updating password:', error)
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // If we have email but no userId, find user by email and update password
    if (!userId && email && password) {
      console.log('Finding user by email and updating password:', email)
      
      const { data: users, error: listError } = await supabaseClient.auth.admin.listUsers({
        filters: {
          email: email
        }
      })
      
      if (listError) {
        console.error('Error finding user by email:', listError)
        return new Response(
          JSON.stringify({ error: listError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      if (users.users.length === 0) {
        console.error('User not found with email:', email)
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }
      
      const userToUpdate = users.users[0]
      console.log('Found user to update:', userToUpdate.id)
      
      const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
        userToUpdate.id,
        { password }
      )
      
      if (updateError) {
        console.error('Error updating password by email:', updateError)
        return new Response(
          JSON.stringify({ error: updateError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Required parameters missing' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

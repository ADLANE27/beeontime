
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Get the request body
    const { userId, email, password, checkOnly, preferredId, firstName, lastName, createIfNotExists } = await req.json()

    console.log(`Processing request: ${JSON.stringify({
      userId: userId ? 'provided' : 'not provided',
      email: email ? email : 'not provided',
      password: password ? 'provided' : 'not provided',
      checkOnly: checkOnly || false,
      createIfNotExists: createIfNotExists || false,
      preferredId: preferredId ? 'provided' : 'not provided'
    })}`)

    // If checkOnly is true, just check if the user exists
    if (checkOnly && email) {
      console.log(`Checking if user with email ${email} exists`)
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email
        }
      })

      if (error) {
        console.error('Error checking user existence:', error)
        throw error
      }

      console.log(`Found ${users.users.length} users with email ${email}`)
      return new Response(
        JSON.stringify({ users: users.users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // If email is provided but no userId, try to find the user by email
    if (email && !userId && !createIfNotExists) {
      console.log(`Looking up user by email: ${email}`)
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email
        }
      })

      if (error) {
        console.error('Error looking up user by email:', error)
        throw error
      }

      if (users.users.length === 0) {
        console.log(`No user found with email ${email}`)
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Use the first user found (should be only one)
      const userId = users.users[0].id
      console.log(`Found user with ID: ${userId}`)

      // If password is provided, update it
      if (password) {
        console.log(`Updating password for user ${userId}`)
        const { error } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password }
        )

        if (error) {
          console.error('Error updating password:', error)
          throw error
        }

        console.log(`Password updated successfully for user ${userId}`)
      }

      return new Response(
        JSON.stringify({ id: userId, message: 'User found and potentially updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // If createIfNotExists is true, create the user if they don't exist
    if (createIfNotExists && email && password) {
      console.log(`Attempting to create user with email ${email}`)
      
      // First check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
        filter: {
          email: email
        }
      })

      if (existingUsers.users.length > 0) {
        const existingUser = existingUsers.users[0]
        console.log(`User already exists with ID ${existingUser.id}`)
        
        // Update the password if provided
        if (password) {
          console.log(`Updating password for existing user ${existingUser.id}`)
          await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            { password }
          )
        }
        
        return new Response(
          JSON.stringify({ 
            id: existingUser.id, 
            message: 'User already exists, potentially updated password' 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      // User doesn't exist, so create them
      console.log(`Creating new user with email ${email}`)
      const userData = {
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      }
      
      // If preferredId is provided, attempt to use it
      let createUserResult;
      if (preferredId) {
        console.log(`Attempting to create user with preferred ID: ${preferredId}`)
        try {
          createUserResult = await supabaseAdmin.auth.admin.createUser({
            ...userData,
            id: preferredId
          })
        } catch (error) {
          console.error(`Failed to create user with preferred ID, will try without: ${error.message}`)
          // If creating with preferred ID fails, try without it
          createUserResult = await supabaseAdmin.auth.admin.createUser(userData)
        }
      } else {
        // Create user without specified ID
        createUserResult = await supabaseAdmin.auth.admin.createUser(userData)
      }
      
      if (createUserResult.error) {
        console.error('Error creating user:', createUserResult.error)
        throw createUserResult.error
      }
      
      return new Response(
        JSON.stringify({ 
          id: createUserResult.data.user.id, 
          message: 'User created successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 201 }
      )
    }

    // If userId is provided, update the password directly
    if (userId && password) {
      console.log(`Updating password for user ${userId}`)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (error) {
        console.error('Error updating password:', error)
        throw error
      }

      console.log(`Password updated successfully for user ${userId}`)
      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // If we get here, the request is invalid
    throw new Error('Invalid request: must provide email/userId and password')

  } catch (error) {
    console.error('Error in update-user-password function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Unknown error',
        details: error.details || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 400 
      }
    )
  }
})

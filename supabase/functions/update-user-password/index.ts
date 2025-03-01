
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

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Parse the request body
    const { userId, email, password, checkOnly, preferredId, firstName, lastName, createIfNotExists } = await req.json()

    console.log('Request parameters:', {
      userId: userId ? 'provided' : 'not provided',
      email: email ? 'provided' : 'not provided',
      password: password ? 'provided' : 'not provided',
      checkOnly: checkOnly ? true : false,
      createIfNotExists: createIfNotExists ? true : false,
      preferredId: preferredId ? 'provided' : 'not provided',
    })

    // If checkOnly is true, check if the user exists
    if (checkOnly) {
      const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({
        email: email
      })

      console.log(`Checking if user with email ${email} exists:`, users?.users.length > 0)
      
      return new Response(
        JSON.stringify({ users: users?.users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // If createIfNotExists is true and no users exist with this email, create one
    if (createIfNotExists && email) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers({
        email: email
      })

      if (!existingUsers?.users.length) {
        console.log(`Creating new user with email ${email}`)
        
        const userData = {
          email,
          password,
          user_metadata: {
            first_name: firstName,
            last_name: lastName
          }
        }

        // If preferredId is provided, try to use it
        if (preferredId) {
          try {
            const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
              ...userData,
              id: preferredId
            })

            if (error) {
              console.error('Error creating user with preferredId:', error)
              // Fall back to auto-generated ID if specific ID fails
              const { data: fallbackUser, error: fallbackError } = await supabaseAdmin.auth.admin.createUser(userData)
              
              if (fallbackError) {
                throw fallbackError
              }
              
              return new Response(
                JSON.stringify({ id: fallbackUser?.user?.id, message: 'User created with auto-generated ID' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
              )
            }
            
            console.log(`User created with preferred ID: ${user?.user?.id}`)
            return new Response(
              JSON.stringify({ id: user?.user?.id, message: 'User created with preferred ID' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
          } catch (error) {
            console.error('Error in user creation with preferredId:', error)
            throw error
          }
        } else {
          // Create user with auto-generated ID
          const { data: user, error } = await supabaseAdmin.auth.admin.createUser(userData)
          
          if (error) {
            throw error
          }
          
          console.log(`User created with ID: ${user?.user?.id}`)
          return new Response(
            JSON.stringify({ id: user?.user?.id, message: 'User created with auto-generated ID' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          )
        }
      } else {
        // User exists, return the existing user ID
        const existingUserId = existingUsers.users[0].id
        console.log(`User already exists with ID: ${existingUserId}`)
        return new Response(
          JSON.stringify({ id: existingUserId, message: 'User already exists' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
    }

    // Update user password either by userId or email
    if (userId) {
      console.log(`Updating password for user ID: ${userId}`)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (error) {
        throw error
      }

      return new Response(
        JSON.stringify({ message: 'Password updated successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else if (email) {
      console.log(`Looking up user by email: ${email}`)
      // Find user by email
      const { data: users, error: findError } = await supabaseAdmin.auth.admin.listUsers({
        email: email
      })

      if (findError) {
        throw findError
      }

      if (!users.users.length) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      const user = users.users[0]
      console.log(`Found user with ID: ${user.id}, updating password`)

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { password }
      )

      if (updateError) {
        throw updateError
      }

      return new Response(
        JSON.stringify({ message: 'Password updated successfully', userId: user.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Either userId or email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in function:', error)
    
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

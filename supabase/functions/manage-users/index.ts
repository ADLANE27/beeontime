
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserCreateParams {
  email: string
  password: string
  firstName: string
  lastName: string
  action?: string
}

interface UserCheckParams {
  email: string
  checkOnly?: boolean
}

interface UserPasswordUpdateParams {
  userId: string
  password: string
  email: string
  action: string
}

type RequestParams = UserCreateParams | UserCheckParams | UserPasswordUpdateParams

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Get request body
  const requestBody: RequestParams = await req.json()
  console.log('Function called with action:', requestBody.action || 'checkOnly')

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check operation type
    if (requestBody.checkOnly === true) {
      const { email } = requestBody as UserCheckParams
      console.log('Checking if user exists:', email)

      // Check if user exists with given email
      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) {
        console.error('Error listing users:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to check user existence' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Find users with matching email
      const users = data.users.filter(user => 
        user.email && user.email.toLowerCase() === email.toLowerCase()
      )
      
      console.log(`Found ${users.length} matching users`)
      
      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } 
    else if (requestBody.action === 'update-password') {
      const { userId, password, email } = requestBody as UserPasswordUpdateParams
      console.log('Updating password for user:', userId)

      // Update user password
      const { data, error } = await supabase.auth.admin.updateUserById(
        userId,
        { password }
      )

      if (error) {
        console.error('Error updating user password:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to update user password' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      return new Response(
        JSON.stringify({ id: userId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    else if (requestBody.action === 'create-user') {
      const { email, password, firstName, lastName } = requestBody as UserCreateParams
      console.log('Creating new user:', email)

      // Create new user with metadata
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName
        }
      })

      if (createError) {
        console.error('Error creating user:', createError)
        return new Response(
          JSON.stringify({ error: createError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      if (!userData || !userData.user) {
        console.error('Failed to create user, no user data returned')
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      console.log('User created successfully with ID:', userData.user.id)

      // Ensure profile record exists
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          role: 'employee'
        }, { onConflict: 'id' })

      if (profileError) {
        console.error('Error creating profile record:', profileError)
        return new Response(
          JSON.stringify({ error: 'Failed to create profile: ' + profileError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      console.log('Profile record created successfully')

      // Create user_roles entry for role checking
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userData.user.id,
          role: 'employee'
        })

      if (roleError) {
        console.warn('Error creating user_roles record:', roleError)
        // Continue anyway as the auth user and profile were created successfully
      } else {
        console.log('User role record created successfully')
      }

      return new Response(
        JSON.stringify({ 
          id: userData.user.id,
          email: userData.user.email
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If action is not recognized
    return new Response(
      JSON.stringify({ error: 'Invalid action specified' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

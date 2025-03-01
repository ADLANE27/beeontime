
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
    // Get the request body
    const { employeeId } = await req.json()

    if (!employeeId) {
      throw new Error('employeeId is required')
    }

    console.log(`Deleting employee with ID: ${employeeId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the user exists in auth
    console.log('Checking if user exists in auth...')
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, email')
      .eq('id', employeeId)
      .single()

    if (employeeError) {
      console.error('Error fetching employee:', employeeError)
      throw new Error(`Employee not found: ${employeeError.message}`)
    }

    // Delete cascade will handle related records in other tables
    // through database-level foreign key constraints

    // Delete employee record first
    console.log('Deleting employee record...')
    const { error: deleteEmployeeError } = await supabaseAdmin
      .from('employees')
      .delete()
      .eq('id', employeeId)

    if (deleteEmployeeError) {
      console.error('Error deleting employee:', deleteEmployeeError)
      throw new Error(`Failed to delete employee: ${deleteEmployeeError.message}`)
    }

    // Delete profile record
    console.log('Deleting profile record...')
    const { error: deleteProfileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', employeeId)

    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError)
      // Continue even if profile delete fails
    }

    // Finally, delete the auth user
    console.log('Deleting auth user...')
    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(employeeId)

    if (deleteAuthError) {
      console.error('Error deleting auth user:', deleteAuthError)
      // Continue even if auth delete fails
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Employee deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in delete-employee function:', error)
    
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

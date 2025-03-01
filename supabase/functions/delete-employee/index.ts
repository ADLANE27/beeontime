
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

    console.log(`Attempting to delete employee with ID: ${employeeId}`)

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // First, check if the employee exists
    console.log('Checking if employee exists...')
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, email')
      .eq('id', employeeId)
      .single()

    if (employeeError) {
      console.error('Error fetching employee:', employeeError)
      throw new Error(`Employee not found: ${employeeError.message}`)
    }

    console.log(`Employee found: ${employee.id} (${employee.email})`)
    console.log('Starting deletion process...')
    
    // Using a structured approach to delete related records
    const tables = [
      { name: 'leave_requests', fkColumn: 'employee_id' },
      { name: 'hr_events', fkColumn: 'employee_id' },
      { name: 'vacation_history', fkColumn: 'employee_id' },
      { name: 'time_records', fkColumn: 'employee_id' },
      { name: 'overtime_requests', fkColumn: 'employee_id' },
      { name: 'delays', fkColumn: 'employee_id' },
      { name: 'documents', fkColumn: 'employee_id' }
    ]
    
    // Delete related records from each table
    for (const table of tables) {
      console.log(`Deleting from ${table.name}...`)
      const { error } = await supabaseAdmin
        .from(table.name)
        .delete()
        .eq(table.fkColumn, employeeId)
      
      if (error) {
        console.warn(`Warning: Error deleting from ${table.name}:`, error)
        // Continue with deletion process, don't throw
      }
    }

    // Delete employee record 
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
      // Don't throw here - the profile data is already gone, which is the important part
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Employee deleted successfully',
        details: {
          employeeId,
          email: employee.email,
          authUserDeleted: !deleteAuthError
        }
      }),
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

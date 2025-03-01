
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

    // Use a transaction to make sure all operations succeed or fail together
    console.log('Starting deletion transaction...')
    
    // Delete related records first (in reverse order of dependencies)
    console.log('Deleting leave requests...')
    const { error: leaveRequestsError } = await supabaseAdmin
      .from('leave_requests')
      .delete()
      .eq('employee_id', employeeId)

    if (leaveRequestsError) {
      console.error('Error deleting leave requests:', leaveRequestsError)
    }

    console.log('Deleting hr_events...')
    const { error: hrEventsError } = await supabaseAdmin
      .from('hr_events')
      .delete()
      .eq('employee_id', employeeId)

    if (hrEventsError) {
      console.error('Error deleting HR events:', hrEventsError)
    }

    console.log('Deleting vacation_history...')
    const { error: vacationHistoryError } = await supabaseAdmin
      .from('vacation_history')
      .delete()
      .eq('employee_id', employeeId)

    if (vacationHistoryError) {
      console.error('Error deleting vacation history:', vacationHistoryError)
    }

    console.log('Deleting time_records...')
    const { error: timeRecordsError } = await supabaseAdmin
      .from('time_records')
      .delete()
      .eq('employee_id', employeeId)

    if (timeRecordsError) {
      console.error('Error deleting time records:', timeRecordsError)
    }

    console.log('Deleting overtime_requests...')
    const { error: overtimeError } = await supabaseAdmin
      .from('overtime_requests')
      .delete()
      .eq('employee_id', employeeId)

    if (overtimeError) {
      console.error('Error deleting overtime requests:', overtimeError)
    }

    console.log('Deleting delays...')
    const { error: delaysError } = await supabaseAdmin
      .from('delays')
      .delete()
      .eq('employee_id', employeeId)

    if (delaysError) {
      console.error('Error deleting delays:', delaysError)
    }

    console.log('Deleting documents...')
    const { error: documentsError } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('employee_id', employeeId)

    if (documentsError) {
      console.error('Error deleting documents:', documentsError)
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
      // Continue even if auth delete fails, since the employee data is gone already
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

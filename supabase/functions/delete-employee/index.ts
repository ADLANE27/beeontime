
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
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { employeeId } = await req.json();
    if (!employeeId) {
      return new Response(
        JSON.stringify({ error: 'Missing employee ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting deletion process for employee ID: ${employeeId}`);

    // Get the employee to log what we're deleting
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('first_name, last_name, email')
      .eq('id', employeeId)
      .single();

    if (fetchError) {
      console.error("Error fetching employee:", fetchError);
      return new Response(
        JSON.stringify({ error: 'Error fetching employee' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting data for ${employee.first_name} ${employee.last_name} (${employee.email})`);

    // Delete in cascading order to avoid foreign key constraints
    
    // 1. First delete related documents
    console.log("Deleting documents...");
    await supabase
      .from('leave_request_documents')
      .delete()
      .in('leave_request_id', 
        supabase.from('leave_requests').select('id').eq('employee_id', employeeId)
      );
    
    await supabase
      .from('hr_event_documents')
      .delete()
      .in('event_id', 
        supabase.from('hr_events').select('id').eq('employee_id', employeeId)
      );
    
    await supabase
      .from('documents')
      .delete()
      .eq('employee_id', employeeId);

    // 2. Delete time-related records
    console.log("Deleting time records...");
    await supabase
      .from('time_records')
      .delete()
      .eq('employee_id', employeeId);
    
    // 3. Delete leave requests
    console.log("Deleting leave requests...");
    await supabase
      .from('leave_requests')
      .delete()
      .eq('employee_id', employeeId);
    
    // 4. Delete delay records
    console.log("Deleting delays...");
    await supabase
      .from('delays')
      .delete()
      .eq('employee_id', employeeId);
    
    // 5. Delete overtime requests
    console.log("Deleting overtime requests...");
    await supabase
      .from('overtime_requests')
      .delete()
      .eq('employee_id', employeeId);
    
    // 6. Delete HR events
    console.log("Deleting HR events...");
    await supabase
      .from('hr_events')
      .delete()
      .eq('employee_id', employeeId);

    // 7. Delete vacation history
    console.log("Deleting vacation history...");
    await supabase
      .from('vacation_history')
      .delete()
      .eq('employee_id', employeeId);
    
    // 8. Finally delete the employee record
    console.log("Deleting employee record...");
    const { error: employeeDeleteError } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    
    if (employeeDeleteError) {
      console.error("Error deleting employee record:", employeeDeleteError);
      throw employeeDeleteError;
    }

    // 9. Delete the auth user if it exists
    try {
      console.log("Deleting user from auth...");
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(employeeId);
      
      if (authDeleteError) {
        console.warn("Warning: Could not delete auth user. This might be expected if the user didn't have an auth account:", authDeleteError);
      }
    } catch (authError) {
      console.warn("Warning: Error when deleting auth user. This might be expected if the user didn't have an auth account:", authError);
    }

    console.log(`Successfully deleted employee: ${employee.first_name} ${employee.last_name}`);
    
    return new Response(
      JSON.stringify({ success: true, message: "Employee deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in delete-employee function:", error);
    return new Response(
      JSON.stringify({ error: `Failed to delete employee: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

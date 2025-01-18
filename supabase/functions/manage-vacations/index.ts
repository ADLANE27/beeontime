import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Employee {
  id: string;
  current_year_vacation_days: number;
  current_year_used_days: number;
  previous_year_vacation_days: number;
  previous_year_used_days: number;
  last_vacation_credit_date: string | null;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  type: string;
  day_type: string;
  period: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()
    const now = new Date()

    switch (action) {
      case 'monthly-credit':
        // Credit 2.5 days to active employees who worked at least half the month
        const { data: activeEmployees, error: employeesError } = await supabaseClient
          .from('employees')
          .select('*, profiles(active)')
          .eq('profiles.active', true)

        if (employeesError) throw employeesError

        for (const employee of activeEmployees) {
          // Check if employee already received credit this month
          const lastCreditDate = employee.last_vacation_credit_date 
            ? new Date(employee.last_vacation_credit_date)
            : null
          
          if (!lastCreditDate || lastCreditDate.getMonth() !== now.getMonth()) {
            // Add 2.5 days to current year balance
            await supabaseClient
              .from('employees')
              .update({
                current_year_vacation_days: employee.current_year_vacation_days + 2.5,
                last_vacation_credit_date: now.toISOString()
              })
              .eq('id', employee.id)

            // Log in history
            await supabaseClient
              .from('vacation_history')
              .insert({
                employee_id: employee.id,
                year: now.getFullYear(),
                action_type: 'monthly_credit',
                days_affected: 2.5,
                details: { month: now.getMonth() + 1 }
              })
          }
        }
        break

      case 'year-transition':
        // Transfer current year balance to previous year and reset current year
        const { data: employees, error: transitionError } = await supabaseClient
          .from('employees')
          .select('*')

        if (transitionError) throw transitionError

        for (const employee of employees) {
          const oldBalance = employee.current_year_vacation_days - employee.current_year_used_days
          
          await supabaseClient
            .from('employees')
            .update({
              previous_year_vacation_days: oldBalance,
              previous_year_used_days: 0,
              current_year_vacation_days: 0,
              current_year_used_days: 0
            })
            .eq('id', employee.id)

          // Log in history
          await supabaseClient
            .from('vacation_history')
            .insert({
              employee_id: employee.id,
              year: now.getFullYear() - 1,
              action_type: 'year_transition',
              days_affected: oldBalance,
              details: {
                previous_balance: oldBalance,
                transferred_to_year: now.getFullYear()
              }
            })
        }
        break

      case 'expire-previous-year':
        // Remove previous year balance on May 31st
        const { data: employeesWithBalance, error: expirationError } = await supabaseClient
          .from('employees')
          .select('*')
          .gt('previous_year_vacation_days', 0)

        if (expirationError) throw expirationError

        for (const employee of employeesWithBalance) {
          const expiredDays = employee.previous_year_vacation_days - employee.previous_year_used_days
          
          await supabaseClient
            .from('employees')
            .update({
              previous_year_vacation_days: 0,
              previous_year_used_days: 0
            })
            .eq('id', employee.id)

          // Log in history
          await supabaseClient
            .from('vacation_history')
            .insert({
              employee_id: employee.id,
              year: now.getFullYear() - 1,
              action_type: 'expired',
              days_affected: expiredDays,
              details: {
                expired_date: now.toISOString(),
                previous_year: now.getFullYear() - 1
              }
            })
        }
        break

      default:
        throw new Error('Invalid action')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
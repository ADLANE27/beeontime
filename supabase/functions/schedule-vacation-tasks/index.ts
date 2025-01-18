import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const now = new Date()
    
    // Schedule monthly credit (last day of each month)
    await supabaseClient.rpc('schedule_vacation_credit', {
      cron_schedule: '0 0 L * *', // Last day of every month at midnight
      function_name: 'manage-vacations',
      payload: { action: 'monthly-credit' }
    })

    // Schedule year transition (January 1st)
    await supabaseClient.rpc('schedule_year_transition', {
      cron_schedule: '0 0 1 1 *', // January 1st at midnight
      function_name: 'manage-vacations',
      payload: { action: 'year-transition' }
    })

    // Schedule previous year expiration (June 1st)
    await supabaseClient.rpc('schedule_vacation_expiration', {
      cron_schedule: '0 0 1 6 *', // June 1st at midnight
      function_name: 'manage-vacations',
      payload: { action: 'expire-previous-year' }
    })

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
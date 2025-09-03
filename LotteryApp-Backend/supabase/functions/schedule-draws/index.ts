import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current time in PKT
    const now = new Date()
    const pktTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Karachi"}))
    
    // Calculate next draw time (top of next hour in PKT)
    const nextDrawTime = new Date(pktTime)
    nextDrawTime.setMinutes(0, 0, 0)
    nextDrawTime.setHours(nextDrawTime.getHours() + 1)

    // Check if we already have a draw scheduled for this time
    const { data: existingDraws, error: checkError } = await supabase
      .from('draws')
      .select('id')
      .eq('scheduled_at', nextDrawTime.toISOString())
      .eq('status', 'scheduled')

    if (checkError) {
      throw new Error(`Error checking existing draws: ${checkError.message}`)
    }

    // If no draw exists for this time, create one
    if (!existingDraws || existingDraws.length === 0) {
      const { data: newDraw, error: insertError } = await supabase
        .from('draws')
        .insert({
          scheduled_at: nextDrawTime.toISOString(),
          status: 'scheduled'
        })
        .select()

      if (insertError) {
        throw new Error(`Error creating new draw: ${insertError.message}`)
      }

      console.log(`Created new draw scheduled for: ${nextDrawTime.toISOString()}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'New draw scheduled',
          draw: newDraw[0],
          scheduled_at: nextDrawTime.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Draw already exists for this time',
          scheduled_at: nextDrawTime.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('Error in schedule-draws function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

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
    
    // Find draws that are due to run (scheduled time has passed and status is 'scheduled')
    const { data: dueDraws, error: fetchError } = await supabase
      .from('draws')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_at', pktTime.toISOString())

    if (fetchError) {
      throw new Error(`Error fetching due draws: ${fetchError.message}`)
    }

    if (!dueDraws || dueDraws.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No draws due to run',
          current_time: pktTime.toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    const results = []

    for (const draw of dueDraws) {
      try {
        // Start the draw
        const { error: startError } = await supabase
          .from('draws')
          .update({
            status: 'in_progress',
            started_at: pktTime.toISOString()
          })
          .eq('id', draw.id)

        if (startError) {
          throw new Error(`Error starting draw ${draw.id}: ${startError.message}`)
        }

        // Generate winning number (0-999)
        const winningNumber = Math.floor(Math.random() * 1000)

        // Get all bets for this draw
        const { data: bets, error: betsError } = await supabase
          .from('bets')
          .select('*')
          .eq('draw_id', draw.id)

        if (betsError) {
          throw new Error(`Error fetching bets for draw ${draw.id}: ${betsError.message}`)
        }

        let totalBets = 0
        let totalStake = 0
        let winningBets = 0
        let totalRefundAmount = 0

        // Process each bet
        for (const bet of bets || []) {
          totalBets++
          totalStake += parseFloat(bet.stake)

          if (bet.number === winningNumber) {
            // Winning bet - calculate potential win (typically 900x stake for 0-999 range)
            const potentialWin = parseFloat(bet.stake) * 900
            
            await supabase
              .from('bets')
              .update({
                status: 'won',
                potential_win: potentialWin
              })
              .eq('id', bet.id)

            winningBets++
          } else {
            // Losing bet - calculate 20% refund
            const refundAmount = parseFloat(bet.stake) * 0.2
            totalRefundAmount += refundAmount

            await supabase
              .from('bets')
              .update({
                status: 'lost',
                refund_amount: refundAmount
              })
              .eq('id', bet.id)

            // Create refund record
            await supabase
              .from('refunds')
              .insert({
                bet_id: bet.id,
                amount: refundAmount,
                notes: '20% refund for losing bet'
              })
          }
        }

        // Complete the draw
        const { error: completeError } = await supabase
          .from('draws')
          .update({
            status: 'completed',
            finished_at: pktTime.toISOString(),
            winning_number: winningNumber,
            total_bets: totalBets,
            total_stake: totalStake
          })
          .eq('id', draw.id)

        if (completeError) {
          throw new Error(`Error completing draw ${draw.id}: ${completeError.message}`)
        }

        // Log transaction
        await supabase
          .from('transactions')
          .insert({
            type: 'draw_completed',
            amount: totalStake,
            description: `Draw ${draw.id} completed. Winning number: ${winningNumber}. Total bets: ${totalBets}`,
            metadata: {
              draw_id: draw.id,
              winning_number: winningNumber,
              total_bets: totalBets,
              winning_bets: winningBets,
              total_refund: totalRefundAmount
            }
          })

        results.push({
          draw_id: draw.id,
          scheduled_at: draw.scheduled_at,
          winning_number: winningNumber,
          total_bets: totalBets,
          total_stake: totalStake,
          total_refund: totalRefundAmount,
          status: 'completed'
        })

        console.log(`Draw ${draw.id} completed successfully. Winning number: ${winningNumber}`)

      } catch (drawError) {
        console.error(`Error processing draw ${draw.id}:`, drawError)
        
        // Mark draw as cancelled if there was an error
        await supabase
          .from('draws')
          .update({
            status: 'cancelled'
          })
          .eq('id', draw.id)

        results.push({
          draw_id: draw.id,
          scheduled_at: draw.scheduled_at,
          error: drawError.message,
          status: 'cancelled'
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} draws`,
        results,
        current_time: pktTime.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in run-draws function:', error)
    
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

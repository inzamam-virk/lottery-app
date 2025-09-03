import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ArchiveItem {
  identifier: string
  title: string
  description: string
  duration: string
  mediatype: string
  files: Array<{
    name: string
    format: string
    size: string
  }>
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

    const { method } = req

    if (method === 'GET') {
      // Get active streams
      const { data: streams, error } = await supabase
        .from('streams')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })

      if (error) {
        throw new Error(`Error fetching streams: ${error.message}`)
      }

      return new Response(
        JSON.stringify({
          success: true,
          streams
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    if (method === 'POST') {
      const body = await req.json()
      const { action, query, category } = body

      if (action === 'search_archive') {
        // Search Internet Archive for content
        const searchQuery = query || 'public domain movies'
        const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(searchQuery)}&output=json&rows=20&sort=downloads desc`

        const response = await fetch(searchUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch from Internet Archive: ${response.statusText}`)
        }

        const data = await response.json()
        const items = data.response.docs || []

        // Filter for video content and format results
        const videoItems = items
          .filter((item: ArchiveItem) => 
            item.mediatype === 'movies' || 
            item.mediatype === 'video' ||
            item.files?.some(file => file.format === 'MPEG4' || file.format === 'h.264')
          )
          .map((item: ArchiveItem) => ({
            identifier: item.identifier,
            title: item.title || item.identifier,
            description: item.description || 'No description available',
            duration: item.duration || 'Unknown',
            url: `https://archive.org/download/${item.identifier}/${item.identifier}.mp4`,
            type: 'archive' as const
          }))
          .slice(0, 10) // Limit to 10 results

        return new Response(
          JSON.stringify({
            success: true,
            results: videoItems,
            total: videoItems.length
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (action === 'add_stream') {
        const { title, description, url, type, duration_seconds, priority } = body

        if (!title || !url || !type) {
          throw new Error('Missing required fields: title, url, type')
        }

        const { data: newStream, error: insertError } = await supabase
          .from('streams')
          .insert({
            title,
            description: description || '',
            url,
            type,
            duration_seconds: duration_seconds || 0,
            priority: priority || 0,
            is_active: true
          })
          .select()

        if (insertError) {
          throw new Error(`Error adding stream: ${insertError.message}`)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Stream added successfully',
            stream: newStream[0]
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (action === 'update_stream') {
        const { id, updates } = body

        if (!id || !updates) {
          throw new Error('Missing required fields: id, updates')
        }

        const { data: updatedStream, error: updateError } = await supabase
          .from('streams')
          .update(updates)
          .eq('id', id)
          .select()

        if (updateError) {
          throw new Error(`Error updating stream: ${updateError.message}`)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Stream updated successfully',
            stream: updatedStream[0]
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (action === 'delete_stream') {
        const { id } = body

        if (!id) {
          throw new Error('Missing required field: id')
        }

        const { error: deleteError } = await supabase
          .from('streams')
          .delete()
          .eq('id', id)

        if (deleteError) {
          throw new Error(`Error deleting stream: ${deleteError.message}`)
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Stream deleted successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      if (action === 'get_popular_content') {
        // Get popular content categories from Internet Archive
        const categories = [
          'classic movies',
          'vintage cartoons',
          'documentaries',
          'public domain films',
          'educational videos'
        ]

        const popularContent = []

        for (const category of categories) {
          try {
            const searchUrl = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(category)}&output=json&rows=5&sort=downloads desc`
            const response = await fetch(searchUrl)
            
            if (response.ok) {
              const data = await response.json()
              const items = data.response.docs || []
              
              if (items.length > 0) {
                const topItem = items[0]
                popularContent.push({
                  category,
                  title: topItem.title || topItem.identifier,
                  identifier: topItem.identifier,
                  url: `https://archive.org/download/${topItem.identifier}/${topItem.identifier}.mp4`,
                  downloads: topItem.downloads || 0
                })
              }
            }
          } catch (error) {
            console.warn(`Failed to fetch category ${category}:`, error)
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            popular_content: popularContent
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        )
      }

      throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      }
    )

  } catch (error) {
    console.error('Error in manage-streams function:', error)
    
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

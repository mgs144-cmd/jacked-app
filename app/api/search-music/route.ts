import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Get Spotify credentials from environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  console.log('Spotify credentials check:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    clientIdLength: clientId?.length || 0,
    clientSecretLength: clientSecret?.length || 0,
  })

  if (!clientId || !clientSecret) {
    console.error('Spotify credentials missing:', { clientId: !!clientId, clientSecret: !!clientSecret })
    return NextResponse.json(
      { 
        error: 'Spotify API credentials not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your environment variables in Vercel.',
        tracks: [],
        debug: {
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        }
      },
      { status: 500 }
    )
  }

  try {
    // Get Spotify access token
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      console.error('Spotify token error:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorData,
      })
      return NextResponse.json(
        { 
          error: `Spotify authentication failed: ${errorData.error || tokenResponse.statusText}. Check your Client ID and Secret.`,
          tracks: [],
          debug: errorData
        },
        { status: 500 }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Search for tracks - try without market restriction first
    // Market restrictions can prevent preview URLs from being returned
    // Try global search first to get maximum preview availability
    let searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      console.error('Spotify search error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorData,
      })
      return NextResponse.json(
        { 
          error: `Spotify search failed: ${errorData.error?.message || searchResponse.statusText}`,
          tracks: [],
          debug: errorData
        },
        { status: 500 }
      )
    }

    let searchData = await searchResponse.json()
    
    // Check if we got any previews with global search
    const testTracks = searchData.tracks?.items || []
    const tracksWithPreviews = testTracks.filter((t: any) => t.preview_url && t.preview_url.trim() !== '')
    
    console.log(`Global search returned ${tracksWithPreviews.length} tracks with previews out of ${testTracks.length} total`)
    
    // If no previews with global search, try US market as fallback
    if (tracksWithPreviews.length === 0 && testTracks.length > 0) {
      console.log('No previews with global search, trying US market...')
      const usResponse = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50&market=US`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      
      if (usResponse.ok) {
        const usData = await usResponse.json()
        const usTracks = usData.tracks?.items || []
        const usWithPreviews = usTracks.filter((t: any) => t.preview_url && t.preview_url.trim() !== '')
        
        console.log(`US market returned ${usWithPreviews.length} tracks with previews out of ${usTracks.length} total`)
        
        // Use US results if they have previews
        if (usWithPreviews.length > 0) {
          console.log('Using US market results (has previews)')
          searchData = usData
        }
      }
    }

    // Format tracks for our app
    // NOTE: Spotify deprecated preview_url in Nov 2024 - it now returns null for all tracks
    // We'll return tracks with Spotify links that can be opened externally
    const allTracks = searchData.tracks.items || []
    
    console.log(`Received ${allTracks.length} tracks from Spotify`)
    console.log('NOTE: Spotify deprecated preview_url - all tracks will have null preview_url')
    
    // Since preview_url is deprecated, we can't filter by it
    // Return tracks with their Spotify links - users can open them externally
    // Or they can use the Upload tab to upload their own audio files
    if (allTracks.length === 0) {
      return NextResponse.json({ 
        tracks: [],
        error: `No songs found for "${query}".\n\nTry:\n• A different song or artist\n• Check spelling`
      })
    }
    
    // Return tracks with Spotify links (even though preview_url is null)
    // The client will handle opening Spotify links externally
    const tracks = allTracks.slice(0, 20).map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      preview_url: null, // Spotify deprecated this - always null now
      external_urls: {
        spotify: track.external_urls.spotify,
      },
      album_image: track.album.images?.[0]?.url,
      source: 'spotify',
    }))

    console.log(`Returning ${tracks.length} tracks (preview_url deprecated by Spotify)`)
    return NextResponse.json({ 
      tracks,
      note: 'Spotify deprecated preview_url. Use Upload tab for in-app playback, or tracks will open in Spotify.'
    })
    
    const tracks = tracksWithPreviews.slice(0, 20).map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      preview_url: track.preview_url, // This is a direct MP3 URL from Spotify (usually p.scdn.co)
      external_urls: {
        spotify: track.external_urls.spotify,
      },
      album_image: track.album.images?.[0]?.url,
      source: 'spotify',
    }))

    console.log(`Returning ${tracks.length} tracks with preview URLs`)
    return NextResponse.json({ tracks })
  } catch (error: any) {
    console.error('Spotify search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search songs', tracks: [] },
      { status: 500 }
    )
  }
}



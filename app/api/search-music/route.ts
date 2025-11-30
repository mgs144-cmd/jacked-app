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

    // Search for tracks - use market parameter to get more previews
    // Market=US usually has the most previews available
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=50&market=US`,
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

    const searchData = await searchResponse.json()

    // Format tracks for our app - ONLY return tracks with preview URLs
    const allTracks = searchData.tracks.items || []
    const tracksWithPreviews = allTracks.filter((track: any) => {
      // Only include tracks with preview_url (Spotify preview URLs are direct MP3 links)
      return track.preview_url && track.preview_url.trim() !== ''
    })
    
    console.log(`Spotify search: Found ${allTracks.length} total tracks, ${tracksWithPreviews.length} with preview URLs`)
    
    // Log sample preview URLs for debugging
    if (tracksWithPreviews.length > 0) {
      console.log('Sample preview URLs:', tracksWithPreviews.slice(0, 3).map((t: any) => ({
        name: t.name,
        preview_url: t.preview_url?.substring(0, 50) + '...'
      })))
    }
    
    // Only return tracks with preview URLs - no fallback to web URLs
    if (tracksWithPreviews.length === 0) {
      console.log('No tracks with preview URLs found')
      return NextResponse.json({ 
        tracks: [],
        error: `No songs with preview clips found for "${query}".\n\nTry:\n• A different song or artist\n• Some songs don't have preview clips available`
      })
    }
    
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



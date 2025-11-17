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

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { 
        error: 'Spotify API credentials not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env.local file.',
        tracks: []
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
      throw new Error('Failed to get Spotify access token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Search for tracks
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!searchResponse.ok) {
      throw new Error('Failed to search Spotify')
    }

    const searchData = await searchResponse.json()

    // Format tracks for our app
    const tracks = searchData.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      preview_url: track.preview_url,
      external_urls: {
        spotify: track.external_urls.spotify,
      },
      album_image: track.album.images?.[0]?.url,
    }))

    return NextResponse.json({ tracks })
  } catch (error: any) {
    console.error('Spotify search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search songs', tracks: [] },
      { status: 500 }
    )
  }
}



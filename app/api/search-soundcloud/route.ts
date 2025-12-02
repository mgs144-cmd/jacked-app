import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // SoundCloud API credentials (free tier)
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID

  if (!clientId) {
    return NextResponse.json(
      { 
        error: 'SoundCloud API not configured. Please add SOUNDCLOUD_CLIENT_ID to your environment variables.',
        tracks: []
      },
      { status: 500 }
    )
  }

  try {
    // SoundCloud API endpoint for searching tracks
    // Note: SoundCloud's public API is limited, we'll use their embed API
    // For better results, we can use their oEmbed API or search through their web interface
    
    // Using SoundCloud's oEmbed API for better compatibility
    const searchUrl = `https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&client_id=${clientId}&limit=20`
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SoundCloud API error:', response.status, errorText)
      return NextResponse.json(
        { 
          error: `SoundCloud search failed: ${response.statusText}`,
          tracks: []
        },
        { status: response.status }
      )
    }

    const tracks = await response.json()

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return NextResponse.json({ 
        tracks: [],
        error: `No songs found for "${query}". Try a different search term.`
      })
    }

    // Format tracks for our app
    const formattedTracks = tracks.map((track: any) => ({
      id: track.id.toString(),
      name: track.title || 'Unknown',
      artist: track.user?.username || 'Unknown Artist',
      album: track.genre || '',
      preview_url: track.stream_url ? `${track.stream_url}?client_id=${clientId}` : null,
      stream_url: track.stream_url ? `${track.stream_url}?client_id=${clientId}` : null,
      permalink_url: track.permalink_url || track.uri,
      artwork_url: track.artwork_url || track.user?.avatar_url || null,
      source: 'soundcloud',
    }))

    return NextResponse.json({ 
      tracks: formattedTracks,
      note: 'SoundCloud tracks can be played in-app!'
    })
  } catch (error: any) {
    console.error('SoundCloud search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search songs', tracks: [] },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Get Apple Music credentials from environment variables
  const developerToken = process.env.APPLE_MUSIC_DEVELOPER_TOKEN
  const musicUserToken = process.env.APPLE_MUSIC_USER_TOKEN // Optional, for user-specific content

  if (!developerToken) {
    return NextResponse.json(
      { 
        error: 'Apple Music API not configured. Please add APPLE_MUSIC_DEVELOPER_TOKEN to your environment variables in Vercel.',
        tracks: [],
      },
      { status: 500 }
    )
  }

  try {
    // Search Apple Music catalog
    // Note: Apple Music API requires a developer token (JWT)
    // You need to generate this from Apple Developer portal
    const searchResponse = await fetch(
      `https://api.music.apple.com/v1/catalog/us/search?term=${encodeURIComponent(query)}&types=songs&limit=20`,
      {
        headers: {
          'Authorization': `Bearer ${developerToken}`,
          'Music-User-Token': musicUserToken || '', // Optional
        },
      }
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      console.error('Apple Music API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorData,
      })
      return NextResponse.json(
        { 
          error: `Apple Music search failed: ${errorData.errors?.[0]?.detail || searchResponse.statusText}`,
          tracks: [],
          debug: errorData
        },
        { status: 500 }
      )
    }

    const searchData = await searchResponse.json()
    const songs = searchData.results?.songs?.data || []

    console.log(`Apple Music search: Found ${songs.length} songs`)

    if (songs.length === 0) {
      return NextResponse.json({ 
        tracks: [],
        error: `No songs found for "${query}".\n\nTry:\n• A different song or artist\n• Check spelling`
      })
    }

    // Format tracks for our app
    const tracks = songs.map((song: any) => ({
      id: song.id,
      name: song.attributes.name,
      artist: song.attributes.artistName,
      album: song.attributes.albumName,
      preview_url: song.attributes.previews?.[0]?.url || null, // Apple Music preview URLs work!
      external_urls: {
        appleMusic: song.attributes.url,
      },
      album_image: song.attributes.artwork?.url?.replace('{w}', '300').replace('{h}', '300'),
      source: 'apple',
    }))

    // Filter to only tracks with preview URLs
    const tracksWithPreviews = tracks.filter((t: any) => t.preview_url)

    console.log(`Returning ${tracksWithPreviews.length} tracks with preview URLs out of ${tracks.length} total`)

    if (tracksWithPreviews.length === 0) {
      return NextResponse.json({ 
        tracks: [],
        error: `Found ${tracks.length} songs but none have preview clips available.\n\nTry:\n• A different song or artist`
      })
    }

    return NextResponse.json({ tracks: tracksWithPreviews })
  } catch (error: any) {
    console.error('Apple Music search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search Apple Music', tracks: [] },
      { status: 500 }
    )
  }
}


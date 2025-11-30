import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Get YouTube API key from environment
  const youtubeApiKey = process.env.YOUTUBE_API_KEY

  console.log('YouTube API check:', {
    hasApiKey: !!youtubeApiKey,
    apiKeyLength: youtubeApiKey?.length || 0,
  })

  if (!youtubeApiKey) {
    return NextResponse.json({
      tracks: [],
      error: 'YouTube API key not configured. Add YOUTUBE_API_KEY to Vercel environment variables.',
      fallback: true,
      searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' music')}`,
    })
  }

  try {
    // Use YouTube Data API v3 for better results
    const searchResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video&maxResults=20&key=${youtubeApiKey}`
    )

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      console.error('YouTube API error:', {
        status: searchResponse.status,
        statusText: searchResponse.statusText,
        error: errorData,
      })
      return NextResponse.json({
        tracks: [],
        error: `YouTube API error: ${errorData.error?.message || searchResponse.statusText}`,
        debug: errorData,
      }, { status: searchResponse.status })
    }

    const searchData = await searchResponse.json()

    if (!searchData.items || searchData.items.length === 0) {
      console.log('YouTube search returned no results')
      return NextResponse.json({ tracks: [] })
    }

    const tracks = searchData.items.map((item: any) => ({
      id: item.id.videoId,
      name: item.snippet.title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim(), // Clean title
      artist: item.snippet.channelTitle,
      album: item.snippet.channelTitle,
      preview_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      external_urls: {
        youtube: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      },
      album_image: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
      source: 'youtube',
    }))

    console.log(`YouTube search: Found ${tracks.length} tracks`)

    return NextResponse.json({ tracks })
  } catch (error: any) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search YouTube', tracks: [] },
      { status: 500 }
    )
  }
}



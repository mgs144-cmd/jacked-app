import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  // Get YouTube API key from environment (optional - can work without it for basic search)
  const youtubeApiKey = process.env.YOUTUBE_API_KEY

  try {
    if (youtubeApiKey) {
      // Use YouTube Data API v3 for better results
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query + ' music')}&type=video&maxResults=20&key=${youtubeApiKey}`
      )

      if (!searchResponse.ok) {
        throw new Error('Failed to search YouTube')
      }

      const searchData = await searchResponse.json()

      const tracks = searchData.items.map((item: any) => ({
        id: item.id.videoId,
        name: item.snippet.title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim(), // Clean title
        artist: item.snippet.channelTitle,
        album: item.snippet.channelTitle,
        preview_url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        external_urls: {
          youtube: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        },
        album_image: item.snippet.thumbnails?.medium?.url,
        source: 'youtube',
      }))

      return NextResponse.json({ tracks })
    } else {
      // Fallback: Return YouTube search URL (users can search manually)
      return NextResponse.json({
        tracks: [],
        fallback: true,
        searchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' music')}`,
      })
    }
  } catch (error: any) {
    console.error('YouTube search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search YouTube', tracks: [] },
      { status: 500 }
    )
  }
}



import { NextRequest, NextResponse } from 'next/server'

const GIPHY_API_KEY = process.env.GIPHY_API_KEY || ''

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q') || 'trending'
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!GIPHY_API_KEY) {
    console.error('GIPHY_API_KEY not set in environment variables')
    return NextResponse.json(
      { error: 'GIPHY API key not configured. Please set GIPHY_API_KEY in your environment variables.' },
      { status: 500 }
    )
  }

  try {
    let url: string
    if (query === 'trending') {
      url = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}`
    } else {
      url = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch GIFs')
    }

    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.images.original.url,
      preview: gif.images.preview_gif?.url || gif.images.fixed_height_small.url,
      title: gif.title,
    }))

    return NextResponse.json({ gifs })
  } catch (error: any) {
    console.error('GIF search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search GIFs' },
      { status: 500 }
    )
  }
}


import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
  }

  const giphyApiKey = process.env.GIPHY_API_KEY

  if (!giphyApiKey) {
    return NextResponse.json(
      { error: 'Giphy API key not configured', gifs: [] },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${giphyApiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`
    )

    if (!response.ok) {
      throw new Error('Failed to search Giphy')
    }

    const data = await response.json()

    const gifs = data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.images.fixed_height.url,
      preview: gif.images.preview_gif.url,
      title: gif.title,
    }))

    return NextResponse.json({ gifs })
  } catch (error: any) {
    console.error('Giphy search error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to search GIFs', gifs: [] },
      { status: 500 }
    )
  }
}


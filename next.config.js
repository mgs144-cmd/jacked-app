/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co', // Spotify album art
      },
      {
        protocol: 'https',
        hostname: 'mosaic.scdn.co', // Spotify mosaic images
      },
      {
        protocol: 'https',
        hostname: 'wrapped-images.spotifycdn.com', // Spotify wrapped images
      },
      {
        protocol: 'https',
        hostname: '**.spotifycdn.com', // All Spotify CDN images
      },
      {
        protocol: 'https',
        hostname: '**.spotify.com', // Spotify domain images
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com', // YouTube thumbnails
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://www.gstatic.com https://apis.google.com https://*.youtube.com https://*.googlevideo.com",
              "script-src-elem 'self' 'unsafe-inline' https://www.youtube.com https://*.youtube.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "frame-src 'self' https://www.youtube.com https://*.youtube.com https://www.google.com",
              "connect-src 'self' https://*.supabase.co https://www.youtube.com https://*.googleapis.com https://*.youtube.com https://*.googlevideo.com",
              "media-src 'self' https: blob:",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig


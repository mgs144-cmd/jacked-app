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
}

module.exports = nextConfig


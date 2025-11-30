# Quick Spotify Setup for Music Search

## Why Spotify?

The app now works like **Snapchat/Instagram** - users can search and select songs without uploading files! Spotify provides:
- ✅ 30-second preview clips (direct MP3 URLs)
- ✅ Album artwork
- ✅ Artist information
- ✅ No file uploads needed

## Setup Steps

1. **Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)**

2. **Create a new app:**
   - Click "Create app"
   - Name: "Jacked App" (or any name)
   - Description: "Music search for fitness app"
   - Redirect URI: `http://localhost:3000` (for local testing)
   - Accept terms and create

3. **Get your credentials:**
   - You'll see `Client ID` and `Client Secret`
   - Copy both

4. **Add to environment variables:**
   - **Local:** Add to `.env.local`:
     ```
     SPOTIFY_CLIENT_ID=your_client_id_here
     SPOTIFY_CLIENT_SECRET=your_client_secret_here
     ```
   - **Vercel:** Add to Vercel dashboard → Settings → Environment Variables

5. **That's it!** The app will now:
   - Search Spotify for songs
   - Show album artwork
   - Play 30-second previews in-app
   - Fall back to YouTube if Spotify isn't configured

## How It Works

- Users click "Add Song" → "Search" tab (default)
- Type a song name → Results appear with album art
- Click a song → It's added to the post
- Preview plays directly in-app (no external links needed!)

## Note

- Spotify preview URLs are 30-second clips (perfect for social posts)
- If a song doesn't have a preview, it won't appear in search results
- YouTube fallback works if Spotify isn't configured


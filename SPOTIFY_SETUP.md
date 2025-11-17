# Spotify API Setup Guide

To enable music search (like Instagram/Snapchat), you need to set up Spotify API credentials.

## Step 1: Create Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click **"Create app"**
3. Fill in:
   - **App name**: `Jacked App` (or your app name)
   - **App description**: `Social fitness app for lifters`
   - **Redirect URI**: `http://localhost:3000` (for local dev)
   - **Website**: Your website URL
4. Check **"I understand and agree..."**
5. Click **"Save"**

## Step 2: Get Your Credentials

1. In your app dashboard, you'll see:
   - **Client ID**
   - **Client Secret** (click "View client secret" to reveal)

## Step 3: Add to Environment Variables

1. Open your `.env.local` file
2. Add these lines:

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

3. **Save** the file
4. **Restart your dev server** (`npm run dev`)

## Step 4: Test It!

1. Go to **Settings** → **PROFILE SONG**
2. Click **"Add Song"**
3. Make sure **"Search"** tab is selected (default)
4. Type a song name (e.g., "Eye of the Tiger")
5. Click search
6. Select a song from the results
7. It should save! 🎵

## How It Works

- **Search**: Users search for songs using Spotify's database
- **Preview**: Songs with preview URLs will play 30-second previews
- **Full Playback**: Songs link to Spotify for full playback
- **No Upload Required**: Users don't need to upload files!

## Notes

- **Free Tier**: Spotify API is free for basic search
- **Rate Limits**: 10,000 requests per day (plenty for an MVP)
- **Preview URLs**: Not all songs have preview URLs (30-second clips)
- **Full Playback**: Users can click to open in Spotify for full songs

## Alternative: YouTube API (No Auth Required)

If you prefer YouTube (no API key needed), we can switch to YouTube API instead. Just let me know!



# SoundCloud API Setup Guide

## Overview

SoundCloud offers a free API that allows in-app music playback. This is a great free alternative to Spotify for in-app audio playback.

## Step 1: Create SoundCloud App

1. Go to [SoundCloud Developers](https://developers.soundcloud.com/)
2. Click **"Register a new application"**
3. Fill out the form:
   - **Application name**: Jacked App (or your app name)
   - **Website**: https://app.jackedlifting.com
   - **Redirect URI**: https://app.jackedlifting.com/auth/callback (optional, for OAuth)
   - **Description**: Social fitness app for music integration
4. Click **"Register"**

## Step 2: Get Your Client ID

1. After creating the app, you'll see your **Client ID**
2. Copy this Client ID - you'll need it for the environment variable

## Step 3: Add Environment Variable

### For Local Development:

Add to `.env.local`:
```env
SOUNDCLOUD_CLIENT_ID=your_client_id_here
```

### For Vercel Production:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name**: `SOUNDCLOUD_CLIENT_ID`
   - **Value**: Your SoundCloud Client ID
   - **Environment**: Production, Preview, Development (select all)
3. Click **Save**

## Step 4: Redeploy

After adding the environment variable, redeploy your app:
- Vercel will automatically redeploy if you push to GitHub
- Or manually trigger a redeploy in Vercel Dashboard

## How It Works

1. **Search**: Users search for songs using SoundCloud's API
2. **Playback**: SoundCloud provides direct stream URLs that can be played in-app using HTML5 audio
3. **Free**: SoundCloud API is free to use (with rate limits)

## Benefits

- ✅ **Free** - No cost for API access
- ✅ **In-app playback** - Direct audio streaming
- ✅ **Large catalog** - Millions of tracks from independent artists
- ✅ **No preview limitations** - Unlike Spotify, tracks can be fully streamed

## Limitations

- **Rate limits** - SoundCloud has API rate limits (usually generous for small apps)
- **Content availability** - Some mainstream songs may not be available (focus on independent artists)
- **Stream URLs** - Require client_id parameter for authentication

## Testing

1. Go to your app's music search
2. Search for a song (try searching for independent artists)
3. Select a track
4. Click play - it should play in-app!

## Troubleshooting

### "SoundCloud API not configured"
- Make sure `SOUNDCLOUD_CLIENT_ID` is set in your environment variables
- Restart your dev server after adding to `.env.local`
- Redeploy on Vercel after adding the variable

### "No songs found"
- Try searching for independent artists or less mainstream songs
- SoundCloud has a different catalog than Spotify
- Some songs may not be available

### "Failed to play audio"
- Check browser console for CORS errors
- SoundCloud stream URLs require the client_id parameter
- Make sure the track has a `stream_url` available

## Alternative: Keep Spotify + SoundCloud

You can keep both Spotify (for discovery) and SoundCloud (for in-app playback):
- Users can search Spotify to find songs
- If they want in-app playback, they can search SoundCloud instead
- Or we can show both results and let users choose


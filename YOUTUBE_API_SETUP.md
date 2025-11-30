# YouTube API Setup Guide

## Why YouTube API?

Since Spotify tracks don't always have preview URLs, YouTube API provides a fallback to search for music videos.

## Step 1: Get YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project (or select existing):
   - Click the project dropdown at the top
   - Click "New Project"
   - Name: "Jacked App" (or any name)
   - Click "Create"

## Step 2: Enable YouTube Data API v3

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "YouTube Data API v3"
3. Click on it
4. Click **Enable**

## Step 3: Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Your API key will be created (looks like: `AIzaSy...`)
4. **Optional but recommended:** Click "Restrict key"
   - Under "API restrictions", select "Restrict key"
   - Check "YouTube Data API v3"
   - Click "Save"

## Step 4: Add to Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Key:** `YOUTUBE_API_KEY`
   - **Value:** Your API key (the `AIzaSy...` string)
   - Check **Production** ✅
   - Click **Save**

## Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **"..."** on latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

## Step 6: Test

1. Go to your app
2. Search for a song
3. You should now see YouTube results as fallback!

## Important Notes

- **Free tier:** YouTube API has a free quota (10,000 units/day)
- **Quota usage:** Each search uses ~100 units
- **Cost:** Free tier should be plenty for testing
- **Fallback:** YouTube only activates if Spotify has no preview URLs

## Troubleshooting

### "API key not valid"
- Make sure you enabled "YouTube Data API v3"
- Check the API key is copied correctly (no spaces)

### "Quota exceeded"
- You've hit the daily limit
- Wait 24 hours or upgrade your Google Cloud plan

### "Still no results"
- Check Vercel logs for specific errors
- Verify API key is set for Production environment


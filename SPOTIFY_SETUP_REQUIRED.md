# Spotify API Setup Required for Music Search

## Issue: No songs showing up in search

This happens when Spotify API credentials are not configured.

## Quick Fix

### Step 1: Get Spotify API Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create App"**
4. Fill in:
   - **App name:** Jacked App (or any name)
   - **App description:** Music search for Jacked app
   - **Redirect URI:** `http://localhost:3000` (for local) or your production URL
5. Click **"Save"**
6. Copy:
   - **Client ID**
   - **Client Secret** (click "Show client secret")

### Step 2: Add to Environment Variables

**Local (.env.local):**
```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Vercel (Production):**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `SPOTIFY_CLIENT_ID` = your client ID
   - `SPOTIFY_CLIENT_SECRET` = your client secret
3. Redeploy your app

### Step 3: Test

1. Restart your local server (if testing locally)
2. Try searching for a song
3. Results should appear!

---

## Why This Happens

The music search uses Spotify's API to find songs. Without API credentials, the search returns no results.

---

## Alternative: Use YouTube Search

If you don't want to set up Spotify, the app will fallback to YouTube search (if configured), but Spotify is the primary source.

---

## Need Help?

- Check browser console (F12) for errors
- Verify credentials are correct
- Make sure you redeployed after adding variables
- Check Spotify Dashboard → App Settings → Redirect URIs are set


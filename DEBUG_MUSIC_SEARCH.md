# Debug Music Search - "No songs found"

## Quick Check: Is Spotify Configured?

The error "No songs found" means both Spotify and YouTube returned no results. Let's check:

### Step 1: Check Browser Console

1. Open your browser DevTools (Press F12)
2. Go to the **Console** tab
3. Search for a song (e.g., "Eye of the Tiger")
4. Look for these messages:
   - `Spotify response: {...}`
   - `YouTube response: {...}`

**What to look for:**
- If you see `error: "Spotify API credentials not configured"` → Spotify isn't set up
- If you see `tracks: []` → Spotify is working but found no results
- If you see nothing → Check network tab

### Step 2: Check Vercel Environment Variables

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Look for:
   - `SPOTIFY_CLIENT_ID` (should have a value)
   - `SPOTIFY_CLIENT_SECRET` (should have a value)

**If they're missing:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Get your Client ID and Secret
3. Add them to Vercel
4. **Redeploy** your app

### Step 3: Check Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Search for a song
4. Look for a request to `/api/search-music`
5. Click on it → Check the **Response** tab

**What you should see:**
- If Spotify is configured: `{"tracks": [...]}` or `{"error": "..."}`
- If not configured: `{"error": "Spotify API credentials not configured..."}`

### Step 4: Test with a Popular Song

Try searching for:
- "Eye of the Tiger" by Survivor
- "Lose Yourself" by Eminem
- "Stronger" by Kanye West

These should definitely have results if Spotify is working.

### Step 5: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project
2. Click **Functions** tab
3. Look for `/api/search-music`
4. Check recent invocations for errors

## Common Issues

### Issue 1: Spotify Not Configured
**Symptom:** Error says "not configured"  
**Fix:** Add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to Vercel

### Issue 2: Credentials Wrong
**Symptom:** Error about "access token" or "authentication"  
**Fix:** Double-check you copied the entire Client ID and Secret (no spaces)

### Issue 3: No Tracks with Previews
**Symptom:** Spotify works but returns empty results  
**Fix:** Some songs don't have 30-second previews. Try a different, more popular song.

### Issue 4: YouTube Also Failing
**Symptom:** Both Spotify and YouTube return nothing  
**Fix:** YouTube requires `YOUTUBE_API_KEY` (optional). Without it, YouTube fallback won't work.

## Quick Test

Open browser console and run:
```javascript
fetch('/api/search-music?q=eye%20of%20the%20tiger')
  .then(r => r.json())
  .then(console.log)
```

**Expected results:**
- If configured: `{tracks: [...]}`
- If not: `{error: "Spotify API credentials not configured..."}`


# Music Search Troubleshooting

## Problem: "Nothing comes up when I search"

### Most Common Cause: Spotify API Not Configured

If you see an error message like:
> "Spotify API not configured. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET..."

**Solution:**
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app (if you haven't already)
3. Copy your **Client ID** and **Client Secret**
4. Add them to **Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `SPOTIFY_CLIENT_ID` = (your Client ID)
     - `SPOTIFY_CLIENT_SECRET` = (your Client Secret)
5. **Redeploy** your app (Vercel → Deployments → Redeploy)

### Check if Credentials Are Set

**In Vercel:**
1. Go to your project → Settings → Environment Variables
2. Look for `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
3. If they're missing, add them

**In Browser Console (for debugging):**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Search for a song
4. Look for error messages starting with "Spotify response:" or "Search error:"

### Other Possible Issues

#### 1. Spotify App Not Approved
- Your Spotify app might be in "Development Mode"
- This is fine for testing - it should still work
- Make sure you've accepted the terms in the Spotify dashboard

#### 2. Invalid Credentials
- Double-check you copied the **entire** Client ID and Secret
- Make sure there are no extra spaces
- Try regenerating them in Spotify dashboard

#### 3. YouTube Fallback Not Working
- YouTube search requires `YOUTUBE_API_KEY` (optional)
- Without it, YouTube fallback won't work
- Spotify is the primary source anyway

### Testing Steps

1. **Check the error message:**
   - Search for a song
   - Look for the red error box
   - It will tell you exactly what's wrong

2. **Check browser console:**
   - Press F12 → Console tab
   - Search for a song
   - Look for "Spotify response:" logs
   - These show what the API returned

3. **Check Vercel logs:**
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on `/api/search-music`
   - Check for errors in the logs

### Quick Test

Try searching for: **"Eye of the Tiger"**

If you see:
- ✅ **Results appear** → Everything is working!
- ❌ **Error message** → Follow the steps above
- ❌ **"No results found"** → Try a different song (some songs don't have previews)

### Still Not Working?

1. Make sure you **redeployed** after adding environment variables
2. Check that environment variables are set for **Production** (not just Preview)
3. Wait a few minutes - Vercel can take time to update environment variables
4. Try clearing your browser cache and searching again


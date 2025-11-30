# Verify Spotify Setup is Working

## Step 1: Redeploy Your App

**Important:** Environment variables only take effect after redeployment!

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **jacked-app** project
3. Go to **Deployments** tab
4. Find your latest deployment
5. Click the **"..."** menu (three dots) on the right
6. Click **Redeploy**
7. Wait for deployment to complete (usually 1-2 minutes)

## Step 2: Verify Environment Variables

Make sure both variables are set for **Production**:

1. Go to **Settings** → **Environment Variables**
2. Verify you see:
   - ✅ `SPOTIFY_CLIENT_ID` (with a value)
   - ✅ `SPOTIFY_CLIENT_SECRET` (with a value)
3. Both should have **Production** checked ✅

## Step 3: Test the Search

1. Go to your app: `https://app.jackedlifting.com`
2. Create a new post
3. Click **"Add Song"** → **"Search"** tab
4. Search for: **"Eye of the Tiger"**
5. You should see results with album artwork! 🎉

## Step 4: Check Browser Console (Optional)

If it's still not working:

1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Search for a song
4. Look for: `Spotify response: {...}`
5. Check what it says:
   - ✅ `tracks: [...]` → Working!
   - ❌ `error: "not configured"` → Credentials not set correctly
   - ❌ `error: "access token"` → Wrong credentials

## Step 5: Check Vercel Logs (If Still Not Working)

1. Go to Vercel → Your Project → **Functions**
2. Click on `/api/search-music`
3. Check recent invocations
4. Look for errors in the logs

## Common Issues

### "Still says not configured"
- Make sure you **redeployed** after adding variables
- Wait 2-3 minutes after redeploy
- Hard refresh browser (Ctrl+Shift+R)

### "Access token error"
- Double-check Client ID and Secret are correct
- Make sure no extra spaces when copying
- Try regenerating credentials in Spotify Dashboard

### "No results found"
- Try a different song (some don't have previews)
- Check browser console for specific errors
- Verify credentials are correct


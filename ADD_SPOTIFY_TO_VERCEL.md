# Add Spotify API Credentials to Vercel

## Step-by-Step Instructions

### Step 1: Get Your Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click on your app (the one you created earlier)
4. You'll see:
   - **Client ID** (a long string like `abc123def456...`)
   - **Client Secret** (click "View client secret" to reveal it)
5. **Copy both values** - you'll need them in the next step

### Step 2: Add to Vercel Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your **jacked-app** project
3. Click **Settings** (in the top navigation)
4. Click **Environment Variables** (in the left sidebar)
5. You'll see a list of existing environment variables

### Step 3: Add SPOTIFY_CLIENT_ID

1. In the "Key" field, type: `SPOTIFY_CLIENT_ID`
2. In the "Value" field, paste your **Client ID** from Spotify
3. **Important:** Check the boxes for:
   - ✅ **Production**
   - ✅ **Preview** (optional, but recommended)
   - ✅ **Development** (optional, for local testing)
4. Click **Save**

### Step 4: Add SPOTIFY_CLIENT_SECRET

1. Click **Add New** again
2. In the "Key" field, type: `SPOTIFY_CLIENT_SECRET`
3. In the "Value" field, paste your **Client Secret** from Spotify
4. **Important:** Check the boxes for:
   - ✅ **Production**
   - ✅ **Preview** (optional, but recommended)
   - ✅ **Development** (optional, for local testing)
5. Click **Save**

### Step 5: Redeploy Your App

**Important:** Environment variables only take effect after redeployment!

1. Go to **Deployments** tab (in the top navigation)
2. Find your latest deployment
3. Click the **"..."** menu (three dots) on the right
4. Click **Redeploy**
5. Wait for the deployment to complete (usually 1-2 minutes)

### Step 6: Test

1. Go to your app: `https://app.jackedlifting.com`
2. Create a new post
3. Click "Add Song" → "Search" tab
4. Search for: **"Eye of the Tiger"**
5. You should now see results! 🎉

## Verification Checklist

After adding credentials, verify:

- [ ] `SPOTIFY_CLIENT_ID` is in Vercel environment variables
- [ ] `SPOTIFY_CLIENT_SECRET` is in Vercel environment variables
- [ ] Both are checked for **Production** environment
- [ ] You've **redeployed** the app
- [ ] Deployment completed successfully

## Troubleshooting

### "Still not working after redeploy"

1. **Wait 2-3 minutes** - Vercel needs time to update
2. **Hard refresh** your browser (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check Vercel logs:**
   - Go to Vercel → Your Project → Functions
   - Click on `/api/search-music`
   - Check recent invocations for errors

### "I can't see my Client Secret"

- In Spotify Dashboard, click **"View client secret"** button
- It will show the secret (you can only see it once, so copy it immediately)
- If you lost it, you'll need to **reset** it in Spotify Dashboard

### "Environment variables not showing up"

- Make sure you're looking at the **correct project** in Vercel
- Make sure you clicked **Save** after adding each variable
- Try refreshing the Vercel page

## Quick Test Command

After redeploying, you can test if it's working by opening browser console (F12) and running:

```javascript
fetch('/api/search-music?q=eye%20of%20the%20tiger')
  .then(r => r.json())
  .then(data => {
    if (data.error) {
      console.error('Error:', data.error)
    } else {
      console.log('Success! Found', data.tracks?.length || 0, 'tracks')
    }
  })
```

**Expected result:** `Success! Found X tracks` (where X > 0)


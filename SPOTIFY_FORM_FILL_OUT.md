# Spotify Developer Dashboard - Form Fill Out Guide

## Step-by-Step Instructions

### 1. Website
✅ **Already filled:** `app.jackedlifting.com`
- This is correct, leave it as is

### 2. Redirect URIs (Required - even though we don't use OAuth)

Click "Add" button for each of these:

**For Local Development:**
```
http://localhost:3000
```

**For Production:**
```
https://app.jackedlifting.com
```

**Note:** Even though we use client credentials flow (not OAuth user login), Spotify requires at least one redirect URI. These won't actually be used, but they're required by the form.

### 3. Which API/SDKs are you planning to use?

✅ **Check:** "Web API"
- This is what we use for searching songs

❌ **Don't check:** Web Playback SDK, Android, Ads API, iOS
- We don't need these for our use case

### 4. Terms Checkbox

✅ **Check:** "I understand and agree with Spotify's Developer Terms of Service and Design Guidelines"
- Required to save the app

## After Saving

1. You'll see your **Client ID** and **Client Secret**
2. Copy both values
3. Add them to Vercel:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add:
     - `SPOTIFY_CLIENT_ID` = (your Client ID)
     - `SPOTIFY_CLIENT_SECRET` = (your Client Secret)
4. Redeploy your app

## Why These Settings?

- **Website:** Your app's domain
- **Redirect URIs:** Required by Spotify (even if unused)
- **Web API:** We use this to search for songs and get preview URLs
- **No OAuth needed:** We use client credentials, so users don't log into Spotify


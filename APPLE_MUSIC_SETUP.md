# Apple Music API Setup Guide

Apple Music API provides working preview URLs (30-second clips) that can be played in-app, unlike Spotify which deprecated preview URLs.

## Steps to Set Up:

### 1. Get Apple Developer Account
- Go to https://developer.apple.com
- Sign up for Apple Developer Program ($99/year)
- Or use existing account

### 2. Create MusicKit Key
1. Go to https://developer.apple.com/account/resources/identifiers/list
2. Click "+" to create new Key
3. Enable "MusicKit" service
4. Download the `.p8` key file (you can only download once!)
5. Note the Key ID shown

### 3. Generate Developer Token (JWT)
You need to create a JWT token. Here's a Node.js script to generate it:

```javascript
const jwt = require('jsonwebtoken');
const fs = require('fs');

const teamId = 'YOUR_TEAM_ID'; // From Apple Developer account
const keyId = 'YOUR_KEY_ID'; // From step 2
const privateKey = fs.readFileSync('path/to/AuthKey_KEYID.p8');

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d', // Tokens last 6 months
  issuer: teamId,
  header: {
    alg: 'ES256',
    kid: keyId
  }
});

console.log(token);
```

### 4. Add to Vercel Environment Variables
- Go to Vercel → Your Project → Settings → Environment Variables
- Add: `APPLE_MUSIC_DEVELOPER_TOKEN` = (the JWT token from step 3)
- Optional: `APPLE_MUSIC_USER_TOKEN` (for user-specific content, requires OAuth)

### 5. Update Music Search Component
The API route is already created at `/app/api/search-apple-music/route.ts`

You'll need to update `components/MusicSearch.tsx` to use Apple Music instead of (or in addition to) Spotify.

## Alternative: SoundCloud API

SoundCloud also has embeddable players. Setup:
1. Go to https://developers.soundcloud.com
2. Create app
3. Get Client ID
4. Use SoundCloud API for search and embed player

## Alternative: Deezer API

Deezer has preview clips. Setup:
1. Go to https://developers.deezer.com
2. Register app
3. Get App ID
4. Use Deezer API for search

## Recommendation

**Apple Music API** is the best option because:
- ✅ Preview URLs actually work (30-second clips)
- ✅ No user authentication needed for previews
- ✅ Good catalog coverage
- ✅ High quality previews

**Downside:** Requires $99/year Apple Developer account


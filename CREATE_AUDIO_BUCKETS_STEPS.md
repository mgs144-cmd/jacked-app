# Create Audio Storage Buckets - Quick Steps

## The Problem

When uploading MP3 files, you're getting: **"No bucket could be found"**

This is because the storage buckets don't exist yet in Supabase.

## Solution: Create 2 Buckets

### Step 1: Go to Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Click **Storage** in the left sidebar

### Step 2: Create `post-songs` Bucket

1. Click **"New bucket"** button
2. **Name:** `post-songs` (exactly this, no spaces)
3. **Public bucket:** ✅ **CHECK THIS** (very important!)
4. Click **"Create bucket"**

### Step 3: Create `profile-songs` Bucket

1. Click **"New bucket"** again
2. **Name:** `profile-songs` (exactly this, no spaces)
3. **Public bucket:** ✅ **CHECK THIS** (very important!)
4. Click **"Create bucket"**

### Step 4: Set Up RLS Policies (Optional but Recommended)

1. Go to **SQL Editor** in Supabase
2. Copy and paste the contents of `CREATE_AUDIO_BUCKETS.sql`
3. Click **Run**

This allows authenticated users to upload audio files.

## Verify It Works

1. Go to your app
2. Create a post → "Add Song" → "Upload" tab
3. Upload an MP3 file
4. It should work now! ✅

## Important Notes

- **Bucket names must be exact:** `post-songs` and `profile-songs` (with hyphens, lowercase)
- **Both must be PUBLIC** - otherwise files won't be accessible
- **No Spotify setup needed** - these buckets are just for direct MP3 uploads
- **Spotify search** uses preview URLs directly (no upload needed)

## Troubleshooting

### "Bucket not found" error
- ✅ Make sure bucket names are exactly `post-songs` and `profile-songs`
- ✅ Check they're marked as PUBLIC
- ✅ Refresh your app and try again

### "Permission denied" error
- ✅ Run the RLS policies from `CREATE_AUDIO_BUCKETS.sql`
- ✅ Make sure you're logged in

### Upload works but audio won't play
- ✅ Check the bucket is PUBLIC
- ✅ Check the file URL in browser console
- ✅ Try a different MP3 file


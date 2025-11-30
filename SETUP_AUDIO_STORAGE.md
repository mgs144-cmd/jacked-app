# Setup Audio Storage for Music Playback

## Step 1: Run SQL Migration

Run `SETUP_MUSIC.sql` in Supabase SQL Editor to add the music columns.

## Step 2: Create Storage Buckets

1. Go to **Supabase Dashboard** → **Storage**
2. Create these buckets (both must be **PUBLIC**):
   - `post-songs` - For audio files in posts
   - `profile-songs` - For profile music

3. For each bucket:
   - Click "New bucket"
   - Name: `post-songs` (or `profile-songs`)
   - **Make it PUBLIC** (important!)
   - Click "Create bucket"

## Step 3: Set Up RLS Policies (Optional but Recommended)

Run this SQL to allow authenticated users to upload:

```sql
-- Allow authenticated users to upload to post-songs
CREATE POLICY "Users can upload audio to post-songs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-songs');

-- Allow authenticated users to upload to profile-songs
CREATE POLICY "Users can upload audio to profile-songs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-songs');

-- Allow public read access (since buckets are public)
CREATE POLICY "Public can read post-songs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-songs');

CREATE POLICY "Public can read profile-songs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-songs');
```

## Step 4: Test

1. Create a post
2. Click "Add Song"
3. Choose "Upload" tab
4. Upload an MP3 file
5. The audio should play when you click the play button!

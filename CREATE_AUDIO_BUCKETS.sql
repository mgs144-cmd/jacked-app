-- Create Audio Storage Buckets in Supabase
-- This SQL creates the buckets, but you still need to make them PUBLIC in the Supabase Dashboard

-- Note: Storage buckets are created via the Supabase Dashboard, not SQL
-- But we can set up RLS policies here

-- Step 1: Go to Supabase Dashboard → Storage → Create these buckets:
--   1. Name: "post-songs" - Make it PUBLIC
--   2. Name: "profile-songs" - Make it PUBLIC

-- Step 2: After creating the buckets, run the policies below:

-- Allow authenticated users to upload to post-songs
CREATE POLICY IF NOT EXISTS "Users can upload audio to post-songs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-songs');

-- Allow authenticated users to upload to profile-songs
CREATE POLICY IF NOT EXISTS "Users can upload audio to profile-songs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-songs');

-- Allow public read access (since buckets are public)
CREATE POLICY IF NOT EXISTS "Public can read post-songs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-songs');

CREATE POLICY IF NOT EXISTS "Public can read profile-songs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-songs');

-- Allow users to delete their own files
CREATE POLICY IF NOT EXISTS "Users can delete own audio from post-songs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-songs' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY IF NOT EXISTS "Users can delete own audio from profile-songs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-songs' AND (storage.foldername(name))[1] = auth.uid()::text);


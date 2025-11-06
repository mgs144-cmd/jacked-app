# Storage Bucket Setup Instructions

## Issue: "new row violates row-level security policy" when uploading images

This error occurs because the Supabase storage buckets don't have the correct RLS policies set up.

## Fix Steps

### Step 1: Create Storage Buckets in Supabase Dashboard

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Storage** in the left sidebar
4. Create three buckets if they don't exist:

#### Create `images` bucket:
- Click "New bucket"
- Name: `images`
- **Public bucket**: ✅ **YES** (Check this box)
- File size limit: 5 MB (or your preference)
- Allowed MIME types: `image/*`
- Click "Create bucket"

#### Create `videos` bucket:
- Click "New bucket"
- Name: `videos`
- **Public bucket**: ✅ **YES** (Check this box)
- File size limit: 50 MB (or your preference)
- Allowed MIME types: `video/*`
- Click "Create bucket"

#### Create `avatars` bucket:
- Click "New bucket"
- Name: `avatars`
- **Public bucket**: ✅ **YES** (Check this box)
- File size limit: 2 MB (or your preference)
- Allowed MIME types: `image/*`
- Click "Create bucket"

### Step 2: Run RLS Policies SQL

1. Go to **SQL Editor** in your Supabase Dashboard
2. Click "New query"
3. Copy and paste the entire contents of `FIX_STORAGE_RLS.sql`
4. Click "Run" or press Cmd/Ctrl + Enter
5. You should see "Success. No rows returned"

### Step 3: Verify Bucket Settings

1. Go back to **Storage** in the left sidebar
2. Click on each bucket (`images`, `videos`, `avatars`)
3. Click the "Policies" tab
4. You should see policies like:
   - "Authenticated users can upload [bucket name]"
   - "Public can view [bucket name]"
   - "Users can delete their own [bucket name]"

### Step 4: Test Upload

1. Refresh your app at http://localhost:3000
2. Try creating a post with an image
3. The upload should now work!

## Troubleshooting

### Still getting RLS error?

1. **Check bucket is public:**
   - Storage > Click bucket name > Configuration tab
   - "Public bucket" should be set to **ON**

2. **Check policies exist:**
   - Storage > Click bucket name > Policies tab
   - Should have INSERT, SELECT, and DELETE policies

3. **Clear and re-run policies:**
   ```sql
   -- Drop all policies for a bucket (replace 'images' with your bucket)
   DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
   DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
   DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
   
   -- Then re-run the CREATE POLICY statements from FIX_STORAGE_RLS.sql
   ```

4. **Check authentication:**
   - Make sure you're logged in
   - Check browser console for auth errors

### Alternative: Disable RLS (Not Recommended for Production)

If you're just testing and want to quickly bypass RLS:

```sql
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: This allows anyone to upload/delete files. Only use for local development!

## Additional Notes

- The policies use `auth.uid()` to ensure users can only delete their own uploads
- Public read access allows anyone to view the images (needed for public posts)
- You can adjust file size limits in the Storage bucket settings



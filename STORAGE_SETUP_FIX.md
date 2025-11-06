# Storage Setup - Correct Method

## Error: "must be owner of table objects"

This error happens because `storage.objects` is a system table. You need to use the Storage UI instead of raw SQL.

## ✅ Correct Setup Method

### Step 1: Create Storage Buckets

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **Storage** in the left sidebar

#### Create the `images` bucket:
1. Click **"New bucket"**
2. Name: `images`
3. **Public bucket**: ✅ **CHECK THIS BOX** (very important!)
4. Click **"Create bucket"**

#### Create the `videos` bucket:
1. Click **"New bucket"**
2. Name: `videos`
3. **Public bucket**: ✅ **CHECK THIS BOX**
4. Click **"Create bucket"**

#### Create the `avatars` bucket:
1. Click **"New bucket"**
2. Name: `avatars`
3. **Public bucket**: ✅ **CHECK THIS BOX**
4. Click **"Create bucket"**

### Step 2: Set Up Policies via UI

For **each bucket** (images, videos, avatars), do this:

1. Click on the bucket name
2. Go to the **"Policies"** tab (near Configuration)
3. Click **"New Policy"**

#### Policy 1: Allow authenticated users to upload

1. Click **"New Policy"**
2. Choose **"Custom"** or **"For full customization"**
3. Policy name: `Allow authenticated uploads`
4. Allowed operation: **INSERT**
5. Target roles: `authenticated`
6. WITH CHECK expression:
   ```sql
   bucket_id = 'images'
   ```
   (Change 'images' to 'videos' or 'avatars' for those buckets)
7. Click **"Review"** then **"Save policy"**

#### Policy 2: Allow public to view

1. Click **"New Policy"** again
2. Choose **"For SELECT operations"** template
3. Policy name: `Allow public to view`
4. Target roles: `public`
5. USING expression:
   ```sql
   bucket_id = 'images'
   ```
   (Change 'images' to 'videos' or 'avatars' for those buckets)
6. Click **"Review"** then **"Save policy"**

#### Policy 3: Allow users to delete their own files

1. Click **"New Policy"**
2. Choose **"Custom"**
3. Policy name: `Allow users to delete their own files`
4. Allowed operation: **DELETE**
5. Target roles: `authenticated`
6. USING expression:
   ```sql
   bucket_id = 'images' AND (storage.foldername(name))[1] = auth.uid()::text
   ```
   (Change 'images' to 'videos' or 'avatars' for those buckets)
7. Click **"Review"** then **"Save policy"**

### Step 3: Verify Setup

After setting up all three buckets:

1. Go back to Storage main page
2. You should see 3 buckets: `images`, `videos`, `avatars`
3. Each should show as **Public**
4. Click on each bucket → Policies tab
5. Should see 3 policies per bucket (INSERT, SELECT, DELETE)

## Alternative: Use Supabase's Policy Templates

Supabase has built-in templates that make this easier:

1. Go to Storage → Click bucket → Policies tab
2. Click **"New Policy"**
3. Choose a template:
   - **"Allow public read access"** - For viewing
   - **"Allow authenticated users to upload"** - For uploading
   - **"Allow users to delete their own files"** - For deleting

The templates will auto-generate the correct expressions.

## Quick Test

Try uploading an image:

1. Refresh your app (hard refresh: Cmd/Ctrl + Shift + R)
2. Go to Create Post
3. Try uploading an image
4. Should work now!

## Still Getting Errors?

### Error: "new row violates row-level security"

**Solution:**
- Make sure **Public bucket** is checked ✅
- Verify policies exist in the Policies tab
- Check that INSERT policy uses `authenticated` role

### Error: "File upload failed"

**Solution:**
1. Check bucket name matches code (`images`, `videos`, `avatars`)
2. Verify bucket is Public
3. Check browser console for detailed error
4. Try re-creating the bucket

### Error: "Cannot read properties of null"

**Solution:**
- The bucket might not exist
- Go to Storage and verify all 3 buckets are created
- Make sure names are exact: `images` (not `image`), `videos` (not `video`)

## Summary Checklist

- [ ] Created `images` bucket (Public ✅)
- [ ] Created `videos` bucket (Public ✅)
- [ ] Created `avatars` bucket (Public ✅)
- [ ] Added INSERT policy to `images` bucket
- [ ] Added SELECT policy to `images` bucket
- [ ] Added DELETE policy to `images` bucket
- [ ] Added INSERT policy to `videos` bucket
- [ ] Added SELECT policy to `videos` bucket
- [ ] Added DELETE policy to `videos` bucket
- [ ] Added INSERT policy to `avatars` bucket
- [ ] Added SELECT policy to `avatars` bucket
- [ ] Added DELETE policy to `avatars` bucket
- [ ] Tested uploading an image in the app

## Why Not Use SQL?

The `storage.objects` table is managed by Supabase's Storage service and has special permissions. Regular users (even project owners in the SQL Editor) don't have direct ALTER TABLE permissions on system tables.

The Storage UI is the official way to manage storage policies.

## Need Help?

If you're still stuck:
1. Check Supabase docs: https://supabase.com/docs/guides/storage/security/access-control
2. Verify environment variables are set correctly
3. Check browser console for errors
4. Make sure you're logged in to the app



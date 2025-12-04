# Quick Storage Bucket Policies Setup

Your `media` bucket is PUBLIC but has no policies. You need to create policies for uploads to work.

## Step-by-Step Instructions

1. **In Supabase Dashboard → Storage → Buckets**
   - You should see the `MEDIA` bucket (it's PUBLIC ✓)

2. **Click on the `MEDIA` bucket** (or click "New policy" next to it)

3. **Click "New policy"** button

4. **Create these 4 policies one by one:**

### Policy 1: Allow Public Read (SELECT)
- **Policy name:** `Public read access`
- **Allowed operation:** `SELECT`
- **Policy definition:**
  ```
  bucket_id = 'media'
  ```
- Click **Save**

### Policy 2: Allow Authenticated Upload (INSERT)
- Click **New policy** again
- **Policy name:** `Authenticated users can upload`
- **Allowed operation:** `INSERT`
- **Policy definition:**
  ```
  bucket_id = 'media' AND auth.role() = 'authenticated'
  ```
- Click **Save**

### Policy 3: Allow Authenticated Update (UPDATE)
- Click **New policy** again
- **Policy name:** `Authenticated users can update`
- **Allowed operation:** `UPDATE`
- **Policy definition:**
  ```
  bucket_id = 'media' AND auth.role() = 'authenticated'
  ```
- Click **Save**

### Policy 4: Allow Authenticated Delete (DELETE)
- Click **New policy** again
- **Policy name:** `Authenticated users can delete`
- **Allowed operation:** `DELETE`
- **Policy definition:**
  ```
  bucket_id = 'media' AND auth.role() = 'authenticated'
  ```
- Click **Save**

## After Creating Policies

1. You should see 4 policies listed under the `MEDIA` bucket
2. Try uploading the banner image again in Settings
3. It should work now!

## Alternative: Disable RLS on Storage (Not Recommended)

If you want to skip policies entirely, you can disable RLS on storage, but this is less secure:
- Go to SQL Editor
- Run: `ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;`
- This allows all operations but removes security

**Recommendation:** Use the policies above instead for better security.


# Storage Bucket Setup Instructions

Since you can't modify `storage.objects` policies via SQL (requires admin access), you need to set up storage bucket policies through the Supabase Dashboard.

## Step 1: Verify the `media` Bucket Exists

1. Go to Supabase Dashboard → **Storage**
2. Check if a bucket named `media` exists
3. If it doesn't exist:
   - Click **New bucket**
   - Name: `media`
   - **Make it PUBLIC** (important!)
   - Click **Create bucket**

## Step 2: Set Up Storage Bucket Policies

1. In Storage, click on the `media` bucket
2. Go to the **Policies** tab
3. You should see policies for:
   - **SELECT** (read access)
   - **INSERT** (upload access)
   - **UPDATE** (update access)
   - **DELETE** (delete access)

### If policies don't exist, create them:

#### Policy 1: Public Read Access
- **Policy Name:** `Public read access`
- **Allowed Operation:** SELECT
- **Policy Definition:**
  ```sql
  bucket_id = 'media'
  ```

#### Policy 2: Authenticated Upload
- **Policy Name:** `Authenticated users can upload`
- **Allowed Operation:** INSERT
- **Policy Definition:**
  ```sql
  bucket_id = 'media' AND auth.role() = 'authenticated'
  ```

#### Policy 3: Authenticated Update
- **Policy Name:** `Authenticated users can update`
- **Allowed Operation:** UPDATE
- **Policy Definition:**
  ```sql
  bucket_id = 'media' AND auth.role() = 'authenticated'
  ```

#### Policy 4: Authenticated Delete
- **Policy Name:** `Authenticated users can delete`
- **Allowed Operation:** DELETE
- **Policy Definition:**
  ```sql
  bucket_id = 'media' AND auth.role() = 'authenticated'
  ```

## Step 3: Quick Setup (Alternative)

If the bucket is set to **PUBLIC**, you might not need all these policies. Try this:

1. Make sure the `media` bucket is **PUBLIC**
2. That's it! Public buckets allow uploads by default for authenticated users

## Step 4: Test

After setting up:
1. Try uploading a banner image in Settings
2. Check the browser console for any errors
3. If you see storage errors, verify the bucket is PUBLIC


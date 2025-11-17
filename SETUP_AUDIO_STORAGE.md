# Setup Audio Storage Buckets

To enable in-app audio playback (like Instagram), you need to create two storage buckets in Supabase:

## Step 1: Create Storage Buckets

1. **Go to Supabase Dashboard** → **Storage**
2. **Click "New bucket"**

### Bucket 1: `post-songs`
- **Name**: `post-songs`
- **Public**: ✅ **Yes** (so audio can be played in the app)
- **File size limit**: 10 MB
- **Allowed MIME types**: `audio/*`

### Bucket 2: `profile-songs`
- **Name**: `profile-songs`
- **Public**: ✅ **Yes** (so audio can be played in the app)
- **File size limit**: 10 MB
- **Allowed MIME types**: `audio/*`

## Step 2: Set Up RLS Policies

After creating the buckets, you need to set up Row Level Security (RLS) policies so users can upload and read audio files.

### For `post-songs` bucket:

1. Go to **Storage** → **post-songs** → **Policies**
2. Click **"New Policy"** → **"For full customization"**

**Policy 1: Allow authenticated users to upload**
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
bucket_id = 'post-songs' AND auth.role() = 'authenticated'
```

**Policy 2: Allow public read access**
- **Policy name**: `Allow public read`
- **Allowed operation**: `SELECT`
- **Policy definition**:
```sql
bucket_id = 'post-songs'
```

**Policy 3: Allow users to delete their own files**
- **Policy name**: `Allow users to delete own files`
- **Allowed operation**: `DELETE`
- **Policy definition**:
```sql
bucket_id = 'post-songs' AND auth.uid()::text = (storage.foldername(name))[1]
```

### For `profile-songs` bucket:

Repeat the same 3 policies but change `bucket_id` to `'profile-songs'`:

**Policy 1: Allow authenticated users to upload**
- **Policy name**: `Allow authenticated uploads`
- **Allowed operation**: `INSERT`
- **Policy definition**:
```sql
bucket_id = 'profile-songs' AND auth.role() = 'authenticated'
```

**Policy 2: Allow public read access**
- **Policy name**: `Allow public read`
- **Allowed operation**: `SELECT`
- **Policy definition**:
```sql
bucket_id = 'profile-songs'
```

**Policy 3: Allow users to delete their own files**
- **Policy name**: `Allow users to delete own files`
- **Allowed operation**: `DELETE`
- **Policy definition**:
```sql
bucket_id = 'profile-songs' AND auth.uid()::text = (storage.foldername(name))[1]
```

## Step 3: Test It!

1. Go to **Settings** → **PROFILE SONG**
2. Click **"Add Song"**
3. Toggle to **"Upload Audio File"**
4. Upload an MP3 file
5. The file should upload and play directly in the app! 🎵

## Notes

- **File size limit**: 10MB per file (you can increase this in bucket settings)
- **Supported formats**: MP3, WAV, M4A, OGG, etc. (any audio format)
- **Auto-play**: May be blocked by browsers, but users can click play
- **Storage costs**: Audio files count toward your Supabase storage quota



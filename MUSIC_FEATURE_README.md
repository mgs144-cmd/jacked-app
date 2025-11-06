# Music Feature Implementation Guide

## Overview

The music feature allows users to:
1. Add songs to their posts (like Instagram)
2. Set a profile anthem/song on their profile page

## Database Setup

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `ADD_MUSIC_FEATURE.sql`
4. Copy and paste the entire content
5. Click "Run" to execute

This will:
- Add song fields to the `posts` table
- Add profile song fields to the `profiles` table
- Create a `songs` table for song catalog
- Set up necessary RLS policies

### Step 2: Verify the Migration

Run this query to verify the columns were added:

```sql
-- Check posts table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name LIKE 'song%';

-- Check profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%song%';
```

You should see:
- `posts`: `song_title`, `song_artist`, `song_url`, `song_cover_url`
- `profiles`: `profile_song_title`, `profile_song_artist`, `profile_song_url`

## Features Implemented

### 1. Add Song to Post
- When creating a post, users can optionally add a song
- Song information includes: title, artist, and URL (Spotify/Apple Music/YouTube)
- Songs appear on post cards with a music icon and play button

### 2. View Songs on Posts
- Posts with songs display a music section between the header and media
- Users can click "PLAY" to open the song URL in a new tab
- Music section has a gradient red background with icon

### 3. Delete Posts
- Post owners can now delete their posts
- Click the "..." menu in the top right of your own posts
- Confirms before deletion
- Automatically removes associated media from storage

## Usage

### Adding a Song to a Post

1. Go to Create Post page
2. Fill in your caption and/or upload media
3. Click "Add Song (Optional)"
4. Enter:
   - Song title (required)
   - Artist name (required)
   - Song URL (optional) - Spotify, Apple Music, YouTube, etc.
5. Click "ADD SONG"
6. Post as usual

### Deleting a Post

1. Find your post in the feed or on your profile
2. Click the three dots (⋮) in the top right corner
3. Click "Delete Post"
4. Confirm the deletion
5. Post will be removed along with all likes and comments

## Future Enhancements

### Coming Soon:
1. **Profile Anthem**: Set a song on your profile that auto-plays when someone visits
2. **Song Search Integration**: Search Spotify/Apple Music API instead of manual entry
3. **Song Previews**: Play 30-second previews directly in the app
4. **Popular Songs**: See what songs the community is working out to
5. **Playlist Generation**: Auto-generate workout playlists from popular posts

### Integration Ideas:
- Spotify Web API integration for song search
- Apple Music API for iOS users
- YouTube API for music videos
- SoundCloud for independent artists

## Troubleshooting

### Songs not showing on posts?

1. Check that you ran the `ADD_MUSIC_FEATURE.sql` migration
2. Verify columns exist in the database
3. Refresh your browser (hard refresh: Cmd/Ctrl + Shift + R)

### Can't delete posts?

1. Make sure you're the post owner (only your posts show the delete option)
2. Check browser console for errors
3. Verify RLS policies allow deletion for post owners

### Storage RLS errors?

1. Follow the `STORAGE_SETUP_INSTRUCTIONS.md` guide
2. Run `FIX_STORAGE_RLS.sql` in SQL Editor
3. Make sure storage buckets are set to public

## Notes

- Song URLs are optional - users can just add title/artist for reference
- Songs are stored as text fields, not actual audio files
- The feature is designed to link to external music services
- Future versions will support direct audio playback



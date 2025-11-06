# Social Features Setup Guide

## Overview

The social features include:
- ✅ **Following System** - Follow/unfollow users
- ✅ **Post Privacy** - Public or followers-only posts
- ✅ **Personalized Feed** - See posts from people you follow
- ✅ **Discover Page** - Find new users to follow
- ✅ **User Profiles** - View other users' profiles
- ✅ **Follower/Following Counts** - See social stats

## Database Setup

### Step 1: Run the SQL Migration

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `ADD_SOCIAL_FEATURES.sql`
4. Copy and paste the entire content
5. Click "Run" to execute

This will:
- Create the `follows` table
- Add `is_private` column to `posts` table
- Add `followers_count` and `following_count` to `profiles` table
- Set up RLS policies for privacy and following
- Create triggers to auto-update follower counts

### Step 2: Verify the Migration

Run this query to verify:

```sql
-- Check follows table exists
SELECT * FROM follows LIMIT 1;

-- Check posts has privacy field
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name = 'is_private';

-- Check profiles has social counts
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('followers_count', 'following_count');
```

## Features Explained

### 1. Following System

**How it works:**
- Users can follow other users
- Following is one-way (like Twitter/Instagram)
- Can't follow yourself
- Follower/following counts auto-update

**User Flow:**
1. Go to **Discover** page (new nav item)
2. Browse users
3. Click "FOLLOW" button
4. Button changes to "FOLLOWING"
5. Can unfollow by clicking "FOLLOWING"

### 2. Post Privacy

**Two privacy levels:**
- 🌍 **Public** - Everyone can see (default)
- 🔒 **Followers Only** - Only your followers can see

**Creating private posts:**
1. Go to Create Post
2. Toggle privacy selector
3. Choose "FOLLOWERS ONLY"
4. Post as usual

**Viewing private posts:**
- You see all your own posts
- You see private posts from users you follow
- You DON'T see private posts from users you don't follow

### 3. Personalized Feed

**What you see in your feed:**
- ✅ Your own posts
- ✅ Public posts from users you follow
- ✅ Private posts from users you follow
- ❌ Posts from users you don't follow (except on their profile)

**How it works:**
- Feed automatically filters based on who you follow
- If you don't follow anyone, you only see your own posts
- Follow more people to see more content!

### 4. Discover Page

**Features:**
- Browse all users
- See "Suggested For You" (users with most followers)
- Follow/unfollow directly from cards
- Search users (coming soon)

**Access:** Click "Discover" in the navigation bar

### 5. User Profiles

**View other users' profiles:**
- Click on any username or avatar
- See their bio, stats, and posts
- Follow/unfollow from their profile
- View their public posts (and private if you follow them)

**Profile Stats:**
- Number of posts
- Followers count (clickable)
- Following count (clickable)
- Total likes received

## User Interface

### New Navigation Item
- **Discover** button added to navbar (Users icon)
- Located between Feed and Create Post

### Privacy Indicator
- Posts show privacy level when creating
- Lock icon for private posts
- Globe icon for public posts

### Follow Buttons
- Red gradient button for "FOLLOW"
- Gray button for "FOLLOWING"
- Updates in real-time

## Privacy & Security

### RLS Policies

**Posts Table:**
- Users see public posts from everyone
- Users see private posts from followed users only
- Users always see their own posts

**Follows Table:**
- Anyone can see who follows who (public information)
- Only you can create/delete your own follows
- Can't follow yourself

### Data Protection

- Follower counts cached in `profiles` table for performance
- Counts auto-update via database triggers
- Following relationships stored securely

## Troubleshooting

### Feed is empty?

**If you're not seeing posts:**
1. You might not be following anyone yet
2. Go to Discover page
3. Follow some users
4. Refresh feed

### Can't follow users?

**Check these:**
1. Make sure you ran `ADD_SOCIAL_FEATURES.sql`
2. Check browser console for errors
3. Verify you're logged in
4. Try refreshing the page

### Privacy not working?

**Verify:**
1. `is_private` column exists in `posts` table
2. RLS policies are active
3. You're following the user whose private posts you want to see

### Follower counts wrong?

**Fix it:**
```sql
-- Recalculate all follower counts
UPDATE profiles p
SET 
  followers_count = (SELECT COUNT(*) FROM follows WHERE following_id = p.id),
  following_count = (SELECT COUNT(*) FROM follows WHERE follower_id = p.id);
```

## Future Enhancements

### Coming Soon:
1. **Follow Requests** - Private accounts that require approval
2. **User Search** - Search by username or name
3. **Block Users** - Prevent specific users from seeing your content
4. **Notifications** - Get notified when someone follows you
5. **Mutual Followers** - See who follows you back
6. **Following Feed** - Separate feed for close friends
7. **Hashtags** - Tag posts and discover by topic
8. **Mentions** - @mention users in posts

## Testing Checklist

- [ ] Run `ADD_SOCIAL_FEATURES.sql` in Supabase
- [ ] Create a test account
- [ ] Follow the test account from your main account
- [ ] Create a public post on test account
- [ ] Create a private post on test account
- [ ] Verify main account sees both posts in feed
- [ ] Unfollow test account
- [ ] Verify main account only sees public post now
- [ ] Go to Discover page
- [ ] Verify you can see and follow users
- [ ] Check follower/following counts update correctly

## Notes

- Following system is **one-way** (not mutual like Facebook friends)
- Post privacy defaults to **public**
- You can change privacy when creating a post
- Can't change privacy after posting (would need edit feature)
- All public posts are visible on user profiles
- Private posts only visible to followers

## Database Schema

### `follows` table
```sql
- id (uuid, primary key)
- follower_id (uuid, references profiles)
- following_id (uuid, references profiles)
- created_at (timestamp)
```

### `posts` table additions
```sql
- is_private (boolean, default false)
```

### `profiles` table additions
```sql
- followers_count (integer, default 0)
- following_count (integer, default 0)
```



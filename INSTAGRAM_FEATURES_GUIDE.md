# Instagram-Style Social Features

## Overview

Your app now has Instagram-style social features including:
- ✅ **Private/Public Accounts** - Control who can follow you
- ✅ **Follow Requests** - Approve followers for private accounts
- ✅ **Hide Follower Counts** - Option to hide stats
- ✅ **Smart Feed Algorithm** - Following posts first, then discover public posts
- ✅ **Fixed Follow Button** - Works correctly with private accounts

## Setup Instructions

### Step 1: Run the Database Migration

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `UPGRADE_SOCIAL_FEATURES.sql`
3. Click "Run"
4. You should see success messages

This creates:
- `is_account_private` column in profiles
- `hide_follower_count` column in profiles
- `follow_requests` table for private account requests
- Updated RLS policies for privacy
- Auto-accept triggers for public accounts

### Step 2: Deploy the New Code

```bash
git add .
git commit -m "Add Instagram-style social features"
git push origin main
vercel --prod
```

## Features Explained

### 1. Private/Public Accounts

**How it works:**
- **Public Account (default)**: Anyone can follow immediately
- **Private Account**: Followers must be approved

**User Flow:**
1. Go to Settings → Privacy Settings
2. Toggle "Private Account"
3. Save settings

**For Private Accounts:**
- New followers send a "follow request"
- You see requests and can approve/deny them
- Only approved followers see your posts
- Profile photo and username are always public

### 2. Follow Requests

**When someone tries to follow a private account:**
1. They click "REQUEST" button
2. Request goes to target user
3. Target user can approve or deny
4. On approval, they become a follower

**Request States:**
- 🟡 **Pending**: Waiting for approval
- ✅ **Accepted**: Now following
- ❌ **Rejected**: Request denied

### 3. Hide Follower Count

**Privacy option:**
- Hide your follower/following numbers from profile
- You can still see your own counts
- Others see your profile without numbers

**To enable:**
1. Settings → Privacy Settings
2. Toggle "Hide Follower Count"
3. Save

### 4. Smart Feed Algorithm (Instagram-style)

**Feed shows posts in this order:**
1. **Your own posts** (top priority)
2. **Posts from people you follow** (next 30 posts)
3. **Public posts from everyone else** (discover new content)

**This means:**
- You always see your friends' latest posts first
- Once you've seen everything new from friends, discover new people
- Private account posts only show to their followers
- Empty feed? Follow more people!

### 5. Enhanced Follow Button

**Button states:**
- 🔵 **FOLLOW** - For public accounts (instant follow)
- 🔒 **REQUEST** - For private accounts (sends request)
- ⏳ **REQUESTED** - Request pending approval
- ✅ **FOLLOWING** - Currently following

### 6. Profile Privacy Indicators

**On profiles:**
- 🔒 Lock icon for private accounts
- Follower counts hidden if user enabled that option
- "Request to follow" message if private and not following

## New Pages

### Privacy Settings Page
**Location:** `/settings/privacy`

**Features:**
- Toggle private account on/off
- Toggle hide follower count
- See explanations of each setting
- Instant save

**Access:** Settings → Privacy Settings button

## Database Schema

### New Columns in `profiles`:
```sql
- is_account_private (boolean, default false)
- hide_follower_count (boolean, default false)
```

### New Table `follow_requests`:
```sql
- id (uuid)
- requester_id (uuid) - Who wants to follow
- target_id (uuid) - Who they want to follow
- status ('pending', 'accepted', 'rejected')
- created_at (timestamp)
- updated_at (timestamp)
```

## User Experience Examples

### Example 1: Following a Public Account
1. User A clicks "FOLLOW" on User B's profile
2. Instantly becomes a follower
3. Button changes to "FOLLOWING"
4. User A sees User B's posts in feed

### Example 2: Following a Private Account
1. User A clicks "REQUEST" on User C's profile (private)
2. Follow request is sent
3. Button changes to "REQUESTED"
4. User C sees the request notification (future feature)
5. User C approves the request
6. User A becomes a follower
7. Button changes to "FOLLOWING"
8. User A now sees User C's posts

### Example 3: Feed Experience
**User A follows 5 people:**
- Opens feed
- Sees latest posts from those 5 people (sorted by time)
- Scrolls down
- After seeing all friend posts, sees public posts from others
- Discovers new accounts to follow

## Troubleshooting

### Following not working?

1. **Check if you ran the SQL migration:**
   ```sql
   SELECT * FROM follow_requests LIMIT 1;
   ```
   Should return a table, not an error.

2. **Check account privacy:**
   ```sql
   SELECT id, username, is_account_private FROM profiles;
   ```

3. **Clear browser cache and hard refresh**

### Feed is empty?

1. Make sure you're following people (go to Discover page)
2. Check if people you follow have posts
3. Public posts should still show even if you don't follow anyone

### Private account not working?

1. Verify `is_account_private` is `true` in database
2. Check RLS policies are applied
3. Test with two different accounts

## Future Enhancements

Coming soon:
- [ ] Notifications for follow requests
- [ ] Follow request inbox/management page
- [ ] Bulk approve/deny requests
- [ ] "Suggested for you" based on mutual follows
- [ ] Close friends list
- [ ] Story-style temporary posts

## Testing Checklist

- [ ] Run `UPGRADE_SOCIAL_FEATURES.sql` in Supabase
- [ ] Deploy code to Vercel
- [ ] Create two test accounts
- [ ] Make Account B private
- [ ] Try to follow Account B from Account A
- [ ] Should see "REQUESTED" button
- [ ] Approve request manually in database
- [ ] Verify Account A can now see Account B's posts
- [ ] Test hiding follower count
- [ ] Test feed showing following posts first

## Notes

- Private accounts are **opt-in** (default is public)
- Follow requests auto-accept for public accounts
- Changing to private doesn't remove existing followers
- All profile photos and usernames are public
- Post privacy and account privacy work together:
  - Public account + public post = everyone sees
  - Public account + private post = only followers see
  - Private account + any post = only approved followers see


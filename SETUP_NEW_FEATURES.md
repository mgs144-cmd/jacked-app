# Setup Instructions for New Instagram-Style Features

## ⚠️ IMPORTANT: Database Migration Required

Your follow button isn't working because you need to run a database migration first!

## Step-by-Step Setup

### 1. Run the Database Migration

1. Open Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file `UPGRADE_SOCIAL_FEATURES.sql` in your code editor
6. Copy **ALL** the SQL code (Cmd+A, Cmd+C)
7. Paste it into the Supabase SQL Editor
8. Click **Run** (or press Cmd+Enter)
9. Wait for the success message

**What this does:**
- Creates `follow_requests` table for private accounts
- Adds `is_account_private` and `hide_follower_count` columns to profiles
- Sets up automatic triggers for public vs private follows
- Updates RLS policies for privacy features

### 2. Test the Follow Button

After running the migration:

1. **Refresh your localhost page** (hard refresh: Cmd+Shift+R)
2. Try clicking "FOLLOW" on a user
3. You should see:
   - Button changes to "FOLLOWING" immediately
   - Works without needing to refresh the page
   - If the account is private, shows "REQUESTED" instead

### 3. Test Private Accounts

1. Go to **Settings → Privacy Settings**
2. Toggle "Private Account" ON
3. Save
4. Have a friend try to follow you
5. They should see "REQUESTED" instead of immediate follow

### 4. Deploy to Production

Once it works locally:

```bash
# Commit all changes
git add .
git commit -m "Add Instagram-style social features"
git push origin main

# Deploy to Vercel
vercel --prod
```

**Don't forget:** After deploying, run the same SQL migration in your **production** Supabase database!

## Troubleshooting

### Follow button does nothing
✅ **Solution:** Run `UPGRADE_SOCIAL_FEATURES.sql` in Supabase SQL Editor

### Error: "relation 'follow_requests' does not exist"
✅ **Solution:** You didn't run the migration. See Step 1 above.

### Follow works but privacy settings don't show
✅ **Solution:** Run the migration. The privacy settings page requires new columns.

### Changes don't appear after clicking follow
✅ **Solution:** Try hard refresh (Cmd+Shift+R) or clear browser cache

### Private account but instant follow happens
✅ **Solution:** Check that `is_account_private` is actually `true` in your database

## Features Checklist

After setup, you should have:

- ✅ Follow/Unfollow users instantly
- ✅ Private account option in Settings
- ✅ Follow requests for private accounts  
- ✅ Hide follower count option
- ✅ Smart feed (friends first, then discover)
- ✅ Follower/following counts on profiles
- ✅ Button states (FOLLOW, FOLLOWING, REQUESTED)

## Need Help?

If you're still having issues:

1. Check browser console for errors (F12 → Console)
2. Check Supabase logs (Dashboard → Logs)
3. Verify tables exist: `SELECT * FROM follow_requests LIMIT 1;`
4. Verify columns exist: `SELECT is_account_private FROM profiles LIMIT 1;`

## Next: Test on localhost before deploying!

```bash
# Kill any running dev server
pkill -f "next dev"

# Start fresh
npm run dev

# Open http://localhost:3000
# Try following someone
# Should work instantly!
```


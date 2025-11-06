# Database Setup Instructions

Follow these steps **in order** to set up your Supabase database.

## Step 1: Create All Tables (Run First!)

1. Go to Supabase Dashboard → **SQL Editor**
2. Open the file `DATABASE_SCHEMA.sql` from your project
3. **Copy the ENTIRE contents** of `DATABASE_SCHEMA.sql`
4. Paste it into the SQL Editor
5. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

This will create:
- ✅ `profiles` table
- ✅ `posts` table
- ✅ `likes` table
- ✅ `comments` table
- ✅ All indexes
- ✅ Automatic profile creation trigger
- ✅ Row Level Security policies

**Wait for it to complete successfully!**

## Step 2: Verify Tables Were Created

1. In Supabase Dashboard, go to **Table Editor**
2. You should see these tables:
   - `profiles`
   - `posts`
   - `likes`
   - `comments`

If you see all 4 tables, proceed to Step 3.

## Step 3: Run RLS Policy Fix (If Needed)

**Only run this if you get an error about missing INSERT policy!**

1. Go to **SQL Editor** again
2. Copy the contents of `FIX_RLS_POLICY.sql`
3. Paste and run it

**Note:** The full `DATABASE_SCHEMA.sql` already includes the INSERT policy, so you might not need this step.

## Step 4: Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Click **New bucket**
3. Name: `media`
4. **Make it PUBLIC** (important!)
5. Click **Create bucket**

## Troubleshooting

### "relation does not exist" error
- ✅ You haven't run `DATABASE_SCHEMA.sql` yet
- ✅ Run Step 1 first!

### "policy already exists" error
- ✅ The policy is already there, that's fine!
- ✅ You can ignore this error

### Tables not showing up
- ✅ Refresh the Table Editor page
- ✅ Check SQL Editor for any error messages
- ✅ Make sure you ran the ENTIRE `DATABASE_SCHEMA.sql` file

## Quick Checklist

Before testing signup, make sure:
- [ ] All 4 tables exist (profiles, posts, likes, comments)
- [ ] Storage bucket `media` exists and is public
- [ ] No errors in SQL Editor
- [ ] Email confirmation is disabled (Authentication → Settings)


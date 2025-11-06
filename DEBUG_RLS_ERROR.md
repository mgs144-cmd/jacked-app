# Debugging RLS Policy Error

## Step-by-Step Debugging

### Step 1: Check if the Policy Exists

Run this in Supabase SQL Editor:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';
```

**What you should see:**
- At least 3 policies:
  - "Profiles are viewable by everyone" (SELECT)
  - "Users can insert their own profile" (INSERT)
  - "Users can update their own profile" (UPDATE)

**If you DON'T see the INSERT policy, continue to Step 2.**

### Step 2: Check if RLS is Enabled

Run this:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
```

**What you should see:**
- `rowsecurity` should be `true`

### Step 3: Create the INSERT Policy (If Missing)

Run this EXACT SQL (copy all of it):

```sql
-- First, drop any existing policy with this name
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create the policy
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**Important:** Make sure you see "Success" after running this.

### Step 4: Verify the Policy

Run this again:

```sql
SELECT policyname, cmd, with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'INSERT';
```

**You should see:**
- `policyname`: "Users can insert their own profile"
- `cmd`: "INSERT"
- `with_check`: "((auth.uid() = id))"

### Step 5: Check the Trigger

The database schema has a trigger that creates a profile automatically. Let's check if it exists:

```sql
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';
```

**If you see a trigger, that's good.** But we might need to handle the conflict.

### Common Issues

1. **Policy exists but syntax is wrong**
   - Solution: Drop and recreate it (Step 3)

2. **RLS is disabled**
   - Solution: Run `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`

3. **Trigger conflict**
   - The trigger creates a profile, but the code also tries to insert
   - Solution: We might need to update the code to use UPDATE instead of INSERT

4. **User ID mismatch**
   - The `auth.uid()` might not match the user ID during signup
   - Solution: Check if user is authenticated before insert

## Quick Fix: Test the Policy

Try this test query (replace `YOUR_USER_ID` with a UUID from auth.users):

```sql
-- This should work if policy is correct
-- (You'll need to be logged in as that user)
SET request.jwt.claim.sub = 'YOUR_USER_ID';
INSERT INTO profiles (id, username) 
VALUES ('YOUR_USER_ID', 'test');
```

## Alternative: Use UPDATE Instead of INSERT

If the trigger already creates a profile, we can modify the code to UPDATE instead of INSERT. But let's first verify the policy exists correctly.


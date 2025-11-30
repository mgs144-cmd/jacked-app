# How to Set Up Your Admin Account

## Option 1: Set Admin Email (Recommended)

1. **Create your account** on the app (sign up normally)
2. **Go to Vercel** → Settings → Environment Variables
3. **Add:**
   ```
   ADMIN_EMAIL=your-email@example.com
   ```
   (Use the email you signed up with)
4. **Redeploy** your app
5. **Go to** `/admin` - You should now have access!

## Option 2: Set Admin Flag in Database

1. **Create your account** on the app
2. **Go to Supabase** → SQL Editor
3. **Run this SQL:**
   ```sql
   UPDATE profiles 
   SET is_admin = true 
   WHERE email = 'your-email@example.com';
   ```
   (Replace with your actual email)
4. **Go to** `/admin` - You should now have access!

## Option 3: First User Access (Temporary)

If `ADMIN_EMAIL` is not set in Vercel, the admin page will allow access to anyone (for initial setup). 

**⚠️ Important:** Set `ADMIN_EMAIL` in Vercel as soon as possible for security!

## Quick Setup Steps

1. ✅ Sign up with your admin email
2. ✅ Add `ADMIN_EMAIL` to Vercel environment variables
3. ✅ Redeploy app
4. ✅ Go to `/admin` and approve users!

---

**After setup, only users with the admin email (or `is_admin = true`) can access `/admin`.**


# Testing Checklist - Is Your App Ready?

## ✅ Database Setup (You've Done This!)
- [x] All tables created (profiles, posts, likes, comments)
- [x] Storage bucket `media` created and set to public
- [x] RLS policies set up

## 🔧 Configuration Check

### 1. Supabase Settings
- [ ] Email confirmation is **DISABLED** (Authentication → Settings)
- [ ] Your Supabase project URL and keys are in your environment variables

### 2. Environment Variables

**For Local Development:**
Check your `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**For Production (Vercel):**
- [ ] Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- [ ] Verify all variables are set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (if using payments)
  - `STRIPE_SECRET_KEY` (if using payments)
  - `STRIPE_WEBHOOK_SECRET` (if using payments)
  - `NEXT_PUBLIC_APP_URL`

## 🧪 Test Your App

### Test Locally First:
```bash
npm run dev
```

Then test these features:

1. **Sign Up**
   - [ ] Go to `/auth/signup`
   - [ ] Create a new account
   - [ ] Should redirect to `/feed` immediately (no email confirmation)

2. **Login**
   - [ ] Log out
   - [ ] Log back in with your account
   - [ ] Should work without errors

3. **Create Post**
   - [ ] Go to `/create`
   - [ ] Upload an image or video
   - [ ] Add a caption
   - [ ] Submit
   - [ ] Should appear in feed

4. **Feed**
   - [ ] Go to `/feed`
   - [ ] See your post
   - [ ] Like a post (should work)
   - [ ] Click to view post details

5. **Comments**
   - [ ] Click on a post
   - [ ] Add a comment
   - [ ] Comment should appear

6. **Profile**
   - [ ] Go to `/profile`
   - [ ] See your profile info
   - [ ] See your posts

7. **Settings**
   - [ ] Go to `/settings`
   - [ ] Update your profile
   - [ ] Upload avatar
   - [ ] Changes should save

## 🚨 Common Issues

### "Failed to sign up" or RLS error
- ✅ Make sure you ran the full `DATABASE_SCHEMA.sql`
- ✅ Check that INSERT policy exists for profiles table

### "Email confirmation required"
- ✅ Disable email confirmation in Supabase: Authentication → Settings

### Media upload fails
- ✅ Check storage bucket `media` exists and is **PUBLIC**
- ✅ Verify bucket name is exactly `media`

### "Unauthorized" errors
- ✅ Check environment variables are set correctly
- ✅ Verify Supabase URL and keys are correct

## 🚀 Ready to Deploy?

Once all tests pass locally:

1. **Commit and push:**
   ```bash
   git add .
   git commit -m "Ready for production"
   git push
   ```

2. **Vercel will auto-deploy**

3. **Test on production URL:**
   - Try signing up on your live site
   - Verify everything works

## 📝 No Code Changes Needed!

The code is already set up correctly. You just need to:
1. ✅ Database tables (DONE)
2. ✅ Storage bucket (DONE)
3. ✅ Environment variables (CHECK)
4. ✅ Email confirmation disabled (CHECK)
5. ✅ Test locally (DO THIS)

If everything works locally, you're ready to share!


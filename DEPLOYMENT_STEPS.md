# Deployment Steps - Make Changes Live

## Step 1: Run Database Migration (IMPORTANT!)

Before deploying, you **MUST** run the database migration in Supabase:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `COMPLETE_FEATURES_MIGRATION.sql`
3. Copy the **entire contents**
4. Paste and click **Run**

This creates all the new tables and columns needed for the features.

---

## Step 2: Commit and Push to GitHub

### Option A: Using Terminal (Recommended)

```bash
# Navigate to project
cd /Users/chippersnyder/Desktop/jacked-app

# Check what files changed
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "Add all new features: PR posts, workout details, badges, fitness goals, GIF comments, image cropping, post editing"

# Push to GitHub
git push
```

### Option B: Using GitHub Desktop or VS Code

1. Open GitHub Desktop (or use VS Code's Source Control)
2. Review all the changed files
3. Write a commit message: "Add all new features: PR posts, workout details, badges, fitness goals, GIF comments, image cropping, post editing"
4. Click "Commit"
5. Click "Push" to upload to GitHub

---

## Step 3: Deploy to Vercel

### If you have auto-deploy enabled:
- Vercel will automatically deploy when you push to GitHub
- Check your Vercel dashboard for the deployment status
- Usually takes 2-5 minutes

### If you need to deploy manually:

```bash
# Make sure you're in the project directory
cd /Users/chippersnyder/Desktop/jacked-app

# Deploy to production
vercel --prod
```

---

## Step 4: Add Environment Variables (If Needed)

If you added new API keys (Giphy, Stripe), add them to Vercel:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Add:
   - `GIPHY_API_KEY` (if using GIF feature)
   - `STRIPE_SECRET_KEY` (if using payment feature)
   - `STRIPE_WEBHOOK_SECRET` (if using payment feature)
3. **Redeploy** after adding variables

---

## Step 5: Verify Deployment

1. Visit your production URL (from Vercel)
2. Test the new features:
   - Create a PR post
   - Add workout details
   - Edit a post
   - Change post privacy
   - Upload and crop a profile photo
   - Add GIFs to comments (if GIPHY_API_KEY is set)

---

## Quick Checklist

- [ ] Run `COMPLETE_FEATURES_MIGRATION.sql` in Supabase
- [ ] Commit all changes to git
- [ ] Push to GitHub
- [ ] Wait for Vercel auto-deploy (or run `vercel --prod`)
- [ ] Add environment variables if needed
- [ ] Test on production URL

---

## Troubleshooting

### "Column doesn't exist" errors
→ You haven't run the database migration yet. Run `COMPLETE_FEATURES_MIGRATION.sql`

### Build fails on Vercel
→ Check the build logs for TypeScript errors. Usually means a file has a syntax error.

### Features not working
→ Make sure:
- Database migration ran successfully
- Environment variables are set (if needed)
- Browser cache is cleared (hard refresh: Cmd+Shift+R)

---

## Need Help?

If something goes wrong:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify database migration ran successfully
4. Make sure all environment variables are set


# Fix GIFs Not Working on Mobile (Production)

The GIF picker works on your computer (localhost) but not on mobile because the `GIPHY_API_KEY` environment variable is only in your local `.env.local` file, not in Vercel (production).

## Fix: Add GIPHY_API_KEY to Vercel

1. Go to **Vercel Dashboard** (vercel.com)
2. Select your project (`jacked-app`)
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Add:
   - **Name:** `GIPHY_API_KEY`
   - **Value:** (your Giphy API key - same as in your local `.env.local`)
   - **Environment:** Check all (Production, Preview, Development)
6. Click **Save**

## Redeploy

After adding the environment variable:
1. Go to **Deployments** tab
2. Click the **•••** menu on the latest deployment
3. Click **Redeploy**

Or just push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy for GIPHY_API_KEY"
git push
```

## Get Your Giphy API Key

If you don't have a Giphy API key yet:

1. Go to [developers.giphy.com](https://developers.giphy.com/)
2. Sign up / Log in
3. Create a new app
4. Copy your API key
5. Add it to both:
   - Local: `.env.local` (you already have this)
   - Production: Vercel environment variables (follow steps above)

After redeploying, GIFs should work on mobile.


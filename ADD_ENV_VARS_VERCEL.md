# How to Add Environment Variables to Vercel

## Method 1: Web UI (Step-by-Step)

### Step 1: Go to Environment Variables Page

1. Go to https://vercel.com
2. Click your project: **jacked-app**
3. Click **Settings** (top navigation)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add STRIPE_SECRET_KEY

1. Find the input fields (should be at the top)
2. **Key field:** Type exactly (no quotes):
   ```
   STRIPE_SECRET_KEY
   ```
3. **Value field:** Paste your key:
   ```
   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
   ```
4. **Environment checkboxes:** Check ALL THREE:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development
5. Click **"Save"** button (blue button, usually on the right)

### Step 3: Add STRIPE_WEBHOOK_SECRET

1. Click **"Add New"** or look for another row of inputs
2. **Key field:** Type exactly:
   ```
   STRIPE_WEBHOOK_SECRET
   ```
3. **Value field:** Paste your secret:
   ```
   whsec_HRqrEdkFBKQPHGePoUH5SFu0dLQHlAnl
   ```
4. **Environment checkboxes:** Check ALL THREE:
   - ☑ Production
   - ☑ Preview
   - ☑ Development
5. Click **"Save"** button

---

## Method 2: Vercel CLI (Easier Alternative)

If the web UI isn't working, use the command line:

### Step 1: Install Vercel CLI (if needed)

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Add Variables

Run these commands one at a time:

```bash
# Add STRIPE_SECRET_KEY
vercel env add STRIPE_SECRET_KEY production preview development

# When prompted, paste your key:
# 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

# Add STRIPE_WEBHOOK_SECRET
vercel env add STRIPE_WEBHOOK_SECRET production preview development

# When prompted, paste your secret:
# whsec_HRqrEdkFBKQPHGePoUH5SFu0dLQHlAnl
```

---

## Common Issues

### "No environment variables were created"

**Check:**
1. ✅ Key name has NO spaces: `STRIPE_SECRET_KEY` (not `STRIPE SECRET KEY`)
2. ✅ Value is NOT empty (you pasted the full key)
3. ✅ At least ONE environment is checked
4. ✅ You clicked "Save" (not just pressed Enter)
5. ✅ No special characters in key name (only letters, numbers, underscores)

### Variables not showing up

**Try:**
1. Refresh the page (F5)
2. Check different environment tabs
3. Make sure you're in the right project
4. Clear browser cache

### Still not working?

**Use Method 2 (CLI)** - It's more reliable!

---

## After Adding Variables

### Important: Redeploy!

Variables only apply to NEW deployments. You need to:

1. Go to **Deployments** tab
2. Find your latest deployment
3. Click **"..."** (three dots menu)
4. Click **"Redeploy"**

OR

Push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

---

## Verify It Worked

After redeploying, check:

1. Go to **Deployments** → Latest deployment
2. Click on it to see build logs
3. Look for your variables (they won't show values, but should be listed)
4. Or check the app - payment should work now!

---

## Quick Test

After adding variables and redeploying:

1. Go to your signup page
2. Create a test account
3. You should be redirected to Stripe checkout
4. If you see Stripe checkout, it's working! ✅

---

## Your Current Keys (from env.local)

Based on your local file, you should add:

**STRIPE_SECRET_KEY:**
```
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
```

**STRIPE_WEBHOOK_SECRET:**
```
whsec_HRqrEdkFBKQPHGePoUH5SFu0dLQHlAnl
```

**Note:** You're using LIVE keys (`sk_live_...`), which means real payments. Make sure that's what you want!

For testing, you might want to use TEST keys first (`sk_test_...`).

---

Try the CLI method if the web UI keeps failing - it's usually more reliable!


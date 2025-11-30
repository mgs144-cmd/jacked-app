# Fix: Vercel Environment Variables Not Creating

## Step-by-Step Instructions

### Step 1: Navigate to Environment Variables

1. Go to [vercel.com](https://vercel.com)
2. Click on your project (jacked-app)
3. Click **Settings** (top menu)
4. Click **Environment Variables** (left sidebar)

### Step 2: Add First Variable

1. In the **"Key"** field, type exactly:
   ```
   STRIPE_SECRET_KEY
   ```
   (No spaces, all caps, underscores)

2. In the **"Value"** field, paste your Stripe secret key:
   ```
   sk_test_51ABC123...your_full_key_here
   ```

3. Select **Environment(s)**:
   - ✅ **Production**
   - ✅ **Preview** 
   - ✅ **Development**
   
   (Or just check all three to be safe)

4. Click **"Save"** button

### Step 3: Add Second Variable

1. Click **"Add New"** button (or there should be another input row)

2. In the **"Key"** field, type:
   ```
   STRIPE_WEBHOOK_SECRET
   ```

3. In the **"Value"** field, paste your webhook secret:
   ```
   whsec_...your_webhook_secret_here
   ```

4. Select **Environment(s)**:
   - ✅ **Production**
   - ✅ **Preview**
   - ✅ **Development**

5. Click **"Save"** button

---

## Common Issues & Fixes

### Issue 1: "No environment variables were created"

**Possible causes:**
- Key name has spaces or typos
- Value field is empty
- Didn't select any environments
- Didn't click "Save"

**Fix:**
- Make sure key is exactly: `STRIPE_SECRET_KEY` (no quotes)
- Make sure value is pasted (not empty)
- Check at least one environment checkbox
- Click the "Save" button (not just Enter)

### Issue 2: Can't see "Add New" button

**Fix:**
- Look for a "+" button or "Add" button
- Sometimes it's at the bottom of the list
- Try refreshing the page

### Issue 3: Variables not showing up

**Fix:**
- Refresh the page
- Check if they're in a different environment tab
- Make sure you're looking at the right project

---

## Visual Guide

The form should look like this:

```
┌─────────────────────────────────────┐
│ Key: STRIPE_SECRET_KEY              │
│ Value: sk_test_51ABC...             │
│ Environments: ☑ Production          │
│              ☑ Preview              │
│              ☑ Development          │
│ [Save]                               │
└─────────────────────────────────────┘
```

---

## Alternative: Using Vercel CLI

If the web UI isn't working, use the command line:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Add variables
vercel env add STRIPE_SECRET_KEY
# (It will prompt you to paste the value)

vercel env add STRIPE_WEBHOOK_SECRET
# (It will prompt you to paste the value)
```

---

## Verify Variables Are Added

After adding, you should see them in the list:

```
STRIPE_SECRET_KEY        [Production, Preview, Development]
STRIPE_WEBHOOK_SECRET    [Production, Preview, Development]
```

---

## Important Notes

1. **Don't include quotes** around the key or value
2. **Key must match exactly** (case-sensitive)
3. **Value should be the full key** (don't truncate it)
4. **Redeploy after adding** - Variables only apply to new deployments

---

## After Adding Variables

1. Go to **Deployments** tab
2. Click the **"..."** menu on latest deployment
3. Click **"Redeploy"**
4. Or push a new commit to trigger redeploy

Variables are only active after redeployment!

---

## Still Having Issues?

1. **Check browser console** for errors (F12)
2. **Try different browser** (Chrome, Firefox, Safari)
3. **Clear browser cache** and try again
4. **Use Vercel CLI** method instead
5. **Check Vercel status** - might be a temporary issue

---

## Quick Checklist

- [ ] Key name is exactly: `STRIPE_SECRET_KEY` (no quotes)
- [ ] Value is pasted (not empty)
- [ ] At least one environment is checked
- [ ] Clicked "Save" button
- [ ] Variables appear in the list
- [ ] Redeployed the app

Try these steps and let me know if it still doesn't work!


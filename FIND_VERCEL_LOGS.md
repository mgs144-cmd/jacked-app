# How to Find Vercel Function Logs

## Where to Look

### Option 1: Deployment Logs (Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Deployments** tab (top menu)
4. Click on the **latest deployment** (most recent one)
5. You'll see the build logs - scroll down to see function logs

### Option 2: Function Logs (Real-time)

1. Go to Vercel Dashboard → Your Project
2. Click **Functions** tab (in the top menu, next to Deployments)
3. Look for `/api/create-onboarding-checkout`
4. Click on it to see logs

### Option 3: Runtime Logs

1. Go to Vercel Dashboard → Your Project
2. Click **Logs** tab (in the top menu)
3. Filter by function name: `create-onboarding-checkout`
4. You'll see real-time logs

## If You Don't See the Function

### Check 1: Is the file in the right place?

The file should be at:
```
app/api/create-onboarding-checkout/route.ts
```

### Check 2: Did it deploy?

1. Go to Deployments → Latest
2. Check if the build was successful
3. Look for any errors during build

### Check 3: Check Browser Console Instead

If you can't find Vercel logs, check the browser:

1. Open your app
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Try to make a payment
5. Look for error messages

### Check 4: Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Try to make a payment
4. Look for a request to `/api/create-onboarding-checkout`
5. Click on it to see the response

## Quick Test

1. Try to make a payment on your app
2. Open browser DevTools (F12)
3. Go to **Network** tab
4. Look for `/api/create-onboarding-checkout` request
5. Click it → Check **Response** tab
6. This will show you the error message

## Alternative: Check Vercel CLI

If you have Vercel CLI installed:

```bash
vercel logs --follow
```

This shows real-time logs from your deployment.

---

**The easiest way:** Check the browser Network tab when you try to pay - it will show you the exact error!


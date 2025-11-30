# How to Verify Your Paddle API Key

## Is Your API Key Correct?

If you generated the API key yourself in Paddle Dashboard, it should be fine, but let's verify:

### Step 1: Check API Key Status

1. Go to Paddle Dashboard → Developer Tools → Authentication
2. Find your API key in the list
3. Check:
   - ✅ **Status** should be "Active"
   - ✅ **Expires** should be in the future
   - ✅ **Key** should start with `pdl_live_` or `pdl_test_`

### Step 2: Verify Key Permissions

When you generated the key, you should have selected permissions. Make sure you have:
- ✅ **Transactions** (Create & Read)
- ✅ **Webhooks** (Read & Manage)
- ✅ **Customers** (Read & Create)

If you're not sure, you can:
- Click the three dots (⋯) next to your API key
- Check permissions or regenerate with correct permissions

### Step 3: Check Vercel Environment Variable

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Find `PADDLE_API_KEY`
3. Make sure:
   - ✅ It's set (not empty)
   - ✅ It matches your key from Paddle (full key, not masked)
   - ✅ No extra spaces or quotes
   - ✅ It's the same mode (test/live) as your Paddle dashboard

### Step 4: Test the API Key

You can test if your API key works by checking Vercel function logs:

1. Try to make a payment
2. Go to Vercel → Deployments → Latest → Functions
3. Check `/api/create-onboarding-checkout` logs
4. Look for any errors

## Common Issues

### Issue 1: Key Not Copied Fully
- Paddle masks keys with `****`
- Make sure you clicked to **reveal** and copied the **full key**
- The full key should be long (50+ characters)

### Issue 2: Wrong Mode
- If you're testing, use **Test Mode** keys (`pdl_test_`)
- If you're in production, use **Live Mode** keys (`pdl_live_`)
- Make sure Vercel has the right mode key

### Issue 3: Key Not Active
- Check if key status is "Active" in Paddle Dashboard
- If it's revoked or expired, generate a new one

### Issue 4: Permissions Missing
- Regenerate the key with all required permissions
- Or create a new key with full access

## Quick Test

To verify your key works:

1. Make sure `PADDLE_API_KEY` is set in Vercel
2. Redeploy your app
3. Try the payment again
4. Check browser console (F12) for errors
5. Check Vercel function logs

## If Still Not Working

If the key looks correct but still getting errors:

1. **Regenerate the key:**
   - In Paddle Dashboard, create a new API key
   - Select all permissions
   - Copy the full key
   - Update in Vercel
   - Redeploy

2. **Check Paddle account status:**
   - Make sure your Paddle account is fully set up
   - Complete any verification steps

3. **Try Test Mode:**
   - Switch to Test Mode in Paddle
   - Generate test keys
   - Use test keys in Vercel
   - Test the payment flow

---

**The API key you generated should work!** The issue is more likely:
- Key not set in Vercel
- Wrong format in Vercel (extra spaces/quotes)
- Need to redeploy after adding key
- API request format issue (we can fix this)


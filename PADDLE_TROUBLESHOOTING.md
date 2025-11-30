# Paddle "Invalid Request" Error - Troubleshooting

If you're seeing "invalid request" when clicking "Pay $0.99", here's how to fix it:

## Common Causes

### 1. **API Key Not Set in Vercel**
- Go to Vercel → Settings → Environment Variables
- Make sure `PADDLE_API_KEY` is set
- **Redeploy** after adding/updating

### 2. **Wrong API Key Format**
- Make sure you copied the **full key** (not just the visible part)
- Keys should start with `pdl_live_` or `pdl_test_`
- Check for extra spaces or quotes

### 3. **Paddle API Structure Issue**
The API format might need adjustment. Check Vercel logs:
1. Go to Vercel Dashboard
2. Your Project → Deployments → Latest
3. Click **Functions** tab
4. Find `/api/create-onboarding-checkout`
5. Check the logs for the actual error

### 4. **Test Mode vs Live Mode**
- Make sure you're using **Test Mode** keys for testing
- Toggle to Test Mode in Paddle Dashboard
- Use keys that start with `pdl_test_`

## How to Debug

### Step 1: Check Vercel Logs
1. Go to Vercel Dashboard
2. Your Project → Deployments
3. Click on latest deployment
4. **Functions** tab
5. Look for `/api/create-onboarding-checkout`
6. Check error messages

### Step 2: Check Browser Console
1. Open DevTools (F12)
2. Go to **Console** tab
3. Try to pay again
4. Look for error messages
5. Check **Network** tab for the API call

### Step 3: Verify API Key
1. In Paddle Dashboard → Developer Tools → Authentication
2. Make sure your API key is **Active**
3. Copy it again (full key)
4. Update in Vercel
5. Redeploy

## Quick Fixes

### Fix 1: Re-add API Key
1. Copy your full Paddle API key
2. Go to Vercel → Environment Variables
3. Delete `PADDLE_API_KEY`
4. Add it again (make sure no extra spaces)
5. Redeploy

### Fix 2: Check Paddle Account Status
1. Go to Paddle Dashboard
2. Check if account is fully set up
3. Complete any verification steps
4. Make sure you're in the right mode (Test/Live)

### Fix 3: Try Test Mode
1. In Paddle Dashboard, toggle to **Test Mode**
2. Generate new test API keys
3. Update Vercel with test keys
4. Redeploy
5. Test again

## What the Error Means

"Invalid request" usually means:
- ❌ API key is missing or wrong
- ❌ Request format doesn't match Paddle's API
- ❌ Account not fully set up
- ❌ Wrong API endpoint

## Next Steps

After checking logs, you'll see the actual error. Common errors:
- `401 Unauthorized` → API key issue
- `400 Bad Request` → Request format issue
- `404 Not Found` → Wrong API endpoint

Share the error from Vercel logs and I can help fix it!


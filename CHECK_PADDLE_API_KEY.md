# Quick Check: Is Your Paddle API Key Correct?

## Verify These Things:

### 1. **API Key Format**
Your Paddle API key should:
- ✅ Be **69 characters long**
- ✅ Start with `pdl_`
- ✅ Contain `apikey_`
- ✅ Include `sdbx_` (sandbox/test) or `live_` (production)

Example format: `pdl_live_apikey_01xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 2. **In Vercel Environment Variables**
- ✅ Go to Vercel → Settings → Environment Variables
- ✅ `PADDLE_API_KEY` should be set
- ✅ Value should be your **full key** (all 69 characters)
- ✅ **No quotes** around the value
- ✅ **No extra spaces** before/after

### 3. **Key Status in Paddle**
- ✅ Go to Paddle Dashboard → Developer Tools → Authentication
- ✅ Your key should show **Status: Active**
- ✅ Should not be expired

### 4. **Permissions**
When you generated the key, you should have selected:
- ✅ Transactions (Create & Read)
- ✅ Webhooks (Read & Manage)
- ✅ Customers (Read & Create)

## Quick Test

1. **Check if key is set:**
   - Vercel → Environment Variables
   - Make sure `PADDLE_API_KEY` exists and has a value

2. **Check key format:**
   - Should start with `pdl_`
   - Should be long (69 characters)

3. **Redeploy:**
   - After verifying, **redeploy** your app
   - Environment variables only take effect after redeploy

4. **Check logs:**
   - Try payment again
   - Go to Vercel → Functions → `/api/create-onboarding-checkout`
   - Look for logs showing the API request

## If Still Not Working

The issue might be the **API request format**, not your key. The improved logging I just added will show:
- If the API key is being read
- What request is being sent to Paddle
- What error Paddle returns

**Try the payment again and check Vercel function logs** - you should now see detailed logging!


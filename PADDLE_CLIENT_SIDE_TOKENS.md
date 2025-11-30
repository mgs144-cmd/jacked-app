# Paddle Client-Side Tokens Setup

## What You Should See

In the **"Client-side tokens"** tab, you should see:

1. **Existing tokens** (if any)
2. **"+ New Client-side token"** button (if you need to create one)

## What to Do

### If You See Existing Tokens:

1. **Copy the token value** - It will look like `pdl_ctkn_...` or similar
2. This is your `PADDLE_PUBLIC_KEY`
3. Add it to Vercel as `PADDLE_PUBLIC_KEY`

### If You Don't See Any Tokens (or Need to Create One):

1. Click **"+ New Client-side token"** button
2. You might be asked for:
   - **Name** (e.g., "Jacked App Public Key")
   - **Permissions** (usually auto-selected, but you can leave defaults)
3. Click **"Create"** or **"Generate"**
4. **Copy the token immediately** - You won't see it again!
5. This is your `PADDLE_PUBLIC_KEY`

## What You Need Now

You should have:

1. ✅ **PADDLE_API_KEY** = `pdl_live_apikey_01kb9ec8my...` (the one you generated)
2. ✅ **PADDLE_PUBLIC_KEY** = `pdl_ctkn_...` (from Client-side tokens tab)

## Important Notes

- **Client-side tokens** are safe to use in frontend code
- They're different from API keys (which are secret)
- You might not need the public key for basic checkout (but good to have)

## For Your Integration

Actually, for the checkout flow I built, you might only need:
- ✅ **PADDLE_API_KEY** (for server-side checkout creation)
- ⚠️ **PADDLE_PUBLIC_KEY** (optional - only if using Paddle.js in frontend)

Since we're using server-side checkout (redirecting to Paddle's hosted checkout), the public key might not be strictly necessary, but it's good to have it set up.

## Next Steps

1. ✅ Copy your API key (you already have this)
2. ✅ Get/create your client-side token (from this tab)
3. ✅ Add both to Vercel environment variables
4. ✅ Set up webhook (next step)

---

**What do you see in the Client-side tokens tab?** Let me know and I'll help you with the next step!


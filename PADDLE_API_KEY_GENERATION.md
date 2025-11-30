# How to Generate Paddle API Keys

## Step-by-Step Guide

### Step 1: Navigate to Authentication Settings

1. In your Paddle Dashboard, go to **Developer Tools** (or **Settings** → **Developer Tools**)
2. Click on **Authentication** (or **API Keys**)

### Step 2: Generate API Keys

1. You'll see options to generate:
   - **API Key** (also called "Secret Key" or "Server Key")
   - **Public Key** (also called "Publishable Key" or "Client Key")

2. Click **"Generate"** or **"Create API Key"** for each:
   - **Generate API Key** (Secret Key) - This is your `PADDLE_API_KEY`
   - **Generate Public Key** - This is your `PADDLE_PUBLIC_KEY`

### Step 3: Copy Your Keys

**Important:** Copy these keys immediately! You won't be able to see them again.

1. **API Key** (Secret Key):
   - Starts with `test_` (Test Mode) or `live_` (Live Mode)
   - This is your `PADDLE_API_KEY`
   - **Keep this secret!** Never share it publicly

2. **Public Key**:
   - Starts with `test_` (Test Mode) or `live_` (Live Mode)
   - This is your `PADDLE_PUBLIC_KEY`
   - Safe to use in frontend code

### Step 4: Check Your Mode

- **Test Mode** (top right toggle):
  - Keys start with `test_`
  - Use for testing
  - No real payments

- **Live Mode**:
  - Keys start with `live_`
  - Use for production
  - Processes real payments

**For now, use Test Mode!**

### Step 5: What You'll Get

After generating, you should have:
- ✅ `PADDLE_API_KEY` = `test_xxxxxxxxxxxxx` (or `live_...`)
- ✅ `PADDLE_PUBLIC_KEY` = `test_xxxxxxxxxxxxx` (or `live_...`)

### Step 6: Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. **Settings** → **Environment Variables**
4. Add:
   ```
   PADDLE_API_KEY=test_your_generated_api_key_here
   PADDLE_PUBLIC_KEY=test_your_generated_public_key_here
   ```
5. Click **Save**
6. **Redeploy** your app

## Important Notes

- ✅ **Yes, generate them!** You need them for the integration
- ✅ **Start with Test Mode** - Generate test keys first
- ✅ **Copy immediately** - You can't view them again
- ✅ **Keep API Key secret** - Never commit to git or share publicly
- ✅ **Public Key is safe** - Can be used in frontend

## If You Can't Find the Option

If you don't see "Generate API Key" button:

1. Make sure you're in **Developer Tools** section
2. Look for **"Authentication"** or **"API Keys"** tab
3. Some accounts may need to complete business verification first
4. Try refreshing the page
5. Check if there's a **"Create"** or **"New"** button

## Next Steps After Generating

1. ✅ Generate API keys (you're doing this now!)
2. ✅ Copy both keys
3. ✅ Add to Vercel environment variables
4. ✅ Set up webhook (next step)
5. ✅ Test the integration

## Need Help?

If you're stuck:
- Check Paddle's docs: [developer.paddle.com](https://developer.paddle.com)
- Look for a "?" help icon in the dashboard
- Contact Paddle support through the dashboard

---

**Yes, go ahead and generate them!** This is the first step to getting payments working. 🚀


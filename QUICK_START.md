# Quick Start Guide

Get your Jacked app running locally in 5 minutes.

## 1. Install Dependencies

```bash
npm install
```

## 2. Set Up Supabase

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL from `DATABASE_SCHEMA.sql` in Supabase SQL Editor
4. Create a storage bucket named `media` (make it public)
5. Copy your project URL and anon key from Settings > API

## 3. Set Up Stripe (Optional for local dev)

1. Create account at [stripe.com](https://stripe.com)
2. Get your test keys from Developers > API keys
3. Create a webhook endpoint (use ngrok for local testing)

## 4. Create Environment File

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. Run Development Server

```bash
npm run dev
```

## 6. Open Your Browser

Navigate to [http://localhost:3000](http://localhost:3000)

## That's It! 🎉

You should now be able to:
- Sign up for an account
- Create posts with images/videos
- Like and comment on posts
- View your profile

## Next Steps

- Read `DEPLOYMENT.md` for production deployment
- Read `SQUARESPACE_SETUP.md` to connect to your landing page
- Customize the design and branding
- Add more features!

## Troubleshooting

**"Cannot find module" errors:**
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then reinstall

**Supabase connection errors:**
- Verify your environment variables are correct
- Check Supabase project is active
- Ensure database schema is deployed

**Media upload fails:**
- Verify storage bucket exists and is public
- Check file size limits (Supabase default is 50MB)

**Stripe errors:**
- Use test mode keys for development
- Webhook won't work locally without ngrok or similar tool

## Need Help?

- Check the full `README.md` for detailed documentation
- Review `DEPLOYMENT.md` for deployment steps
- Open an issue on GitHub


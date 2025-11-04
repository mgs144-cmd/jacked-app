# Deployment Guide

Complete guide for deploying the Jacked app to production.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Supabase account (free tier available)
- Stripe account (for payments)

## Step 1: Supabase Setup

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose a name (e.g., "jacked-app")
   - Set a database password
   - Choose a region close to your users

2. **Set up Database:**
   - Go to SQL Editor
   - Copy and paste the contents of `DATABASE_SCHEMA.sql`
   - Click "Run" to execute

3. **Create Storage Bucket:**
   - Go to Storage
   - Click "New bucket"
   - Name: `media`
   - Make it **public**
   - Click "Create bucket"

4. **Get API Keys:**
   - Go to Settings > API
   - Copy:
     - Project URL (e.g., `https://xxxxx.supabase.co`)
     - anon/public key

## Step 2: Stripe Setup

1. **Create Stripe Account:**
   - Go to [stripe.com](https://stripe.com)
   - Complete account setup
   - Switch to test mode for development

2. **Get API Keys:**
   - Go to Developers > API keys
   - Copy:
     - Publishable key (starts with `pk_`)
     - Secret key (starts with `sk_`)

3. **Create Webhook:**
   - Go to Developers > Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app.vercel.app/api/webhook` (update after deployment)
   - Events to listen for:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
   - Copy the webhook signing secret

## Step 3: Deploy to Vercel

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/jacked-app.git
   git push -u origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Environment Variables:**
   In Vercel dashboard, go to Settings > Environment Variables and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `your-app.vercel.app`

## Step 4: Update Stripe Webhook

1. Go back to Stripe Dashboard > Webhooks
2. Edit your webhook endpoint
3. Update URL to your Vercel deployment URL
4. Save

## Step 5: Custom Domain (Optional)

1. In Vercel, go to Settings > Domains
2. Add your domain (e.g., `app.jackedfit.com`)
3. Follow DNS instructions
4. Wait for DNS propagation

## Step 6: Test Everything

- [ ] User signup works
- [ ] User login works
- [ ] Posts can be created
- [ ] Media uploads work
- [ ] Likes and comments work
- [ ] Premium subscription flow works
- [ ] Webhook receives Stripe events
- [ ] Premium status updates correctly

## Environment Variables Reference

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Settings > API |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard > Developers > API keys |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard > Developers > Webhooks |
| `NEXT_PUBLIC_APP_URL` | Your app URL | Your Vercel deployment URL |

## Production Checklist

- [ ] All environment variables set
- [ ] Database schema deployed
- [ ] Storage bucket created
- [ ] Stripe webhook configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Analytics tracking added
- [ ] Error monitoring set up (e.g., Sentry)
- [ ] Backup strategy in place

## Monitoring

- **Vercel:** Monitor deployment logs and analytics
- **Supabase:** Check database performance and usage
- **Stripe:** Monitor payments and webhook events

## Troubleshooting

### Deployment fails
- Check build logs in Vercel
- Verify all environment variables are set
- Ensure TypeScript compiles without errors

### Database errors
- Verify RLS policies are enabled
- Check Supabase logs
- Ensure storage bucket is public

### Payment issues
- Verify Stripe keys are correct
- Check webhook endpoint is accessible
- Review Stripe dashboard for failed payments

### Media upload fails
- Verify storage bucket exists
- Check bucket is public
- Verify file size limits

## Scaling Considerations

- **Database:** Supabase free tier is generous, upgrade when needed
- **Storage:** Monitor usage, upgrade plan if needed
- **Vercel:** Free tier includes 100GB bandwidth, upgrade for more
- **Stripe:** Pay-as-you-go pricing

## Support

For issues:
- Check Vercel deployment logs
- Review Supabase logs
- Check Stripe webhook events
- Open an issue on GitHub


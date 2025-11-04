# Jacked App

A social fitness platform for lifters - like Strava but for the gym community.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Payments**: Stripe
- **Deployment**: Vercel (frontend) + Supabase (backend)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- A Supabase account (free tier available)
- A Stripe account (for payments)

### Setup Instructions

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Supabase:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to Settings > API and copy your project URL and anon key
   - Go to SQL Editor and run the SQL from `DATABASE_SCHEMA.sql`
   - Go to Storage and create a bucket named `media` with public access enabled

3. **Set up environment variables:**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
jacked-app/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes (Stripe webhooks)
│   ├── feed/              # Main feed page
│   ├── create/            # Create post page
│   ├── profile/           # User profile page
│   ├── premium/           # Premium subscription page
│   └── settings/          # Settings page
├── components/            # React components
├── lib/                   # Utility functions
│   └── supabase/         # Supabase client setup
└── public/               # Static assets
```

## Features

- ✅ User authentication (email/password)
- ✅ Media uploads (images and videos)
- ✅ Dynamic feed with posts
- ✅ Likes and comments
- ✅ User profiles
- ✅ Premium subscription (Jacked+) with Stripe
- ✅ Responsive design (mobile and desktop)

## Database Schema

See `DATABASE_SCHEMA.sql` for the complete schema. Key tables:
- `profiles` - User profiles
- `posts` - User posts
- `likes` - Post likes
- `comments` - Post comments

## Deployment

### Frontend (Vercel)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Backend (Supabase)

- Already hosted on Supabase Cloud
- Configure Stripe webhook URL in Stripe dashboard:
  - URL: `https://your-app.vercel.app/api/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.deleted`

### Connecting to Squarespace

1. **Subdomain Setup:**
   - Point `app.jackedfit.com` to your Vercel deployment
   - Add CNAME record in your DNS settings

2. **Linking from Squarespace:**
   - Add a button/link on your Squarespace page that points to `https://app.jackedfit.com`
   - Use consistent branding (colors, fonts) across both sites

3. **Alternative (iframe):**
   - Not recommended for authentication, but possible
   - Use subdomain approach for better UX

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key (server-side only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `NEXT_PUBLIC_APP_URL` | Your app URL (for Stripe redirects) |

## Next Steps

- [ ] Add workout logging functionality
- [ ] Implement search and discovery
- [ ] Add notifications
- [ ] Enhance analytics for premium users
- [ ] Add social features (follow/unfollow)

## Support

For issues or questions, please open an issue on GitHub.


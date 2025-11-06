# Connecting Jacked App to Squarespace

This guide explains how to connect your Jacked web app to your Squarespace landing page.

## Option 1: Subdomain Setup (Recommended)

This is the best approach for a seamless user experience.

### Steps:

1. **Deploy your app to Vercel:**
   - Push your code to GitHub
   - Connect your repo to Vercel
   - Deploy (your app will get a URL like `jacked-app.vercel.app`)

2. **Set up custom domain:**
   - In Vercel dashboard, go to Settings > Domains
   - Add `app.jackedlifting.com` (or your preferred subdomain)
   - Vercel will provide DNS instructions

3. **Configure DNS:**
   - Go to your domain registrar (where you bought `jackedlifting.com`)
   - Add a CNAME record:
     - **Name**: `app` (for `app.jackedlifting.com`)
     - **Value**: `cname.vercel-dns.com` (or the value Vercel provides)
     - **TTL**: 3600 (or default)

4. **Wait for DNS propagation:**
   - This can take a few minutes to 48 hours
   - Check with: `nslookup app.jackedlifting.com`

5. **Link from Squarespace:**
   - In Squarespace, add a button or link
   - Set the URL to: `https://app.jackedlifting.com`
   - Use consistent styling (red accent color #950606)

### Example Squarespace Button Code:

```html
<a href="https://app.jackedlifting.com" class="button" style="background-color: #950606; color: white; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: 600;">
  Get Started
</a>
```

## Option 2: Iframe Embed (Not Recommended)

While possible, iframes create authentication issues and poor mobile experience. Avoid this approach.

## Visual Consistency

To make both sites feel connected:

1. **Colors:**
   - Primary: Red (#950606)
   - Background: White (#FFFFFF)
   - Text: Black (#000000)

2. **Typography:**
   - Use Inter font (already in the app)
   - Add to Squarespace: Custom CSS → `font-family: 'Inter', sans-serif;`

3. **Design Elements:**
   - Rounded corners (12px border-radius)
   - Subtle shadows
   - Clean, minimal design

## Testing

1. Test the link from your Squarespace page
2. Ensure users can sign up and navigate seamlessly
3. Test on mobile devices
4. Verify authentication redirects work correctly

## Troubleshooting

- **CNAME not working?** Check DNS propagation with `dig app.jackedlifting.com`
- **SSL certificate issues?** Vercel handles SSL automatically
- **404 errors?** Check Vercel deployment logs
- **Auth redirects failing?** Verify `NEXT_PUBLIC_APP_URL` environment variable

## Next Steps

Once connected:
- Add analytics tracking (Google Analytics, Plausible, etc.)
- Set up email notifications
- Configure custom error pages
- Add SEO metadata


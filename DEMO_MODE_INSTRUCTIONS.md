# Demo Account Setup for Presentations

## Quick Start (5 minutes)

### 1. Create Demo User in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Users**
3. Click **"Add User"**
4. Enter:
   - **Email**: `demo@jackedlifting.com`
   - **Password**: `DemoJacked2024!`
   - ✅ **Auto Confirm User**: Check this box!
5. Click **"Create User"**

### 2. Grant Demo Access

Run this SQL in your Supabase SQL Editor:

```sql
UPDATE profiles
SET 
  has_paid_onboarding = true,
  onboarding_payment_id = 'demo_account',
  is_premium = true,
  username = 'demo_user',
  full_name = 'Demo User',
  bio = '👋 This is a demo account for presentations. Feel free to explore!'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'demo@jackedlifting.com'
);
```

### 3. Generate QR Code

**Option A: Online Generator** (Easiest)
1. Go to [qr-code-generator.com](https://www.qr-code-generator.com)
2. Enter URL: `https://app.jackedlifting.com/demo`
3. Customize colors (optional): Use red/black for Jacked branding
4. Download as PNG or PDF
5. Print for your presentation

**Option B: Using Command Line**
```bash
npm install -g qrcode-terminal
qrcode-terminal https://app.jackedlifting.com/demo
```

**Option C: macOS/Linux Quick Command**
```bash
curl "https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=https://app.jackedlifting.com/demo" -o demo-qr.png
open demo-qr.png
```

## How It Works

1. **Users scan QR code** → Takes them to `/demo`
2. **Auto-login** → Instantly signs in with demo account
3. **Full Access** → No payment wall, can post, like, comment
4. **Shared Experience** → All demo users see the same account

## Demo Mode Features

✅ No login required
✅ Bypass payment wall
✅ Full app access
✅ Can create posts
✅ Can like & comment
✅ Premium features enabled
✅ Instant access (<2 seconds)

## Presentation Tips

### Display the QR Code:
- Print on a slide
- Display on a separate screen
- Hand out cards with the QR code
- Project it during your demo

### Talking Points:
- "Scan this QR code to try Jacked right now"
- "No signup required for the demo"
- "See exactly what users experience"
- "Post your own workout and see it live"

### Demo Account Info:
- **URL**: https://app.jackedlifting.com/demo
- **Note**: Changes are visible to all demo users
- **Reset**: You can delete demo posts via admin panel if needed

## Troubleshooting

**QR code not working?**
- Ensure demo account is created in Supabase
- Check that SQL UPDATE ran successfully
- Verify middleware allows `/demo` route
- Test the URL directly first

**Demo account locked out?**
- Run the SQL UPDATE query again
- Check `has_paid_onboarding` is `true`
- Verify `onboarding_payment_id` is set

**Want to reset demo posts?**
```sql
-- Delete all demo user posts (run in Supabase SQL Editor)
DELETE FROM posts
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'demo@jackedlifting.com'
);
```

## After Presentation

You can:
- Keep the demo account active for future demos
- Delete demo posts if you want a clean slate
- Change the password in Supabase Auth dashboard
- Disable the demo account by updating `has_paid_onboarding` to `false`

Good luck with your presentation! 🎉


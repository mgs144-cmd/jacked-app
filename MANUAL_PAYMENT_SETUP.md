# Manual Payment Approval System Setup

## Overview

This system allows you to manually approve accounts after users pay via external payment links (PayPal.me or Buy Me a Coffee).

## Setup Steps

### 1. Add Email Column to Profiles

Run this SQL in your Supabase SQL Editor:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
```

Or use the file: `ADD_EMAIL_TO_PROFILES.sql`

### 2. Set Admin Email

In Vercel, add environment variable:
```
ADMIN_EMAIL=your-admin-email@example.com
```

Or update `app/admin/page.tsx` to check for your specific email.

### 3. Set Payment Links

In Vercel, add environment variables:
```
NEXT_PUBLIC_PAYPAL_LINK=https://paypal.me/jackedapp/0.99
NEXT_PUBLIC_BMC_LINK=https://buymeacoffee.com/yourusername
```

Or update the links directly in `components/PaymentRequiredClient.tsx`

### 4. Access Admin Dashboard

1. Log in with your admin account
2. Go to: `https://your-app.vercel.app/admin`
3. You'll see all users who haven't been approved
4. Click "Approve" after they've paid

## How It Works

1. **User Signs Up** → Account created, `has_paid_onboarding = false`
2. **User Sees Payment Page** → Shows PayPal.me and Buy Me a Coffee links
3. **User Pays Externally** → Via PayPal.me or Buy Me a Coffee
4. **Admin Approves** → Go to `/admin`, find user, click "Approve"
5. **User Gets Access** → `has_paid_onboarding = true`, can use app

## Admin Dashboard Features

- ✅ View all pending users
- ✅ Search by email, username, or name
- ✅ See when account was created
- ✅ One-click approval
- ✅ Auto-refresh option

## Payment Links

Update these in `components/PaymentRequiredClient.tsx` or use environment variables:

- **PayPal.me**: `https://paypal.me/yourusername/0.99`
- **Buy Me a Coffee**: `https://buymeacoffee.com/yourusername`

## Security

- Only users with admin email can access `/admin`
- You can also add `is_admin` flag to profiles table
- Update `app/admin/page.tsx` to customize admin check

## Benefits

- ✅ No API integration needed
- ✅ Works immediately
- ✅ Full control over approvals
- ✅ Can verify payments manually
- ✅ Perfect for meeting sales deadlines

## Next Steps

1. Run the SQL migration to add email column
2. Set your admin email in Vercel
3. Update payment links
4. Test the flow:
   - Sign up as test user
   - See payment page
   - Go to `/admin` as admin
   - Approve the test user

---

**This is perfect for meeting your 10 sales deadline!** You can approve accounts as soon as payments come in.


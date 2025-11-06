# Supabase Email Confirmation Setup

## Option 1: Disable Email Confirmation (Recommended for MVP)

This removes the email confirmation step and lets users sign up immediately.

### Steps:

1. **Go to Supabase Dashboard:**
   - Navigate to your project
   - Go to **Authentication** → **Settings** (or **Auth** → **Email Auth**)

2. **Disable Email Confirmation:**
   - Find the setting "Enable email confirmations"
   - **Turn it OFF**
   - Save changes

3. **Update Email Templates (Optional):**
   - You can still customize email templates even if confirmation is disabled
   - Go to **Authentication** → **Email Templates**

### Result:
- Users can sign up and immediately access the app
- No email confirmation required
- Faster onboarding

---

## Option 2: Keep Email Confirmation (Better for Production)

If you want to keep email confirmation for security:

### Steps:

1. **Configure Email Settings:**
   - Go to **Authentication** → **Settings**
   - Ensure "Enable email confirmations" is **ON**
   - Configure SMTP settings (or use Supabase's default)

2. **Update Your App:**
   - Users will need to click the confirmation link in their email
   - After clicking, they'll be redirected back to your app
   - You may want to add a "check your email" message after signup

### Result:
- More secure (verified email addresses)
- Prevents spam accounts
- Better for production apps

---

## Current Setup

Your app currently redirects users to `/feed` immediately after signup. If you keep email confirmation enabled, you'll need to:

1. **Add a "Check Your Email" page:**
   - Create `app/auth/verify/page.tsx`
   - Show message: "Please check your email to confirm your account"

2. **Handle Email Confirmation:**
   - Supabase redirects users to a confirmation URL
   - Set this in Supabase: **Authentication** → **URL Configuration**
   - Redirect URL: `https://app.jackedlifting.com/auth/verify?token=TOKEN`

3. **Update Signup Flow:**
   - After signup, redirect to `/auth/verify` instead of `/feed`
   - Show message about checking email

---

## Recommendation for MVP

**Disable email confirmation** for now because:
- ✅ Faster user onboarding
- ✅ Less friction for early users
- ✅ Easier testing
- ✅ You can enable it later when you have more users

You can always enable it later when you're ready for production.

---

## Quick Fix: Disable Email Confirmation

1. Supabase Dashboard → **Authentication** → **Settings**
2. Find **"Enable email confirmations"**
3. **Turn OFF**
4. Save

That's it! Users can now sign up without email confirmation.


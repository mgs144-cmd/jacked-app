# Password Reset Setup Guide

## Overview

Users can now reset their passwords themselves through email. The flow works as follows:

1. User clicks "Forgot password?" on the login page
2. User enters their email address
3. User receives an email with a reset link
4. User clicks the link and sets a new password

## Supabase Configuration

### Step 1: Configure Redirect URL

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://app.jackedlifting.com/auth/reset-password
   ```
   (For local development, also add: `http://localhost:3000/auth/reset-password`)

3. Click **Save**

### Step 2: Customize Email Template (Optional)

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Select **Reset Password** template
3. Customize the email subject and body if desired
4. Make sure the reset link uses: `{{ .ConfirmationURL }}`

### Step 3: Verify Email Settings

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Ensure **Enable email confirmations** is configured as desired
3. Check that your **Site URL** is set to: `https://app.jackedlifting.com`

## How It Works

### Forgot Password Page (`/auth/forgot-password`)
- User enters their email
- System sends a password reset email via Supabase
- User sees a success message with instructions

### Reset Password Page (`/auth/reset-password`)
- User clicks the link from their email
- Link contains a token that authenticates them temporarily
- User sets a new password (minimum 6 characters)
- Password is updated and user is redirected to login

## Testing

1. Go to `/auth/login`
2. Click "Forgot password?"
3. Enter a valid email address
4. Check your email for the reset link
5. Click the link and set a new password
6. Try logging in with the new password

## Troubleshooting

### "Invalid or expired reset link"
- The link may have expired (links expire after 1 hour)
- User needs to request a new reset link
- Make sure the redirect URL is correctly configured in Supabase

### Email not received
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email logs: **Authentication** → **Logs**
- Ensure email service is configured in Supabase

### Redirect not working
- Verify the redirect URL is added in Supabase settings
- Check that the URL matches exactly (including https/http)
- For production, use `https://app.jackedlifting.com/auth/reset-password`

## Security Notes

- Reset links expire after 1 hour
- Each reset link can only be used once
- Users must be logged out to use the reset link (Supabase handles this)
- Passwords must be at least 6 characters (enforced client-side and by Supabase)


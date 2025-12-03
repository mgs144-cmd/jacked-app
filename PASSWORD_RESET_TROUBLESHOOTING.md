# Password Reset Email Troubleshooting

If users are not receiving password reset emails, check the following:

## 1. Supabase Email Settings

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Ensure **"Reset Password"** template is enabled
4. Check **Settings** → **Auth** → **Email**:
   - Email provider is configured (SMTP or Supabase default)
   - Rate limiting is not too strict

## 2. Check Email Provider

### If using Supabase default email:
- Check spam/junk folder
- Supabase sends from `noreply@mail.app.supabase.io`
- May have rate limits

### If using custom SMTP:
- Verify SMTP credentials are correct
- Check SMTP server logs
- Ensure sender email is verified

## 3. Check Supabase Logs

1. Go to **Logs** → **Auth Logs** in Supabase dashboard
2. Look for `password_reset` events
3. Check for any errors

## 4. Common Issues

### Rate Limiting
- Supabase may limit password reset emails to prevent abuse
- Wait 1 hour between requests
- Error message will say "rate limit" if this is the issue

### Email Not Found
- If email doesn't exist in database, Supabase still returns success (security)
- User won't receive email but won't see error
- This is by design to prevent email enumeration

### Email Provider Issues
- Check if other emails from your app are working
- Test with a different email address
- Check Supabase status page for outages

## 5. Testing

To test password reset:
1. Use a real email address (not a test account)
2. Check spam folder
3. Wait at least 1 minute between attempts
4. Check browser console for errors
5. Check Supabase Auth logs

## 6. Alternative Solution

If emails still don't work, you can manually reset passwords via:
- Supabase Dashboard → Authentication → Users → Select user → Reset password
- Or use the admin dashboard in the app (if implemented)


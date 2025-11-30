# How to Test the $0.99 Payment Flow

## Quick Test Steps

### Step 1: Make Sure Everything is Set Up

✅ Environment variables added to Vercel  
✅ Webhook configured in Stripe  
✅ App is deployed  

### Step 2: Test the Signup Flow

1. **Go to your signup page:**
   - Production: `https://your-app.vercel.app/auth/signup`
   - Or local: `http://localhost:3000/auth/signup`

2. **Fill out the signup form:**
   - Email: Use a test email (e.g., `test@example.com`)
   - Password: Any password (min 6 characters)
   - Username/Name: Optional

3. **Click "CREATE ACCOUNT"**

4. **What should happen:**
   - ✅ Account is created
   - ✅ You're redirected to Stripe checkout page
   - ✅ You see "$0.99" as the amount

### Step 3: Complete Test Payment

**If using TEST mode keys:**
- Use Stripe test card: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/25`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

**If using LIVE mode keys:**
- ⚠️ **WARNING:** This will charge a real $0.99!
- Use a real card (you'll get charged)

5. **Click "Pay" or "Complete Payment"**

6. **What should happen:**
   - ✅ Payment processes
   - ✅ You're redirected back to your app (`/feed`)
   - ✅ You can now use the app

---

## What to Check

### ✅ Success Indicators

1. **Redirect to Stripe:**
   - After signup, you should see Stripe checkout page
   - URL should be `checkout.stripe.com/...`
   - Amount shows $0.99

2. **After Payment:**
   - Redirected to `/feed` page
   - You can see posts, create posts, etc.
   - No errors in browser console

3. **In Stripe Dashboard:**
   - Go to Stripe Dashboard → Payments
   - You should see a $0.99 payment
   - Status: "Succeeded"

4. **In Your Database:**
   - Check Supabase → `profiles` table
   - Find your user
   - `has_paid_onboarding` should be `true`
   - `onboarding_payment_id` should have a value

### ❌ Failure Indicators

1. **No redirect to Stripe:**
   - Check browser console for errors (F12)
   - Check if environment variables are set
   - Check if API route is working

2. **Payment fails:**
   - Check Stripe Dashboard → Payments for error
   - Check webhook is receiving events
   - Check browser console

3. **Stuck after payment:**
   - Check webhook is working
   - Check `has_paid_onboarding` in database
   - Check browser console for errors

---

## Testing Checklist

- [ ] Can access signup page
- [ ] Can create account
- [ ] Redirected to Stripe checkout
- [ ] See $0.99 amount
- [ ] Can complete payment with test card
- [ ] Redirected back to app after payment
- [ ] Can use app features (feed, create post, etc.)
- [ ] Payment shows in Stripe Dashboard
- [ ] `has_paid_onboarding` is `true` in database

---

## Test Cards (Test Mode Only)

These only work with **test mode** keys (`sk_test_...`):

| Card Number | Result |
|------------|--------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Decline |
| `4000 0025 0000 3155` | 🔒 3D Secure required |

**Expiry:** Any future date  
**CVC:** Any 3 digits  
**ZIP:** Any 5 digits

---

## Debugging

### Check Environment Variables

1. Go to Vercel → Your Project → Settings → Environment Variables
2. Verify both variables are there:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### Check Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Check "Events" tab
4. You should see `checkout.session.completed` events

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for errors (red text)
4. Common errors:
   - "Unauthorized" → Environment variables not set
   - "Failed to create checkout" → Stripe key wrong
   - Network errors → Check API route

### Check API Route

Test the checkout creation directly:

```bash
# In your browser console on signup page, after creating account:
fetch('/api/create-onboarding-checkout', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => console.log(data))
```

Should return: `{ url: "https://checkout.stripe.com/..." }`

---

## Common Issues

### Issue: "No redirect to Stripe"

**Fix:**
- Check environment variables are set in Vercel
- Redeploy the app after adding variables
- Check browser console for errors

### Issue: "Payment succeeds but can't use app"

**Fix:**
- Check webhook is receiving events
- Check `has_paid_onboarding` in database
- Manually set it to `true` if needed:
  ```sql
  UPDATE profiles 
  SET has_paid_onboarding = true 
  WHERE id = 'your-user-id';
  ```

### Issue: "Webhook not working"

**Fix:**
- Verify webhook URL is correct
- Check webhook secret matches
- Make sure endpoint is accessible (not localhost)
- Check Stripe Dashboard → Webhooks → Events

---

## Quick Test Script

Run this in your browser console on the signup page (after creating account):

```javascript
// Test checkout creation
fetch('/api/create-onboarding-checkout', {
  method: 'POST',
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  if (data.url) {
    console.log('✅ Checkout URL created:', data.url)
    // Uncomment to auto-redirect:
    // window.location.href = data.url
  } else {
    console.error('❌ Error:', data)
  }
})
```

---

## Success = You Can Use the App!

If after payment you can:
- ✅ See the feed
- ✅ Create posts
- ✅ Navigate around

Then it's working! 🎉

---

## Need Help?

If something's not working:
1. Check browser console (F12)
2. Check Stripe Dashboard → Payments
3. Check Stripe Dashboard → Webhooks → Events
4. Check Supabase → `profiles` table
5. Check Vercel → Deployment logs


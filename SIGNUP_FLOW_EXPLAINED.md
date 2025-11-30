# Signup Flow - How It Should Work

## Expected Flow

### Step 1: User Fills Out Form
- User enters email, password, username (optional), full name (optional)
- Clicks "CREATE ACCOUNT" button

### Step 2: Account Creation (Instant)
- Account is created in Supabase Auth
- Profile record is created/updated
- **This happens in < 1 second**

### Step 3: Immediate Redirect to Stripe (Should happen automatically)
- **User should be redirected IMMEDIATELY** to Stripe checkout page
- No delay, no intermediate page
- URL should be: `checkout.stripe.com/...`
- Amount shown: **$0.99**

### Step 4: User Pays
- User enters payment info on Stripe's secure page
- Clicks "Pay $0.99"
- Payment processes

### Step 5: Payment Success
- Stripe redirects back to: `/feed?payment=success`
- Stripe webhook marks user as paid (`has_paid_onboarding = true`)
- User can now use the app

### Step 6: If Payment Fails or User Cancels
- User is redirected to: `/payment-required`
- Shows "Payment Required" page with button to try again
- User cannot access app until payment is complete

---

## Current Implementation

The code should:
1. ✅ Create account
2. ✅ Create/update profile
3. ✅ Call `/api/create-onboarding-checkout`
4. ✅ Get Stripe checkout URL
5. ✅ Redirect to Stripe (`window.location.href = url`)

**If any step fails:**
- Redirects to `/payment-required` page
- User can click button to try payment again

---

## Troubleshooting: Why Redirect Might Not Happen

### Issue 1: API Call Failing
**Check:**
- Browser console (F12) for errors
- Network tab - is `/api/create-onboarding-checkout` being called?
- What response does it return?

**Common causes:**
- `STRIPE_SECRET_KEY` not set in Vercel
- Stripe API error
- Network error

### Issue 2: No URL Returned
**Check:**
- API response in Network tab
- Does it return `{ url: "..." }`?
- Or does it return an error?

### Issue 3: JavaScript Error
**Check:**
- Browser console for JavaScript errors
- Is `window.location.href` being called?
- Any errors blocking execution?

### Issue 4: Session Not Available
**Check:**
- Is user session created immediately after signup?
- API route checks for session - if not available, returns 401

---

## Expected Timeline

```
0:00 - User clicks "CREATE ACCOUNT"
0:01 - Account created
0:02 - Profile created/updated
0:03 - API call to create checkout
0:04 - Stripe checkout URL received
0:05 - Redirect to Stripe (should happen here!)
```

**Total time: < 5 seconds before redirect**

---

## What You Should See

### In Browser:
1. Click "CREATE ACCOUNT"
2. Button shows "CREATING ACCOUNT..." (loading state)
3. **Page should redirect to Stripe checkout** (no intermediate page)
4. See Stripe's payment form with $0.99

### If It's Not Working:
1. Check browser console (F12) - look for errors
2. Check Network tab - see if API call is made
3. Check what the API returns

---

## Quick Test

Open browser console and run this after clicking "CREATE ACCOUNT":

```javascript
// Watch for redirect
console.log('Waiting for redirect...')
setTimeout(() => {
  console.log('Current URL:', window.location.href)
  if (window.location.href.includes('stripe.com')) {
    console.log('✅ Redirected to Stripe!')
  } else {
    console.log('❌ Still on signup page')
  }
}, 3000)
```

---

## Expected Behavior

**✅ CORRECT:**
- User clicks "CREATE ACCOUNT"
- Page immediately redirects to Stripe checkout
- User sees Stripe payment form

**❌ WRONG:**
- User clicks "CREATE ACCOUNT"
- Stays on signup page
- No redirect happens
- No error shown

If you're seeing the wrong behavior, check the browser console for errors!


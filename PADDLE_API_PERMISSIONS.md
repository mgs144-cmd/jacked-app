# Paddle API Key Permissions Guide

When generating your Paddle API keys, you'll be asked to select permissions. Here's what you need:

## Required Permissions

Select these permissions for your API key:

### ✅ **Transactions** (Required)
- **Create transactions** - To create checkout sessions
- **Read transactions** - To verify payment status
- **Update transactions** - If needed for refunds/cancellations

### ✅ **Customers** (Recommended)
- **Read customers** - To link payments to users
- **Create customers** - To create customer records

### ✅ **Webhooks/Notifications** (Required)
- **Read webhooks** - To verify webhook setup
- **Manage webhooks** - To handle payment events

### ✅ **Products/Prices** (If Available)
- **Read products** - To view product info
- **Read prices** - To view pricing

## Minimum Required

At minimum, you need:
- ✅ **Transactions: Create & Read**
- ✅ **Webhooks: Read**

## What NOT to Select

You can skip these (not needed for basic payments):
- ❌ Subscription management (unless you add subscriptions later)
- ❌ Invoices (unless you need invoicing)
- ❌ Discounts (unless you need discount codes)
- ❌ Reports/Analytics (optional)

## Quick Answer

**Select:**
- ✅ All **Transaction** permissions
- ✅ All **Customer** permissions  
- ✅ All **Webhook/Notification** permissions

Or if there's a **"Full Access"** or **"All Permissions"** option, you can select that for simplicity.

## Why These Permissions?

- **Transactions**: Needed to create checkout sessions and process payments
- **Customers**: Helps link payments to user accounts
- **Webhooks**: Required to receive payment confirmations

## After Selecting Permissions

1. Click **"Generate"** or **"Create"**
2. Copy the keys immediately
3. Add to Vercel environment variables
4. You're done!

---

**TL;DR:** Select all Transaction, Customer, and Webhook permissions. Or choose "Full Access" if available.


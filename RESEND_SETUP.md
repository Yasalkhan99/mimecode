# Resend Email Setup - Simple & Free

## What is Resend?

Resend is a modern email API service that makes sending emails super easy - no SMTP configuration needed!

## Setup Steps (5 minutes):

### Step 1: Create Resend Account

1. Go to https://resend.com
2. Click **Sign Up** (free account)
3. Verify your email

### Step 2: Get API Key

1. After login, go to **API Keys** section
2. Click **Create API Key**
3. Give it a name: "AvailCoupon Newsletter"
4. **Copy the API key** (starts with `re_...`)

### Step 3: Add to .env.local

Open your `.env.local` file and add:

```env
RESEND_API_KEY=re_your_api_key_here
```

Replace `re_your_api_key_here` with the API key you copied.

### Step 4: Verify Domain (Optional but Recommended)

For production, you should verify your domain:

1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Add your domain (e.g., `availcoupon.com`)
4. Add the DNS records they provide
5. Wait for verification (usually a few minutes)

**Note:** For testing, you can use `onboarding@resend.dev` as the sender (already configured in code).

### Step 5: Update Sender Email (After Domain Verification)

Once your domain is verified, update the sender email in:
`app/api/newsletter/subscribe/route.ts`

Change this line:
```typescript
from: 'AvailCoupon <onboarding@resend.dev>',
```

To:
```typescript
from: 'AvailCoupon <noreply@yourdomain.com>',
```

### Step 6: Restart Server

```bash
npm run dev
```

## Test It!

1. Go to your website
2. Enter email in newsletter form
3. Click "Send"
4. Check the email address you set in Admin Panel → Manage Email
5. You should receive the email! 🎉

## Free Tier Limits

- **100 emails/day** (free tier)
- Perfect for small to medium websites
- Upgrade if you need more

## Troubleshooting

### Email not received?

1. Check spam folder
2. Verify API key is correct in `.env.local`
3. Check server logs for errors
4. Make sure you restarted the server after adding API key

### Still not working?

- Check Resend dashboard for email logs
- Verify your API key is active
- Make sure domain is verified (if using custom domain)

## That's It!

No SMTP, no complex setup - just add the API key and it works! 🚀


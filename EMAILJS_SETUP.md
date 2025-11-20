# EmailJS Setup Guide - Newsletter Subscription

## What is EmailJS?

EmailJS is a free service that sends emails directly from your website - no backend needed! Perfect for contact forms and newsletter subscriptions.

## Setup Steps (5 minutes):

### Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Click **Sign Up** (free account)
3. Verify your email address

### Step 2: Add Email Service

1. After login, go to **Email Services** in the dashboard
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook**
   - **Yahoo**
   - Or any other SMTP service
4. Click **Connect Account** and authorize EmailJS to send emails from your account
5. **Copy the Service ID** (e.g., `service_xxxxx`)

### Step 3: Create Email Template

1. Go to **Email Templates** in the dashboard
2. Click **Create New Template**
3. Use this template:

**Template Name:** Newsletter Subscription

**Subject:**
```
New Newsletter Subscription Request
```

**Content (HTML):**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #ea580c; margin-bottom: 20px;">New Newsletter Subscription</h2>
  <p style="color: #333; font-size: 16px; line-height: 1.6;">A new user has subscribed to your newsletter:</p>
  <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c;">
    <p style="margin: 0; color: #333;"><strong>Email:</strong> {{user_email}}</p>
    <p style="margin: 10px 0 0 0; color: #333;"><strong>Date:</strong> {{date}}</p>
  </div>
  <p style="color: #333; font-size: 16px; line-height: 1.6;">Please add this email to your newsletter list.</p>
</div>
```

**To Email Field:**
- Set to: `{{to_email}}` (this will use the email from Admin Panel → Manage Email)

**From Name:** AvailCoupon Newsletter

**From Email:** Your email (the one connected in Step 2)

4. **Copy the Template ID** (e.g., `template_xxxxx`)

### Step 4: Get Public Key

1. Go to **Account** → **General** in EmailJS dashboard
2. Find **Public Key**
3. **Copy the Public Key** (e.g., `xxxxxxxxxxxxx`)

### Step 5: Add to .env.local

Open your `.env.local` file and add these lines:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id_here
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id_here
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key_here
```

**Replace:**
- `your_service_id_here` with Service ID from Step 2
- `your_template_id_here` with Template ID from Step 3
- `your_public_key_here` with Public Key from Step 4

### Step 6: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

## Test It!

1. Go to your website
2. Enter an email in the newsletter form
3. Click "Send"
4. Check the email address you set in **Admin Panel → Manage Email**
5. You should receive the email! 🎉

## How It Works:

1. **User enters email** → Clicks "Send"
2. **EmailJS sends email** to the recipient email (from Admin Panel)
3. **Subscription is saved** in Firestore
4. **User sees success message**

## Free Tier Limits:

- **200 emails/month** (free tier)
- Perfect for small to medium websites
- Upgrade if you need more

## Troubleshooting:

### Email not received?

1. **Check spam folder** - Emails might go to spam
2. **Verify all 3 values** in `.env.local` are correct
3. **Check EmailJS dashboard** - Go to Logs to see if email was sent
4. **Restart server** after adding environment variables
5. **Check browser console** (F12) for errors

### Still not working?

- Make sure you restarted the server after adding `.env.local` values
- Verify Service ID, Template ID, and Public Key are correct
- Check EmailJS dashboard → Logs for error messages
- Make sure your email service (Gmail/Outlook) is properly connected

## Important Notes:

- The `to_email` in the template will automatically use the email from **Admin Panel → Manage Email**
- You can change the recipient email anytime from Admin Panel
- All subscriptions are also saved in Firestore for backup

## That's It!

No SMTP, no complex setup - just add 3 values to `.env.local` and it works! 🚀


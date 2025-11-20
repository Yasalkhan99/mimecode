# Simple Email Setup - Newsletter Subscription

## How It Works

The newsletter subscription now works like a basic contact form:

1. **User enters email** → Clicks "Send"
2. **Subscription is saved** in Firestore database
3. **Email is sent** (if SMTP configured) OR stored for admin to check

## Option 1: Check Subscriptions in Firestore (No Setup Required)

**No configuration needed!** Subscriptions are automatically saved in Firestore.

### View Subscriptions:

1. Go to Firebase Console → Firestore Database
2. Look for collection: `newsletterSubscriptions`
3. All subscriptions are stored there with:
   - Email address
   - Date/time
   - Recipient email
   - Status

### Export Subscriptions:

You can export all emails from Firestore and add them to your newsletter service manually.

## Option 2: Setup EmailJS (Recommended - Free & Easy)

EmailJS is a free service that sends emails directly from the browser - no backend needed!

### Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for free account
3. Verify your email

### Step 2: Add Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose **Gmail** (or your email provider)
4. Connect your Gmail account
5. **Copy the Service ID**

### Step 3: Create Email Template

1. Go to **Email Templates**
2. Click **Create New Template**
3. Use this template:

```
Subject: New Newsletter Subscription Request

Content:
New newsletter subscription request:

Email: {{user_email}}
Date: {{date}}

Please add this email to your newsletter list.
```

4. Set **To Email** field to: `{{to_email}}`
5. **Copy the Template ID**

### Step 4: Get Public Key

1. Go to **Account** → **General**
2. **Copy your Public Key**

### Step 5: Add to .env.local

Add these lines to your `.env.local` file:

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
```

### Step 6: Restart Server

```bash
npm run dev
```

## Option 3: Setup SMTP (For Production)

If you want to use SMTP, follow the instructions in `EMAIL_SETUP.md`.

## Current Behavior

- ✅ Subscriptions are **always saved** in Firestore
- ✅ If EmailJS is configured → Email sent via EmailJS
- ✅ If SMTP is configured → Email sent via SMTP
- ✅ If neither configured → Subscription saved in Firestore (you can check manually)

## Admin Panel Integration

You can view all subscriptions in Firebase Console, or we can add a page in Admin Panel to view them. Let me know if you want that feature!


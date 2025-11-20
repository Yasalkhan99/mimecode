# Email Setup Guide - Newsletter Subscription

## Problem
Newsletter subscription emails are not being sent because SMTP (email server) is not configured.

## Solution: Configure Gmail SMTP

### Step 1: Enable Gmail App Password

1. Go to your Google Account: https://myaccount.google.com
2. Click on **Security** (left sidebar)
3. Enable **2-Step Verification** (if not already enabled)
4. Scroll down to **App passwords**
5. Click **App passwords**
6. Select **Mail** and **Other (Custom name)**
7. Enter name: "AvailCoupon Newsletter"
8. Click **Generate**
9. **Copy the 16-character password** (you'll need this)

### Step 2: Add SMTP Credentials to .env.local

Open your `.env.local` file and add these lines:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
```

**Important:**
- Replace `your-email@gmail.com` with your Gmail address
- Replace `your-16-character-app-password` with the app password you generated in Step 1
- Do NOT use your regular Gmail password - use the App Password!

### Step 3: Restart Your Development Server

After adding the SMTP credentials:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 4: Test

1. Go to your website
2. Enter an email in the newsletter form
3. Click "Send"
4. Check the email address you set in Admin Panel → Manage Email
5. You should receive the subscription email!

## Alternative: Other Email Services

### Using Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
```

### Using Custom SMTP Server

```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
```

## Troubleshooting

### Email not received?

1. **Check spam folder** - Emails might go to spam
2. **Verify SMTP credentials** - Make sure they're correct in `.env.local`
3. **Check server logs** - Look for error messages in terminal
4. **Test SMTP connection** - Make sure your email provider allows SMTP access

### Gmail App Password not working?

- Make sure 2-Step Verification is enabled
- Generate a new App Password
- Wait a few minutes after generating (sometimes takes time to activate)

### Still not working?

Check the browser console (F12) and server terminal for error messages. Common issues:
- Wrong SMTP port (587 for TLS, 465 for SSL)
- Firewall blocking SMTP
- Email provider blocking SMTP from your server

## Security Notes

- Never commit `.env.local` to git
- Keep your App Password secure
- Use environment variables for production deployment
- Consider using a dedicated email service (SendGrid, Mailgun) for production


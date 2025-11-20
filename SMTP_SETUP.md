# SMTP Email Setup Guide

## What is SMTP?

SMTP (Simple Mail Transfer Protocol) is the standard way to send emails. You can use Gmail, Outlook, Yahoo, or any email provider's SMTP server.

## Quick Setup (5 minutes)

### Option 1: Gmail SMTP (Recommended for Testing)

#### Step 1: Enable App Password

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** → **2-Step Verification** (enable if not enabled)
3. Go to **App passwords**: https://myaccount.google.com/apppasswords
4. Select **Mail** and **Other (Custom name)**
5. Enter name: "AvailCoupon Newsletter"
6. Click **Generate**
7. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

#### Step 2: Add to .env.local

**Option A: Port 587 (TLS) - Try this first:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=AvailCoupon <your-email@gmail.com>
```

**Option B: Port 465 (SSL) - Use if 587 doesn't work:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=AvailCoupon <your-email@gmail.com>
```

**Important:** 
- Use your **Gmail address** for `SMTP_USER`
- Use the **16-character app password** (remove spaces) for `SMTP_PASSWORD`
- NOT your regular Gmail password!
- **If you get connection timeout on port 587, use port 465**

---

### Option 2: Outlook/Hotmail SMTP

#### Step 1: Enable App Password

1. Go to https://account.microsoft.com/security
2. Click **Advanced security options**
3. Under **App passwords**, click **Create a new app password**
4. Enter name: "AvailCoupon Newsletter"
5. **Copy the password**

#### Step 2: Add to .env.local

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=AvailCoupon <your-email@outlook.com>
```

---

### Option 3: Yahoo SMTP

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=AvailCoupon <your-email@yahoo.com>
```

**Note:** Yahoo also requires app password. Enable it from Yahoo Account Security settings.

---

### Option 4: Custom SMTP (Any Email Provider)

```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASSWORD=your-password
SMTP_FROM=AvailCoupon <noreply@yourdomain.com>
```

**Common SMTP Ports:**
- **587** - TLS (recommended)
- **465** - SSL
- **25** - Standard (may be blocked)

---

## Step 3: Restart Server

```bash
npm run dev
```

## Test It!

1. Go to your website
2. Enter email in newsletter form
3. Click "Send"
4. Check the email address you set in **Admin Panel → Manage Email**
5. You should receive the email! 🎉

## Troubleshooting

### "Invalid login" or "Authentication failed"

- **Gmail:** Make sure you're using **App Password**, not regular password
- **Outlook:** Make sure 2FA is enabled and you're using App Password
- Check that email and password are correct (no extra spaces)

### "Connection timeout" (ETIMEDOUT / ESOCKET)

**Common causes:**
1. **Firewall blocking port 587** - Try port 465 instead
2. **ISP blocking SMTP ports** - Use port 465 (SSL) instead of 587
3. **Network restrictions** - Check if your network allows SMTP

**Solutions:**
- Change `SMTP_PORT=587` to `SMTP_PORT=465` in `.env.local`
- Code automatically tries port 465 if 587 fails
- Make sure you're using **App Password**, not regular password
- Try from a different network (mobile hotspot) to test

**If still not working:**
- Check if your firewall/antivirus is blocking the connection
- Try using Outlook or Yahoo SMTP instead
- Contact your ISP if they're blocking SMTP ports

### Email not received?

1. **Check spam folder** - Emails might go to spam
2. **Check server logs** - Look for error messages
3. **Verify SMTP settings** - Make sure all values are correct
4. **Test with different email** - Try sending to a different email address

### Gmail "Less secure app" error?

- Gmail no longer supports "less secure apps"
- You **MUST** use **App Password** (see Step 1 above)
- Regular password won't work!

## Environment Variables Summary

```env
# Required
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional (has defaults)
SMTP_PORT=587
SMTP_FROM=AvailCoupon <your-email@gmail.com>
```

## Security Notes

- **Never commit `.env.local` to git** (already in .gitignore)
- **Use App Passwords** instead of regular passwords
- **Keep your credentials secure**
- For production, consider using environment variables in your hosting platform

## That's It!

SMTP setup is simple and works with any email provider! 🚀


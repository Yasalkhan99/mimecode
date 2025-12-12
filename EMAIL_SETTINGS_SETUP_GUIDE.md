# 📧 Email Settings Setup Guide

## Problem: Email Settings Not Saving

If you see this error:
```
❌ Firebase Admin SDK not initialized!
```

This means Firebase Admin SDK is not configured, and email settings cannot be saved to Firebase.

---

## ✅ Solution: Configure Firebase Admin SDK

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ **Settings** (top left) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file
7. Save it as `firebase-service-account.json` in your project root

### Step 2: Update `.env.local` File

Open your `.env.local` file and add:

```env
# Firebase Admin SDK - Path to service account JSON
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Firebase Storage Bucket (get from Firebase Console)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

**Or** if you prefer to use the JSON directly (for Vercel deployment):

```env
# Firebase Admin SDK - JSON as string
FIREBASE_ADMIN_SA='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

### Step 3: Restart Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

### Step 4: Verify Configuration

Run the check script:

```bash
npm run check:emails
```

You should see:
```
✅ Firebase Admin SDK initialized
📧 Current Email Settings:
==========================
Email 1: support@mimecode.com
Email 2: yasalkhan90@gmail.com
Email 3: social@mimecode.com
Email 4: compliance@mimecode.com
Email 5: finance@mimecode.com
Email 6: publisher@mimecode.com
==========================

✅ Active Email Addresses: 6
```

---

## 🧪 Test Email Settings

### 1. Save Email Settings

1. Go to: `http://localhost:3000/admin/email`
2. Fill in all 6 email addresses
3. Click **Save Email Settings**
4. You should see: ✅ "Email settings saved successfully!"

### 2. Verify in Terminal

```bash
npm run check:emails
```

All 6 emails should now show up!

### 3. Test Contact Form

1. Go to contact page
2. Submit a message
3. Check terminal logs - should see:
   ```
   ✉️  Sending to 6 email(s): [ 'email1@...', 'email2@...', ... ]
   ```
4. All 6 email addresses should receive the message!

---

## 🔒 Security Note

**IMPORTANT**: Add `firebase-service-account.json` to `.gitignore`:

```gitignore
# Firebase
firebase-service-account.json
.env.local
```

Never commit your service account keys to GitHub!

---

## 📝 Additional Environment Variables

For complete email functionality, also add to `.env.local`:

```env
# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=MimeCode <noreply@mimecode.com>

# Collection Names
NEXT_PUBLIC_EMAIL_SETTINGS_COLLECTION=emailSettings-mimecode
NEXT_PUBLIC_NEWSLETTER_SUBSCRIPTIONS_COLLECTION=newsletterSubscriptions-mimecode
NEXT_PUBLIC_CONTACT_SUBMISSIONS_COLLECTION=contactSubmissions-mimecode
```

---

## 🎯 Quick Checklist

- [ ] Firebase service account JSON downloaded
- [ ] `FIREBASE_SERVICE_ACCOUNT_PATH` or `FIREBASE_ADMIN_SA` added to `.env.local`
- [ ] Dev server restarted
- [ ] `npm run check:emails` shows all 6 emails
- [ ] Test email sent successfully to all 6 addresses

---

## 🚨 Troubleshooting

### Issue: "File not found" error
- Make sure `firebase-service-account.json` is in the project root
- Check the path in `FIREBASE_SERVICE_ACCOUNT_PATH`

### Issue: "Invalid JSON" error
- Use `FIREBASE_SERVICE_ACCOUNT_PATH` instead of `FIREBASE_ADMIN_SA`
- Make sure JSON file is valid

### Issue: Emails still only going to email1
- Run `npm run check:emails` to verify all 6 are saved
- Restart dev server
- Check browser console for errors
- Clear browser cache (Ctrl+Shift+R)

---

Need more help? Check the terminal logs for detailed error messages!


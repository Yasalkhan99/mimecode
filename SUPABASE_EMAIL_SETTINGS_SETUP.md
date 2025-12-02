# 📧 Supabase Email Settings Setup Guide

## ✅ Migration Complete: Firebase → Supabase

Email settings are now stored in **Supabase** (no Firebase needed!)

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Run SQL in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Create email_settings table in Supabase
CREATE TABLE IF NOT EXISTS email_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email1 TEXT NOT NULL DEFAULT '',
  email2 TEXT DEFAULT '',
  email3 TEXT DEFAULT '',
  email4 TEXT DEFAULT '',
  email5 TEXT DEFAULT '',
  email6 TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings (only if table is empty)
INSERT INTO email_settings (email1, email2, email3, email4, email5, email6)
SELECT 'admin@mimecode.com', '', '', '', '', ''
WHERE NOT EXISTS (SELECT 1 FROM email_settings);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_settings_updated_at ON email_settings(updated_at DESC);
```

6. Click **Run** (or press F5)
7. You should see: ✅ "Success. No rows returned"

---

### Step 2: Configure Email Addresses

1. Start/restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to admin panel:
   ```
   http://localhost:3000/admin/email
   ```

3. Fill in all 6 email addresses:
   - Email 1: `support@mimecode.com`
   - Email 2: `yasalkhan90@gmail.com`
   - Email 3: `social@mimecode.com`
   - Email 4: `compliance@mimecode.com`
   - Email 5: `finance@mimecode.com`
   - Email 6: `publisher@mimecode.com`

4. Click **Save Email Settings**
5. You should see: ✅ "Email settings saved successfully!"

---

### Step 3: Verify Setup

Run the verification script:

```bash
npm run check:emails
```

**Expected Output:**
```
✅ Supabase connected
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
Recipients: [ 'support@...', 'yasalkhan90@...', ... ]

📤 Emails will be sent to:
   1. support@mimecode.com
   2. yasalkhan90@gmail.com
   3. social@mimecode.com
   4. compliance@mimecode.com
   5. finance@mimecode.com
   6. publisher@mimecode.com
```

---

## 🧪 Test Email Sending

### Test Contact Form

1. Go to your contact page
2. Fill out and submit the form
3. Check terminal logs:
   ```
   📧 Contact Form Submission: { ... }
   ✉️  Sending to 6 email(s): [ ... ]
   ```
4. All 6 email addresses should receive the message!

### Test Newsletter Subscription

1. Subscribe to newsletter
2. Check terminal logs:
   ```
   📧 Email Settings: { ... }
   ✉️  Sending to 6 email(s): [ ... ]
   ```
3. All 6 email addresses should receive the notification!

---

## 📊 How It Works

### Database Structure

```
email_settings (Supabase table)
├── id (UUID, Primary Key)
├── email1 (TEXT) - Main admin email
├── email2 (TEXT) - Secondary email
├── email3 (TEXT) - Third email
├── email4 (TEXT) - Fourth email
├── email5 (TEXT) - Fifth email
├── email6 (TEXT) - Sixth email
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Email Distribution Logic

```typescript
// All non-empty emails are collected
const recipients = [
  emailSettings?.email1,
  emailSettings?.email2,
  emailSettings?.email3,
  emailSettings?.email4,
  emailSettings?.email5,
  emailSettings?.email6,
].filter(e => e && e.trim() !== '');

// Send to all recipients
await sendEmail({
  to: recipients.join(', '),
  subject: '...',
  body: '...'
});
```

---

## 🔄 Migration from Firebase (Optional)

If you have existing email settings in Firebase, you can manually copy them:

1. Check Firebase settings (if accessible)
2. Update in Supabase admin panel
3. Save and verify

**Note**: Firebase is no longer needed for email settings!

---

## ⚙️ Environment Variables

**No Firebase variables needed!** Just ensure Supabase is configured:

```env
# Supabase Configuration (already set up)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# SMTP Configuration (for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=MimeCode <noreply@mimecode.com>
```

---

## 🎯 Features

✅ **6 Email Addresses** - Send to up to 6 recipients  
✅ **No Firebase Dependency** - Pure Supabase solution  
✅ **Real-time Updates** - Changes apply immediately  
✅ **Automatic Filtering** - Empty emails are skipped  
✅ **Admin Panel** - Easy configuration via UI  
✅ **Verification Script** - Check setup anytime  

---

## 🚨 Troubleshooting

### Issue: "Supabase admin client not initialized"

**Solution**: Check your `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Issue: Table doesn't exist

**Solution**: Run the SQL script in Supabase SQL Editor (Step 1)

### Issue: Emails still only going to one address

**Solution**: 
1. Run `npm run check:emails` to verify all 6 are saved
2. Restart dev server: `npm run dev`
3. Clear browser cache (Ctrl+Shift+R)

### Issue: Can't save settings in admin panel

**Solution**:
1. Check browser console for errors
2. Verify Supabase connection
3. Check that `email_settings` table exists
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is set

---

## 📝 Quick Commands

```bash
# Check email settings
npm run check:emails

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## ✨ Benefits of Supabase Migration

1. **No Firebase Dependency** - One less service to manage
2. **Faster Queries** - Direct PostgreSQL access
3. **Better Type Safety** - TypeScript support
4. **Easier Debugging** - SQL queries are simpler
5. **Consistent Stack** - Everything in Supabase

---

Need help? Check terminal logs for detailed error messages!


# Firebase Admin SDK Setup for Logo Upload

## Problem
If you're getting "FIREBASE_ADMIN_SA not configured" error, follow these steps:

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the **gear icon** (⚙️) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download (e.g., `availcoupon-5ff01-firebase-adminsdk-xxxxx.json`)

## Step 2: Add to .env.local

Open your `.env.local` file and add this line:

```env
FIREBASE_ADMIN_SA='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

### Important Formatting Rules:

1. **Wrap entire JSON in single quotes** (`'...'`)
2. **Keep `\n` in private_key** - Don't replace with actual newlines
3. **No line breaks** - Keep it all on one line
4. **Replace the values** with actual values from your downloaded JSON file

### Example (with actual values):

```env
FIREBASE_ADMIN_SA='{"type":"service_account","project_id":"availcoupon-5ff01","private_key_id":"abc123","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@availcoupon-5ff01.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40availcoupon-5ff01.iam.gserviceaccount.com"}'
```

## Step 3: Verify Your .env.local File

Make sure your `.env.local` file has:

```env
# Firebase Web Config (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (required for file uploads)
FIREBASE_ADMIN_SA='{"type":"service_account",...}'
```

## Step 4: Restart Dev Server

**IMPORTANT:** After adding `FIREBASE_ADMIN_SA`, you MUST restart your dev server:

1. Stop the server (Ctrl+C in terminal)
2. Start again: `npm run dev`

Next.js only loads environment variables on startup!

## Step 5: Test

1. Try creating a coupon with a logo file
2. Check server console (terminal) for logs
3. You should see: `✅ FIREBASE_ADMIN_SA found, attempting Admin SDK upload...`

## Troubleshooting

### If still getting "not configured" error:

1. **Check file name**: Must be `.env.local` (not `.env`)
2. **Check location**: File must be in project root (same folder as `package.json`)
3. **Check format**: Must be wrapped in single quotes
4. **Restart server**: Environment variables only load on startup
5. **Check server console**: Look for the debug logs showing `hasAdminSA: true/false`

### Common Mistakes:

❌ **Wrong**: `FIREBASE_ADMIN_SA={"type":"service_account",...}` (no quotes)
❌ **Wrong**: `FIREBASE_ADMIN_SA="{"type":"service_account",...}"` (double quotes)
✅ **Correct**: `FIREBASE_ADMIN_SA='{"type":"service_account",...}'` (single quotes)

❌ **Wrong**: File in wrong location
✅ **Correct**: File in project root (where `package.json` is)

❌ **Wrong**: Added variable but didn't restart server
✅ **Correct**: Restart dev server after adding

## Alternative: Use Cloudinary URL Instead

If you don't want to set up Firebase Admin SDK, you can:
1. Upload logo to Cloudinary manually
2. Use the "URL (Cloudinary)" option in the form
3. Paste the Cloudinary URL

This doesn't require FIREBASE_ADMIN_SA.


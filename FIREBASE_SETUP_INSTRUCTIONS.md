# Firebase Admin SDK Setup for Logo Upload

## Overview

Firebase Admin SDK is required for server-side file uploads (coupon logos, banners, etc.). The project now uses a **centralized configuration** in `lib/firebase-admin.ts` that supports two setup methods:

1. **Environment Variable** (Recommended for production) - Store service account JSON as an environment variable
2. **JSON File Path** (Convenient for local development) - Point to a service account JSON file

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the **gear icon** (⚙️) → **Project Settings**
4. Go to **Service Accounts** tab
5. Click **Generate New Private Key**
6. A JSON file will download (e.g., `availcoupon-5ff01-firebase-adminsdk-xxxxx.json`)

## Step 2: Choose Your Setup Method

### Method A: Environment Variable (Recommended for Production/Vercel)

This method stores the service account credentials as an environment variable. Best for production deployments.

### Method B: JSON File Path (Convenient for Local Development)

This method uses a JSON file in your project. Easier for local development but requires managing the file.

---

## Method A: Environment Variable Setup

### Step 2A: Add to .env.local

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

### Step 3A: Verify Your .env.local File

Make sure your `.env.local` file has:

```env
# Firebase Web Config (required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (required for file uploads) - Method A
FIREBASE_ADMIN_SA='{"type":"service_account",...}'
```

---

## Method B: JSON File Path Setup

### Step 2B: Copy JSON File to Project

1. Copy the downloaded service account JSON file to your project root
2. Rename it to `firebase-service-account.json` (or keep original name)
3. **Important**: The file is already in `.gitignore` - it won't be committed to git

### Step 3B: Add to .env.local

Add this line to your `.env.local`:

```env
# Firebase Admin SDK - Method B (JSON file path)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Or if you kept the original filename:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./availcoupon-5ff01-firebase-adminsdk-xxxxx.json
```

**Note**: The path is relative to your project root (where `package.json` is).

---

## Step 4: Restart Dev Server

**IMPORTANT:** After adding `FIREBASE_ADMIN_SA`, you MUST restart your dev server:

1. Stop the server (Ctrl+C in terminal)
2. Start again: `npm run dev`

Next.js only loads environment variables on startup!

## Step 5: Test

1. Try creating a coupon with a logo file
2. Check server console (terminal) for logs
3. You should see one of these messages:
   - `✅ Firebase Admin SDK initialized from FIREBASE_ADMIN_SA` (Method A)
   - `✅ Firebase Admin SDK initialized from service account file` (Method B)

## How It Works

The centralized configuration in `lib/firebase-admin.ts` automatically:
- Checks for `FIREBASE_ADMIN_SA` environment variable first (Method A)
- Falls back to `FIREBASE_SERVICE_ACCOUNT_PATH` if Method A is not set (Method B)
- Initializes Firebase Admin SDK only once (singleton pattern)
- Provides convenient functions: `getAdminStorage()`, `getAdminFirestore()`, `getAdminAuth()`

All API routes (`app/api/coupons/upload/route.ts`, `app/api/banners/upload/route.ts`) now use this centralized configuration.

## Troubleshooting

### If still getting "not configured" error:

**For Method A (Environment Variable):**
1. **Check file name**: Must be `.env.local` (not `.env`)
2. **Check location**: File must be in project root (same folder as `package.json`)
3. **Check format**: Must be wrapped in single quotes
4. **Restart server**: Environment variables only load on startup
5. **Check server console**: Look for initialization messages

**For Method B (JSON File):**
1. **Check file path**: Must be relative to project root (e.g., `./firebase-service-account.json`)
2. **Check file exists**: Verify the JSON file is in the project directory
3. **Check file format**: Must be valid JSON
4. **Check .env.local**: `FIREBASE_SERVICE_ACCOUNT_PATH` must be set correctly
5. **Restart server**: Environment variables only load on startup

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


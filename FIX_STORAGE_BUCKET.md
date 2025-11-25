# Fix: "The specified bucket does not exist" Error

## Problem
```
Failed to save file to storage: The specified bucket does not exist.
```

## Solution Steps

### Step 1: Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **availcoupon-5ff01**
3. Go to **Storage** (left sidebar)
4. Click **Get Started**
5. Choose **Start in production mode** (or test mode for development)
6. Select a location for your storage bucket
7. Click **Done**

### Step 2: Verify Bucket Name

After enabling Storage, check the bucket name:

1. In Firebase Console → **Storage**
2. Click on the **Files** tab
3. Look at the URL or bucket name shown
4. It should be: `availcoupon-5ff01.appspot.com` or `gs://availcoupon-5ff01.appspot.com`

### Step 3: Update .env.local

Make sure your `.env.local` has:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=availcoupon-5ff01.appspot.com
```

**Note:** Use just the bucket name (e.g., `availcoupon-5ff01.appspot.com`), NOT `gs://availcoupon-5ff01.appspot.com`

### Step 4: Alternative - Try Without .appspot.com

If the above doesn't work, try using just the project ID:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=availcoupon-5ff01
```

### Step 5: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 6: Test Again

Use Postman to test the upload endpoint again.

---

## Verify Storage is Enabled

Check server console for:
```
📦 Storage bucket from env: availcoupon-5ff01.appspot.com
✅ Storage bucket configured: availcoupon-5ff01.appspot.com
📦 Attempting to use bucket: availcoupon-5ff01.appspot.com
✅ Bucket object created: availcoupon-5ff01.appspot.com
✅ Bucket exists and is accessible
```

---

## Common Issues

### Issue 1: Storage Not Enabled
**Solution:** Enable Storage in Firebase Console (Step 1 above)

### Issue 2: Wrong Bucket Name
**Solution:** Check Firebase Console for exact bucket name

### Issue 3: Bucket Name Format
**Solution:** Try both formats:
- `availcoupon-5ff01.appspot.com`
- `availcoupon-5ff01`

---

## Still Not Working?

1. Check Firebase Console → Storage → Files tab
2. Verify bucket name matches `.env.local`
3. Check server console for detailed error messages
4. Make sure Storage is enabled (not just Firestore)


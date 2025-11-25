# Fix: "Invalid PEM formatted message" Error

## Problem
You're getting this error:
```
Failed to parse private key: Error: Invalid PEM formatted message
```

This happens when the `private_key` in `FIREBASE_ADMIN_SA` has incorrect newline formatting.

---

## Solution: Fix Private Key Format

### Option 1: Use the Helper Script (Recommended)

1. **Copy your service account JSON file** to project root
   - File: `availcoupon-5ff01-firebase-adminsdk-fbsvc-279db5c9c8.json`

2. **Run the formatting script:**
   ```bash
   node scripts/fix-env-format.js "C:\Users\User\Downloads\availcoupon-5ff01-firebase-adminsdk-fbsvc-279db5c9c8.json"
   ```

3. **Copy the output** and paste into `.env.local`

---

### Option 2: Manual Fix

The issue is that `private_key` needs `\n` (escaped newlines), not actual newlines.

**In your `.env.local`, the private_key should look like:**
```env
FIREBASE_ADMIN_SA='{"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\\n-----END PRIVATE KEY-----\\n",...}'
```

**NOT like this (wrong):**
```env
FIREBASE_ADMIN_SA='{"type":"service_account","private_key":"-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----
",...}'
```

---

### Option 3: Use JSON File Instead (Easier for Local Dev)

Instead of using environment variable, use the JSON file directly:

1. **Copy JSON file to project root:**
   ```bash
   copy "C:\Users\User\Downloads\availcoupon-5ff01-firebase-adminsdk-fbsvc-279db5c9c8.json" "firebase-service-account.json"
   ```

2. **Add to `.env.local`:**
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

3. **Restart dev server**

This method is easier because you don't need to worry about newline escaping!

---

## Quick Test

After fixing, test with Postman:

**URL:** `POST http://localhost:3000/api/coupons/upload`

**Body:**
```json
{
  "fileName": "test.png",
  "contentType": "image/png",
  "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Expected Response:**
```json
{
  "success": true,
  "logoUrl": "https://storage.googleapis.com/..."
}
```

---

## Common Mistakes

❌ **Wrong:** Using actual newlines in private_key
```env
FIREBASE_ADMIN_SA='{"private_key":"-----BEGIN PRIVATE KEY-----
actual newline here
-----END PRIVATE KEY-----"}'
```

✅ **Correct:** Using escaped newlines `\n`
```env
FIREBASE_ADMIN_SA='{"private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"}'
```

---

## Still Having Issues?

1. **Check server console** - Look for detailed error messages
2. **Verify JSON is valid** - Use https://jsonlint.com/ to validate
3. **Restart dev server** - Environment variables only load on startup
4. **Try Method B** - Use JSON file path instead of environment variable


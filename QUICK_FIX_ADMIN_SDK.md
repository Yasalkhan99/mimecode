# Quick Fix: Firebase Admin SDK Not Initialized

## Error Message
```
Firebase Admin SDK not initialized. Please configure FIREBASE_ADMIN_SA or FIREBASE_SERVICE_ACCOUNT_PATH
```

---

## Step 1: Check Your .env.local File

Open `.env.local` in your project root and verify:

### Option A: Using Environment Variable

```env
FIREBASE_ADMIN_SA='{"type":"service_account","project_id":"availcoupon-5ff01",...}'
```

**Check:**
- ✅ Is it wrapped in single quotes `'...'`?
- ✅ Does it start with `{"type":"service_account"`?
- ✅ Is it all on one line (no actual line breaks)?

### Option B: Using JSON File (Easier!)

```env
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

**Check:**
- ✅ Does the file exist at that path?
- ✅ Is the path correct?

---

## Step 2: Quick Setup (Recommended - Easiest Method)

### Copy JSON File to Project

1. **Copy your service account JSON file:**
   ```powershell
   copy "C:\Users\User\Downloads\availcoupon-5ff01-firebase-adminsdk-fbsvc-279db5c9c8.json" "firebase-service-account.json"
   ```

2. **Add to `.env.local`:**
   ```env
   FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
   ```

3. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

## Step 3: Check Server Console

After restarting, look for these messages in your server console:

### ✅ Success Messages:
```
🔧 Attempting to initialize Firebase Admin from FIREBASE_ADMIN_SA...
✅ Firebase Admin SDK initialized from FIREBASE_ADMIN_SA
```

OR

```
🔧 Attempting to initialize Firebase Admin from file: ./firebase-service-account.json
✅ Firebase Admin SDK initialized from service account file
```

### ❌ Error Messages:
```
❌ Failed to initialize from FIREBASE_ADMIN_SA: [error details]
```

If you see errors, check:
- JSON format is valid
- Private key has `\n` escape sequences (not actual newlines)
- All required fields are present

---

## Step 4: Test Again

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

---

## Common Issues

### Issue 1: Environment Variable Not Loading
**Solution:** Restart dev server after adding/changing `.env.local`

### Issue 2: Invalid JSON Format
**Solution:** Use the helper script:
```bash
node scripts/fix-env-format.js "path/to/service-account.json"
```

### Issue 3: File Path Not Found
**Solution:** Use absolute path or verify file exists:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=C:\Users\User\Documents\availcoupon\availcoupon\firebase-service-account.json
```

---

## Still Not Working?

1. **Check server console** - Look for detailed error messages
2. **Verify file exists** - Check if JSON file is in the right location
3. **Check JSON validity** - Use https://jsonlint.com/ to validate
4. **Try Method B** - Use file path instead of environment variable

---

## Need Help?

Check these files for more details:
- `FIREBASE_SETUP_INSTRUCTIONS.md` - Complete setup guide
- `FIX_PRIVATE_KEY_ERROR.md` - Private key formatting issues
- Server console logs - Most detailed error information


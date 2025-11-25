# Test Firebase Admin SDK Setup

## Quick Test Steps

1. **Restart Dev Server** (IMPORTANT!)
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

2. **Check Server Console** - Look for these messages:
   ```
   🔧 Attempting to initialize Firebase Admin from file: ./availcoupon-5ff01-firebase-adminsdk-fbsvc-279db5c9c8.json
   📁 Resolved file path: C:\Users\User\Documents\availcoupon\availcoupon\availcoupon-5ff01-firebase-adminsdk-fbsvc-279db5c9c8.json
   ✅ Service account JSON loaded successfully
   📋 Project ID: availcoupon-5ff01
   ✅ Firebase Admin SDK initialized from service account file
   ```

3. **Test with Postman:**
   - URL: `POST http://localhost:3000/api/coupons/upload`
   - Body:
   ```json
   {
     "fileName": "test.png",
     "contentType": "image/png",
     "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
   }
   ```

## If Still Getting Error

Check server console for:
- ❌ File not found errors
- ❌ JSON parse errors
- ❌ Initialization errors

Share the exact error message from server console.


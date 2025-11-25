# Postman Test for `/api/coupons/upload`

## Request Details

### Method
```
POST
```

### URL
```
http://localhost:3000/api/coupons/upload
```

**For Production/Vercel:**
```
https://your-domain.com/api/coupons/upload
```

---

## Headers

```
Content-Type: application/json
```

---

## Request Body (JSON)

### Required Fields:
- `fileName` (string) - Name of the file
- `base64` (string) - Base64 encoded image data
- `contentType` (string, optional) - MIME type of the image

### Example Request Body:

```json
{
  "fileName": "nike-logo.png",
  "contentType": "image/png",
  "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

---

## How to Get Base64 from an Image

### Option 1: Online Tool
1. Go to https://www.base64-image.de/
2. Upload your image
3. Copy the base64 string (without `data:image/png;base64,` prefix)

### Option 2: Using Node.js
```javascript
const fs = require('fs');
const image = fs.readFileSync('path/to/image.png');
const base64 = image.toString('base64');
console.log(base64);
```

### Option 3: Using Browser Console
```javascript
// In browser console
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.onchange = (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result.split(',')[1]; // Remove data URL prefix
    console.log(base64);
  };
  reader.readAsDataURL(file);
};
fileInput.click();
```

---

## Expected Success Response (200)

```json
{
  "success": true,
  "logoUrl": "https://storage.googleapis.com/your-bucket-name.appspot.com/coupon_logos/1234567890_nike-logo.png"
}
```

---

## Expected Error Responses

### 400 - Missing File Data
```json
{
  "success": false,
  "error": "Missing file data"
}
```

### 500 - Firebase Admin Not Configured
```json
{
  "success": false,
  "error": "FIREBASE_ADMIN_SA not configured. Logo upload requires Firebase Admin SDK. Please add FIREBASE_ADMIN_SA to your .env.local file. The coupon will be created without a logo."
}
```

### 500 - Admin SDK Error
```json
{
  "success": false,
  "error": "Admin SDK upload failed: [specific error message]. Please check your FIREBASE_ADMIN_SA configuration and server logs for details."
}
```

---

## Complete Postman Setup

### Step 1: Create New Request
1. Open Postman
2. Click "New" → "HTTP Request"
3. Set method to **POST**

### Step 2: Set URL
```
http://localhost:3000/api/coupons/upload
```

### Step 3: Set Headers
- Key: `Content-Type`
- Value: `application/json`

### Step 4: Set Body
1. Go to "Body" tab
2. Select "raw"
3. Select "JSON" from dropdown
4. Paste this example:

```json
{
  "fileName": "test-logo.png",
  "contentType": "image/png",
  "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

**Note:** Replace the `base64` value with a real base64-encoded image string.

### Step 5: Send Request
Click "Send" button

---

## Test with cURL (Alternative)

```bash
curl -X POST http://localhost:3000/api/coupons/upload \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test-logo.png",
    "contentType": "image/png",
    "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

---

## Troubleshooting

### If you get 500 error:
1. Check server console logs for detailed error
2. Verify `FIREBASE_ADMIN_SA` is set in `.env.local`
3. Verify `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` is set
4. Restart dev server after adding env variables

### If you get "Missing file data":
- Make sure `fileName` and `base64` fields are present in request body
- Check that base64 string is valid (no spaces, proper encoding)

### If upload succeeds but URL doesn't work:
- Check Firebase Storage bucket permissions
- Verify the file was actually uploaded in Firebase Console → Storage

---

## Quick Test Image Base64

Here's a 1x1 pixel PNG image for quick testing:

```json
{
  "fileName": "test.png",
  "contentType": "image/png",
  "base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
```

Copy this entire JSON and paste it in Postman body to test quickly!


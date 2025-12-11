# 🔥 Firebase Setup Guide

## Problem: Permission Denied Errors

If you're seeing errors like:
- `Missing or insufficient permissions`
- `permission-denied`
- Client-side data fetching failures

This means your Firestore Security Rules need to be updated.

## 🛠️ Solution: Update Firestore Security Rules

### Step 1: Open Firebase Console
1. Go to https://console.firebase.google.com
2. Select your project: **availcoupon-5ff01**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Update Security Rules

Replace your current rules with these:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==========================================
    // PUBLIC READ ACCESS (Client-Side)
    // ==========================================
    
    // Banners - Public read, Admin write only
    match /banners-mimecode/{document=**} {
      allow read: if true;
      allow write: if false; // Only via Admin SDK
    }
    
    // Stores - Public read, Admin write only
    match /stores-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Categories - Public read, Admin write only
    match /categories-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Coupons - Public read, Admin write only
    match /coupons-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // News/Blog - Public read, Admin write only
    match /news-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // FAQs - Public read, Admin write only
    match /faqs-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Store FAQs - Public read, Admin write only
    match /store-faqs-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Regions - Public read, Admin write only
    match /regions-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // Logos - Public read, Admin write only
    match /logos-mimecode/{document=**} {
      allow read: if true;
      allow write: if false;
    }
    
    // ==========================================
    // PRIVATE COLLECTIONS (Admin Only)
    // ==========================================
    
    // Email Settings - No client access
    match /email-settings/{document=**} {
      allow read, write: if false;
    }
    
    // Newsletter Subscribers - Write only (for subscriptions)
    match /newsletter-subscribers/{document=**} {
      allow read: if false;
      allow create: if true; // Allow users to subscribe
      allow update, delete: if false;
    }
    
    // ==========================================
    // DENY ALL OTHER COLLECTIONS
    // ==========================================
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish Rules
1. Click the **Publish** button at the top
2. Wait for confirmation message
3. Refresh your application

## ⚠️ Important Notes

### Why These Rules Are Safe:

1. **Public Read Only**: Users can only READ public data (banners, stores, coupons)
2. **No Client Writes**: Users CANNOT write/modify data directly
3. **Admin SDK Bypass**: Your admin panel uses Firebase Admin SDK which bypasses these rules
4. **API Routes**: All write operations go through `/api/` routes with Admin SDK

### Security Best Practices:

✅ **DO**:
- Keep all write operations via Admin SDK (API routes)
- Allow public read for product/content data
- Use HTTPS for all requests
- Keep service account JSON secure

❌ **DON'T**:
- Allow public write access
- Expose sensitive data (emails, passwords)
- Share your service account credentials
- Use `allow read, write: if true` for everything

## 🚀 After Updating Rules

Your app should now work without permission errors:
- ✅ Banners will load
- ✅ Stores will display
- ✅ Coupons will show
- ✅ Categories will work
- ✅ Admin panel still works (via API routes)

## 📊 Monitoring Usage

To prevent quota issues:

1. Go to Firebase Console → Usage
2. Monitor your daily reads/writes
3. Consider upgrading to Blaze plan if needed

### Free Tier Limits (Spark Plan):
- 50,000 document reads/day
- 20,000 document writes/day
- 20,000 document deletes/day
- 1 GB storage

### Blaze Plan (Pay-as-you-go):
- Unlimited operations
- First 50K reads free
- First 20K writes free
- $0.06 per 100K reads after
- $0.18 per 100K writes after

## 🆘 Still Having Issues?

If you're still seeing errors:

1. **Clear browser cache** and reload
2. **Check Firebase Admin SDK** is properly initialized
3. **Verify service account JSON** is in project root
4. **Check quota limits** in Firebase Console
5. **Wait 24 hours** if quota exceeded

## 📞 Need Help?

Check the logs:
```bash
npm run dev
```

Look for:
- `✅ Service account JSON loaded successfully`
- `✅ Firebase Admin SDK initialized`

If you see errors, check:
- `.env.local` file exists with correct Firebase config
- Service account JSON file path is correct
- Node modules are installed: `npm install`


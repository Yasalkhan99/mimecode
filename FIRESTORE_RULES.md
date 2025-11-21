# Firestore Security Rules

## Issue
If banners, logos, stores, coupons, or news articles uploaded in the admin panel are not displaying on the homepage (http://192.168.100.213:3000), it's likely due to Firestore security rules blocking public read access.

## Solution

Go to [Firebase Console](https://console.firebase.google.com) → Your Project → Firestore Database → Rules

Replace the rules with the following:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Public read access for homepage collections
    // Anyone can read these collections (required for homepage display)
    match /stores/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /banners/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /logos/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /coupons/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /news/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /categories/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    match /faqs/{document=**} {
      allow read: if true; // Public read
      allow write: if request.auth != null; // Only authenticated users can write
    }
    
    // Email settings - public read (for newsletter form), authenticated write (admin only)
    match /emailSettings/{document=**} {
      allow read: if true; // Public read (needed for newsletter subscription form)
      allow write: if request.auth != null; // Only authenticated admin users can write
    }
    
    // Newsletter subscriptions - public write (anyone can subscribe), authenticated read (admin only)
    match /newsletterSubscriptions/{document=**} {
      allow read: if request.auth != null; // Only authenticated admin users can read
      allow write: if true; // Anyone can subscribe (public write)
    }
    
    // Contact form submissions - public write (anyone can submit), authenticated read (admin only)
    match /contactSubmissions/{document=**} {
      allow read: if request.auth != null; // Only authenticated admin users can read
      allow write: if true; // Anyone can submit contact form (public write)
    }
    
    // Admin panel collections - require authentication for both read and write
    match /users/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Default: deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Quick Steps:

1. Open [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Firestore Database** → **Rules** tab
4. Paste the rules above
5. Click **Publish**

## After Updating Rules:

- The homepage will be able to read stores, banners, logos, coupons, and news without authentication
- The admin panel will still require authentication to write/edit data
- This is the correct setup for a public-facing coupon website

## Verify:

1. After publishing rules, refresh your homepage: http://192.168.100.213:3000
2. Check browser console (F12) for any Firestore permission errors
3. If data still doesn't appear, check:
   - Firebase environment variables are set correctly in `.env.local`
   - Collections exist in Firestore Database
   - Data has correct fields (`layoutPosition`, `isTrending`, etc.)


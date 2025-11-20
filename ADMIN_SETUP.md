# Admin Panel Setup Guide

## Installation & Configuration

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use an existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password authentication
4. Enable Firestore Database:
   - Go to Firestore Database
   - Create a database in production mode
   - Add security rules (see below)

### 2. Firebase Credentials

Get your Firebase configuration:
1. Go to Project Settings → General
2. Scroll down and find your Web API credentials
3. Copy the values and update `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules

Go to Firestore Database → Rules and replace with:

**Important:** The homepage needs public read access to display stores, banners, logos, coupons, and news. Only writes require authentication.

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

### 4. Create Admin User

1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email and password
4. Use these credentials to login to the admin panel

### 5. Run the Application

```bash
npm run dev
```

Then visit: `http://localhost:3000/admin/login`

## Admin Panel Features

### 📊 Dashboard
- Overview of total coupons, active coupons, total uses, and average discount
- Quick stats and recent coupons table

### 🎟️ Manage Coupons
- Create new coupons with discount type (percentage or fixed amount)
- Edit existing coupons
- Delete coupons
- Toggle coupon active/inactive status
- Set max uses and track usage

### 📈 Analytics
- Top 5 most used coupons
- Coupon type distribution
- Average usage rate
- Coupons expiring soon

## Database Schema (Firestore)

### Coupons Collection

```json
{
  "id": "auto-generated",
  "code": "SUMMER20",
  "discount": 20,
  "discountType": "percentage",
  "description": "20% off summer sale",
  "isActive": true,
  "maxUses": 1000,
  "currentUses": 250,
  "expiryDate": null,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## API Endpoints (Services)

All services are in `lib/services/couponService.ts`:

- `getCoupons()` - Get all coupons
- `getCouponById(id)` - Get specific coupon
- `getActiveCoupons()` - Get only active coupons
- `createCoupon(data)` - Create new coupon
- `updateCoupon(id, updates)` - Update coupon
- `deleteCoupon(id)` - Delete coupon
- `applyCoupon(code)` - Validate and apply coupon

## Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Vercel (recommended for Next.js):
   ```bash
   npm install -g vercel
   vercel
   ```

3. Add environment variables in Vercel dashboard

## Customization

### Add More Admin Features
- User management
- Sales reports
- Email notifications
- Multi-admin roles

### Styling
- The app uses Tailwind CSS (already configured)
- Update `app/globals.css` for custom styles

### Database Collections
- Add more collections for users, orders, etc.
- Update security rules accordingly

## Troubleshooting

### Firebase Connection Issues
- Check `.env.local` variables are correct
- Verify Firebase project has Firestore enabled
- Check security rules allow your auth user

### Login Not Working
- Ensure user exists in Firebase Authentication
- Check browser console for specific errors
- Verify Email/Password auth is enabled

### Coupons Not Showing
- Check Firestore Database has `coupons` collection
- Verify data structure matches schema
- Check security rules allow read access

## Support

For issues:
1. Check Firebase Console logs
2. Review browser console for errors
3. Verify all environment variables are set
4. Check Firestore security rules

# AvailCoupon Admin Panel - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Firebase Credentials
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create new project or select existing
3. Go to **Project Settings** → Copy your web config
4. Add to `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxxxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxxxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxxxx
```

### Step 2: Enable Firebase Services
- ✅ Authentication (Email/Password)
- ✅ Firestore Database

### Step 3: Create Admin User
- In Firebase Console → Authentication → Add User
- Example: admin@example.com / password123

### Step 4: Run the App
```bash
npm run dev
```
Visit: `http://localhost:3000/admin/login`

---

## 📁 Project Structure

```
availcoupon/
├── app/
│   ├── admin/
│   │   ├── layout.tsx          # Admin sidebar layout
│   │   ├── login/              # Login page
│   │   ├── dashboard/          # Dashboard stats
│   │   ├── coupons/            # Coupon management
│   │   │   └── [id]/           # Edit coupon
│   │   └── analytics/          # Analytics & reports
│   ├── globals.css
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── lib/
│   ├── firebase.ts             # Firebase config
│   ├── hooks/
│   │   └── useAuth.ts          # Auth hook
│   └── services/
│       └── couponService.ts    # Coupon operations
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── .env.local                  # Your credentials
```

---

## 🎯 Features

### Admin Dashboard
- **Real-time Stats**: Total coupons, active status, usage metrics
- **Quick Overview**: Recent coupons at a glance
- **Performance Metrics**: Average discount, usage rates

### Coupon Management
- ✨ **Create**: Add new coupons with percentage or fixed discount
- 📝 **Edit**: Modify existing coupon details
- 🗑️ **Delete**: Remove coupons
- 🔄 **Toggle**: Activate/Deactivate status
- 📊 **Track**: Monitor usage against max limit

### Analytics
- 📈 **Usage Analytics**: Top 5 most used coupons
- 📉 **Distribution**: Coupon type breakdown
- ⏰ **Expiration**: Track coupons expiring soon
- 📊 **Rates**: Usage rate percentages

---

## 🔐 Security

### Firestore Rules (Recommended for Production)
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coupons/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Environment Variables
- Never commit `.env.local`
- Keep Firebase credentials secure
- Use separate credentials for dev/prod

---

## 💾 Database Schema

### Coupons Collection
```javascript
{
  id: "auto-generated",
  code: "SUMMER20",                    // Unique coupon code
  discount: 20,                        // Discount value
  discountType: "percentage",          // "percentage" or "fixed"
  description: "20% off summer sale",
  isActive: true,                      // Active/Inactive toggle
  maxUses: 1000,                       // Maximum uses allowed
  currentUses: 250,                    // Current usage count
  expiryDate: null,                    // Expiration timestamp (optional)
  createdAt: Timestamp,                // Auto-generated
  updatedAt: Timestamp                 // Auto-updated
}
```

---

## 🛠️ API Reference

### Services (`lib/services/couponService.ts`)

```typescript
// Get all coupons
getCoupons(): Promise<Coupon[]>

// Get specific coupon
getCouponById(id: string): Promise<Coupon | null>

// Get active coupons only
getActiveCoupons(): Promise<Coupon[]>

// Create new coupon
createCoupon(coupon: Coupon): Promise<{success: boolean, id?: string}>

// Update coupon
updateCoupon(id: string, updates: Partial<Coupon>): Promise<{success: boolean}>

// Delete coupon
deleteCoupon(id: string): Promise<{success: boolean}>

// Validate coupon for use
applyCoupon(code: string): Promise<{valid: boolean, coupon?: Coupon}>
```

### Auth Hook (`lib/hooks/useAuth.ts`)

```typescript
const { user, loading, error } = useAuth()

// Returns:
// - user: Current authenticated user or null
// - loading: Loading state
// - error: Any auth errors
```

---

## 🚀 Deployment

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

Then add environment variables in Vercel dashboard settings.

### Deploy to Other Platforms
1. Build: `npm run build`
2. Start: `npm run start`
3. Add `.env.local` to your hosting platform

---

## 🐛 Troubleshooting

### "Firebase not initialized"
- Check `.env.local` has all 6 Firebase variables
- Verify values are copied correctly from Firebase Console

### "Coupon not found" errors
- Ensure Firestore Database is created
- Check collection is named exactly `coupons`
- Verify security rules allow your user

### Build errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Run `npm run build`

### Login always redirects
- Create user in Firebase Authentication
- Use email/password you created
- Check browser console for specific errors

---

## 📚 Next Steps

1. **Customize Styling**: Edit `app/globals.css`
2. **Add Features**: 
   - Email notifications
   - Bulk coupon import/export
   - User analytics
3. **Integrate**: Connect to your main app
4. **Scale**: Add cloud functions for advanced features

---

## 📞 Support Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Console](https://console.firebase.google.com)

---

## ✅ Checklist

Before going live:
- [ ] Firebase project created
- [ ] Authentication enabled
- [ ] Firestore Database created
- [ ] Security rules configured
- [ ] `.env.local` filled with credentials
- [ ] Admin user created
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server runs (`npm run dev`)
- [ ] Login works
- [ ] Can create/edit/delete coupons
- [ ] Analytics show data correctly

---

Happy coupon managing! 🎉

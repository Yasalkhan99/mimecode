# Admin Panel Integration Guide

## 🎯 What Was Built

Your new admin panel includes a complete Firebase-powered coupon management system with:

✅ **9 Production-Ready Components**
✅ **3 Core Services & Hooks**
✅ **Authentication System**
✅ **Real-time Database Integration**
✅ **Responsive UI with Tailwind CSS**

---

## 📦 What You Got

### Admin Pages
1. **Login Page** (`/admin/login`)
   - Email/Password authentication
   - Error handling
   - Auto-redirect to dashboard if logged in

2. **Dashboard** (`/admin/dashboard`)
   - Key statistics (total, active, usage, average discount)
   - Recent coupons quick view
   - Real-time data

3. **Coupon Management** (`/admin/coupons`)
   - List all coupons
   - Create new coupons
   - Edit/Delete functionality
   - Toggle active/inactive status
   - Inline form for quick creation

4. **Edit Coupon** (`/admin/coupons/[id]`)
   - Edit all coupon properties
   - Track usage
   - Update discount type

5. **Analytics** (`/admin/analytics`)
   - Top 5 most used coupons
   - Coupon type distribution
   - Usage rate metrics
   - Expiration tracking

### Backend Services
- **Firebase Config** - Centralized Firebase initialization
- **Auth Hook** - User authentication state management
- **Coupon Service** - All CRUD operations and validation

---

## 🔧 Setup Instructions

### 1. Firebase Project Setup

```bash
# Go to Firebase Console
# https://console.firebase.google.com

# Create new project (or use existing)
# Name: "AvailCoupon" (or your preference)
```

### 2. Enable Firebase Services

In Firebase Console:

**Authentication:**
- Go to Authentication → Sign-in method
- Enable "Email/Password"

**Firestore Database:**
- Go to Firestore Database
- Click "Create database"
- Choose "Production mode"
- Select your region
- Click "Create"

### 3. Get Firebase Credentials

```
Firebase Console → Project Settings (gear icon)
↓
Copy your Web configuration
↓
Fill in .env.local
```

### 4. Update `.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=<your_api_key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your_auth_domain>
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<your_project_id>
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=<your_storage_bucket>
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your_sender_id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your_app_id>
```

### 5. Create Admin User

```
Firebase Console → Authentication → Add user
↓
Email: admin@example.com
Password: [secure password]
↓
Click "Add user"
```

### 6. Set Security Rules

Go to Firestore Database → Rules → Replace with:

**For Development:**
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**For Production:**
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /coupons/{document=**} {
      allow read, write: if request.auth != null && hasAdminRole();
    }
  }
}

function hasAdminRole() {
  return request.auth.token.admin == true;
}
```

### 7. Run Your App

```bash
npm run dev
```

Visit: `http://localhost:3000/admin/login`

---

## 🔄 Integration with Your Main App

To use coupons in your main app:

```typescript
// In your checkout/payment page
import { applyCoupon } from '@/lib/services/couponService';

const handleApplyCoupon = async (code: string) => {
  const result = await applyCoupon(code);
  
  if (result.valid) {
    const discount = result.coupon?.discount;
    const type = result.coupon?.discountType;
    
    // Apply discount to cart
    if (type === 'percentage') {
      const discountAmount = (cartTotal * discount) / 100;
      setFinalTotal(cartTotal - discountAmount);
    } else {
      setFinalTotal(cartTotal - discount);
    }
    
    // Increment usage
    await updateCoupon(result.id, {
      currentUses: result.coupon!.currentUses + 1
    });
  } else {
    alert(result.message);
  }
};
```

---

## 📊 Database Collections

### coupons Collection

```json
{
  "code": "SUMMER20",
  "discount": 20,
  "discountType": "percentage",
  "description": "20% off summer sale",
  "isActive": true,
  "maxUses": 1000,
  "currentUses": 250,
  "expiryDate": null,
  "createdAt": "2024-11-16T10:00:00Z",
  "updatedAt": "2024-11-16T10:00:00Z"
}
```

---

## 🎨 Customization

### Change Colors
Edit `app/globals.css` and `app/admin/layout.tsx`

### Add More Features
- **User Management**: Add `/admin/users` page
- **Email Alerts**: Send notifications when coupon is about to expire
- **Bulk Operations**: Import/Export coupons
- **Advanced Analytics**: Charts and graphs with Chart.js
- **Role-Based Access**: Different admin levels

### Add More Collections
```typescript
// Example: Add users collection
const USERS_COLLECTION = 'users';

export async function createUser(user: User) {
  const docRef = await addDoc(collection(db, USERS_COLLECTION), user);
  return { success: true, id: docRef.id };
}
```

---

## 📁 File Structure

```
availcoupon/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              ← Sidebar + navigation
│   │   ├── login/page.tsx          ← Auth page
│   │   ├── dashboard/page.tsx      ← Stats & overview
│   │   ├── coupons/
│   │   │   ├── page.tsx            ← List & create
│   │   │   └── [id]/page.tsx       ← Edit coupon
│   │   └── analytics/page.tsx      ← Reports
│   └── ...
├── lib/
│   ├── firebase.ts                 ← Config
│   ├── hooks/
│   │   └── useAuth.ts              ← Auth hook
│   └── services/
│       └── couponService.ts        ← CRUD operations
├── .env.local                      ← Credentials
└── ...
```

---

## ✅ Testing Your Setup

```bash
# 1. Start dev server
npm run dev

# 2. Visit admin login
http://localhost:3000/admin/login

# 3. Login with your admin credentials
admin@example.com / [password]

# 4. Should redirect to dashboard
http://localhost:3000/admin/dashboard

# 5. Create a test coupon
- Click "Create New Coupon"
- Fill in details
- Click "Create Coupon"

# 6. Check Firestore
Firebase Console → Firestore Database
Should see new document in "coupons" collection
```

---

## 🚀 Deployment

### To Vercel (Recommended for Next.js)
```bash
npm install -g vercel
vercel
```

Then add environment variables in Vercel dashboard.

### To Other Platforms
1. `npm run build`
2. Upload `.next` folder and `package.json`
3. Set environment variables on platform
4. Run: `npm run start`

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Cannot find module 'firebase'" | Run `npm install firebase` |
| "Firebase is not initialized" | Check `.env.local` has all 6 variables |
| "Permission denied" | Check Firestore security rules |
| "User not found" | Create user in Firebase Authentication |
| "Build fails" | Delete `node_modules/.next` and run `npm install` |

---

## 📞 Key Files to Remember

- **Firebase Config**: `lib/firebase.ts`
- **Coupon Operations**: `lib/services/couponService.ts`
- **Auth State**: `lib/hooks/useAuth.ts`
- **Credentials**: `.env.local`
- **Admin Layout**: `app/admin/layout.tsx`

---

## 🎉 You're All Set!

Your admin panel is ready to manage coupons. Start with:

1. ✅ Set up Firebase project
2. ✅ Add credentials to `.env.local`
3. ✅ Create admin user
4. ✅ Run `npm run dev`
5. ✅ Login and create first coupon

Happy managing! 🚀

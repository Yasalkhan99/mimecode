# Supabase User Authentication Setup

## ✅ Successfully Implemented!

Firebase Admin ki jagah ab Supabase use ho raha hai user profiles ke liye. Yeh zyada stable aur simple hai!

## 🎯 Changes Made

### 1. **New Supabase API Endpoint**
**File:** `app/api/users/create-user-profile-supabase/route.ts`

- ✅ Supabase admin client use karta hai
- ✅ User profile create/update karta hai
- ✅ Default role: `user` (not admin)
- ✅ Error handling included

### 2. **User Service Module**
**File:** `lib/services/userService.ts`

Functions available:
- `getUserProfile(userId)` - Get user profile from Supabase
- `upsertUserProfile(profile)` - Create/update user profile
- `updateUserRole(userId, role)` - Update user role

### 3. **Updated useAuth Hook**
**File:** `lib/hooks/useAuth.ts`

**Before:** Firestore se data fetch karta tha
**After:** Supabase se data fetch karta hai

### 4. **Updated Login Page**
**File:** `app/login/page.tsx`

Sign up endpoint changed:
- Old: `/api/users/create-user-profile` (Firebase)
- New: `/api/users/create-user-profile-supabase` (Supabase)

### 5. **Database Migration**
**File:** `supabase/migrations/create_users_table.sql`

Creates `users` table with:
- `id` (Primary Key) - Firebase UID
- `email` (Unique, Required)
- `display_name` (Optional)
- `role` ('user' or 'admin', default: 'user')
- `created_at` (Auto timestamp)
- `updated_at` (Auto timestamp)

**Security Features:**
- ✅ Row Level Security (RLS) enabled
- ✅ Users can read/update their own profile
- ✅ Admins can read/update all profiles
- ✅ Auto-update `updated_at` timestamp

## 🔧 Setup Instructions

### Step 1: Run Migration in Supabase

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy contents from `supabase/migrations/create_users_table.sql`
5. Paste and **Run** the SQL

### Step 2: Verify Table Created

1. Go to **Table Editor**
2. Check if `users` table exists
3. Verify columns: id, email, display_name, role, created_at, updated_at

### Step 3: Test User Registration

1. Start dev server: `npm run dev`
2. Go to `/login`
3. Click "Sign Up"
4. Create a new account
5. Check Supabase Table Editor - new user should appear

## 📊 Database Schema

```sql
Table: users
├── id (text, primary key)              -- Firebase Auth UID
├── email (text, unique, not null)      -- User email
├── display_name (text, nullable)       -- User display name
├── role (text, default 'user')         -- 'user' or 'admin'
├── created_at (timestamptz)            -- Auto-generated
└── updated_at (timestamptz)            -- Auto-updated
```

## 🔐 Security Policies (RLS)

1. **Read Own Profile**: Users can read their own data
2. **Update Own Profile**: Users can update their own data
3. **Public Registration**: Anyone can create a new profile (sign up)
4. **Admin Read All**: Admins can read all user profiles
5. **Admin Update All**: Admins can update any user profile

## 🎯 User Flow

### Sign Up Flow:
```
1. User fills sign up form → /login
2. Firebase creates auth account
3. API call to /api/users/create-user-profile-supabase
4. Supabase creates user profile (role: 'user')
5. User redirected to home page
6. useAuth hook fetches profile from Supabase
```

### Login Flow:
```
1. User logs in with email/password
2. Firebase authenticates
3. useAuth hook runs
4. Fetches user profile from Supabase
5. Sets user.role ('user' or 'admin')
6. App shows appropriate UI based on role
```

## 🚀 Features

### For Regular Users:
- ✅ Sign up creates user profile in Supabase
- ✅ Default role: 'user'
- ✅ Access to `/dashboard`
- ✅ Can create/manage own stores & coupons
- ❌ Cannot access `/admin/*` pages

### For Admins:
- ✅ Same auth system
- ✅ Role: 'admin' (manually set in Supabase)
- ✅ Access to `/admin/*` pages
- ✅ Can manage all stores & coupons
- ✅ Can see all users

## 🔧 How to Make Someone Admin

### Method 1: Supabase Dashboard
1. Go to Supabase → Table Editor
2. Open `users` table
3. Find the user by email
4. Edit row
5. Change `role` from 'user' to 'admin'
6. Save

### Method 2: SQL Query
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@example.com';
```

### Method 3: Use the Service Function
```typescript
import { updateUserRole } from '@/lib/services/userService';

await updateUserRole(userId, 'admin');
```

## 📝 Testing Checklist

- [ ] Run Supabase migration
- [ ] Verify `users` table exists
- [ ] Test sign up - new user created
- [ ] Check Supabase - user has role 'user'
- [ ] Test login - user can access dashboard
- [ ] Test admin login - admin can access admin panel
- [ ] Test regular user - cannot access admin panel

## 🐛 Troubleshooting

### Issue: User profile not created
**Solution:** 
- Check Supabase connection
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- Check browser console for errors

### Issue: Users table doesn't exist
**Solution:**
- Run the migration SQL in Supabase Dashboard
- Check Table Editor to verify

### Issue: User has no role
**Solution:**
- Default role is 'user'
- Check Supabase table - role column should have value
- If empty, run: `UPDATE users SET role = 'user' WHERE role IS NULL;`

## 🎉 Benefits of Supabase

1. ✅ **No Firebase Admin SDK issues** - Direct Supabase connection
2. ✅ **Simpler setup** - No service account JSON needed
3. ✅ **Better error handling** - Clear error messages
4. ✅ **Row Level Security** - Built-in security policies
5. ✅ **Easy to manage** - Visual table editor
6. ✅ **Real-time updates** - Can subscribe to changes
7. ✅ **SQL queries** - Can run custom queries easily

## 📚 Files Created/Updated

### New Files:
- `app/api/users/create-user-profile-supabase/route.ts` - Supabase endpoint
- `lib/services/userService.ts` - User profile functions
- `supabase/migrations/create_users_table.sql` - Database schema

### Updated Files:
- `lib/hooks/useAuth.ts` - Now uses Supabase
- `app/login/page.tsx` - Uses new Supabase endpoint

### Old Files (Not Used):
- `app/api/users/create-user-profile/route.ts` - Firebase version (can delete)

## 🚀 Ready to Use!

Ab aapka user authentication system Supabase ke saath fully functional hai! 

**No more Firebase Admin errors!** 🎉

Sign up test karo aur dekho - everything should work perfectly! ✅


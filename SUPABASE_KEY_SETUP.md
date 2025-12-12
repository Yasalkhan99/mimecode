# 🔑 Supabase Key Setup Guide

## ⚠️ Important: Service Role Key Required

Migration script ke liye **Service Role Key** chahiye, **anon key nahi**.

### Difference:

1. **Anon Key** (Public):
   - Public access ke liye
   - Row Level Security (RLS) policies follow karti hai
   - Limited permissions

2. **Service Role Key** (Admin):
   - Full admin access
   - RLS bypass karti hai
   - Migration ke liye zaroori hai

## 📋 Service Role Key Kaise Milegi:

### Step 1: Supabase Dashboard
1. https://supabase.com/dashboard par jayein
2. Apna project select karein: **eluvbskcqxcjedxfamno**

### Step 2: API Settings
1. Left sidebar se **Settings** → **API** click karein
2. **Project API keys** section mein:
   - **`anon` `public`** key - Yeh aapne already di hai (public access)
   - **`service_role` `secret`** key - Yeh chahiye migration ke liye

### Step 3: Service Role Key Copy Karein
1. **`service_role`** key ke saamne **"Reveal"** ya **"Copy"** button click karein
2. ⚠️ **IMPORTANT**: Yeh key secret hai, kabhi bhi publicly share mat karo!
3. Key copy kar lein

### Step 4: .env.local Mein Add Karein

```env
# Supabase Configuration
SUPABASE_URL=https://eluvbskcqxcjedxfamno.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Example:**
```env
SUPABASE_URL=https://eluvbskcqxcjedxfamno.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsdXZic2tjcXhjamVkeGZhbW5vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM1ODQ4MywiZXhwIjoyMDc5OTM0NDgzfQ.xxxxx
```

## 🔒 Security Notes:

1. **Never commit** `.env.local` to git
2. **Never share** service_role key publicly
3. **Only use** service_role key for server-side operations
4. **Use anon key** for client-side operations

## ✅ Verification:

Service role key add karne ke baad, migration script run karein:

```bash
npm run migrate:firestore-to-supabase
```

Agar key sahi hai, to script successfully run hogi. Agar error aaye, to check karein:
- Key properly copied hai (no extra spaces)
- Key `service_role` hai, `anon` nahi
- `.env.local` file root directory mein hai

## 📝 Current Setup:

- ✅ **Supabase URL**: Updated to `https://eluvbskcqxcjedxfamno.supabase.co`
- ⏳ **Service Role Key**: Abhi add karni hai

---

**Next Step**: Supabase Dashboard se service_role key copy karke `.env.local` mein add karein.


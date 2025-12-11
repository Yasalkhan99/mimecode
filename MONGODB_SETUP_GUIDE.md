# MongoDB Atlas Password Setup Guide

## 🔐 MongoDB Password Setup Steps

### Step 1: MongoDB Atlas mein login karein
1. https://www.mongodb.com/cloud/atlas par jayein
2. Apna account se login karein

### Step 2: Database Access mein user check karein
1. Left sidebar se **"Database Access"** click karein
2. Apne user (`yasalkhan90`) ko find karein
3. Agar user nahi hai, to **"Add New Database User"** click karein

### Step 3: Password set/reset karein
**Option A: New User create karein (Recommended)**
1. **"Add New Database User"** click karein
2. **Authentication Method**: "Password" select karein
3. **Username**: `yasalkhan90` (ya koi aur username)
4. **Password**: Strong password generate karein (ya manually enter karein)
5. **Database User Privileges**: "Atlas admin" ya "Read and write to any database" select karein
6. **"Add User"** click karein
7. **Important**: Password copy kar lein (yeh sirf ek baar dikhega!)

**Option B: Existing user ka password reset karein**
1. User ke saamne **"Edit"** (pencil icon) click karein
2. **"Edit Password"** click karein
3. New password enter karein
4. **"Update User"** click karein
5. Password copy kar lein

### Step 4: Network Access setup
1. Left sidebar se **"Network Access"** click karein
2. **"Add IP Address"** click karein
3. **"Allow Access from Anywhere"** select karein (0.0.0.0/0)
   - Ya apna specific IP add karein
4. **"Confirm"** click karein

### Step 5: Connection String copy karein
1. Left sidebar se **"Database"** click karein
2. Apne cluster par **"Connect"** button click karein
3. **"Connect your application"** select karein
4. **Driver**: "Node.js" select karein
5. **Version**: Latest select karein
6. Connection string copy karein:
   ```
   mongodb+srv://yasalkhan90:<password>@cluster0.0pqbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

### Step 6: .env.local mein update karein
1. `.env.local` file open karein
2. `MONGODB_URI` line find karein
3. `<password>` ki jagah apna actual password add karein:
   ```env
   MONGODB_URI=mongodb+srv://yasalkhan90:YOUR_ACTUAL_PASSWORD@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority&appName=Cluster0
   ```
4. File save karein

### Step 7: Test connection
1. Dev server restart karein: `npm run dev`
2. Browser mein open karein: `http://localhost:3000/api/test-mongodb`
3. Agar "MongoDB connected successfully!" dikhe, to sab theek hai! ✅

## ⚠️ Important Notes

1. **Password Security**: 
   - Password ko kabhi bhi git mein commit mat karo
   - `.env.local` file `.gitignore` mein honi chahiye

2. **Special Characters in Password**:
   - Agar password mein special characters hain (like `@`, `#`, `$`, etc.), to unhe URL encode karna padega:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `&` → `%26`
   - Ya MongoDB Atlas mein simple password use karein (letters + numbers)

3. **Database Name**:
   - Connection string mein `mimecode` database name add kiya hai
   - Agar database nahi hai, to automatically create ho jayega

## 🔧 Troubleshooting

### Error: "Authentication failed"
- Password check karein (correct hai ya nahi)
- Username check karein
- Special characters URL encode karein

### Error: "IP not whitelisted"
- Network Access mein IP whitelist karein (0.0.0.0/0 for testing)

### Error: "Connection timeout"
- Internet connection check karein
- MongoDB Atlas cluster running hai ya nahi check karein

## 📝 Quick Reference

**Connection String Format:**
```
mongodb+srv://USERNAME:PASSWORD@cluster0.0pqbi.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

**Your Connection String:**
```
mongodb+srv://yasalkhan90:YOUR_PASSWORD@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority&appName=Cluster0
```

Replace `YOUR_PASSWORD` with your actual MongoDB password!


# MongoDB Password Setup - Google Authentication Fix

## 🔍 Problem
Agar aapne Google se MongoDB account link kiya hai, to password edit option nahi dikhega kyunki Google authentication use ho rahi hai.

## ✅ Solution: New Database User Create Karein (Password-based)

### Step 1: MongoDB Atlas Dashboard
1. https://www.mongodb.com/cloud/atlas par jayein
2. Login karein (Google se)

### Step 2: Database Access
1. Left sidebar se **"Database Access"** click karein
2. Top right corner mein **"+ ADD NEW DATABASE USER"** button click karein

### Step 3: New User Create Karein
1. **Authentication Method**: 
   - **"Password"** select karein (Google nahi!)
   
2. **Username**: 
   - Apna username enter karein (e.g., `yasalkhan90` ya `mimecode_user`)
   
3. **Password**: 
   - **"Autogenerate Secure Password"** click karein (recommended)
   - Ya manually strong password enter karein
   - **⚠️ IMPORTANT**: Password copy kar lein! (Yeh sirf ek baar dikhega)
   
4. **Database User Privileges**:
   - **"Atlas admin"** select karein (full access)
   - Ya **"Read and write to any database"** select karein
   
5. **"Add User"** button click karein

### Step 4: Password Copy Karein
1. Password popup mein dikhega
2. **"Copy"** button click karein
3. Safe jagah save kar lein (temporary)

### Step 5: Network Access Setup
1. Left sidebar se **"Network Access"** click karein
2. **"+ ADD IP ADDRESS"** button click karein
3. **"ALLOW ACCESS FROM ANYWHERE"** select karein
   - Ya **"Add Current IP Address"** select karein
4. **"Confirm"** click karein

### Step 6: Connection String Get Karein
1. Left sidebar se **"Database"** click karein
2. Apne cluster par **"Connect"** button click karein
3. **"Connect your application"** select karein
4. **Driver**: "Node.js" select karein
5. **Version**: Latest select karein
6. Connection string copy karein:
   ```
   mongodb+srv://<username>:<password>@cluster0.0pqbi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   ```

### Step 7: .env.local Update Karein
1. `.env.local` file open karein
2. `MONGODB_URI` line find karein
3. Connection string update karein:
   ```env
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority&appName=Cluster0
   ```
4. `YOUR_USERNAME` ki jagah apna username
5. `YOUR_PASSWORD` ki jagah apna password
6. File save karein

## 📝 Example

**Agar username hai `mimecode_user` aur password hai `MyPass123!@#`:**

```env
MONGODB_URI=mongodb+srv://mimecode_user:MyPass123%21%40%23@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority&appName=Cluster0
```

**Note**: Special characters URL encode karein:
- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`

## 🔧 Alternative: Simple Password Use Karein

Agar special characters se problem ho, to simple password use karein:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Example: `Mimecode2024DB`

## ✅ Test Connection

1. Dev server restart karein:
   ```bash
   npm run dev
   ```

2. Browser mein test karein:
   ```
   http://localhost:3000/api/test-mongodb
   ```

3. Agar "MongoDB connected successfully!" dikhe, to sab theek hai! ✅

## 🆘 Troubleshooting

### Error: "Authentication failed"
- Username aur password check karein
- Special characters URL encode karein
- Ya simple password use karein

### Error: "IP not whitelisted"
- Network Access mein IP whitelist karein (0.0.0.0/0)

### Password nahi dikh raha
- New user create karte waqt password copy kar lein
- Ya "Show Password" option check karein


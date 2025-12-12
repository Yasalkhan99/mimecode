# MongoDB Connection Troubleshooting Guide

## 🔍 Common Errors & Solutions

### Error 1: "Authentication failed" / "bad auth"

**Problem**: Username ya password galat hai, ya special characters properly encode nahi hain.

**Solution**:
1. Password check karein - MongoDB Atlas mein jo password set kiya, wahi use karein
2. Special characters URL encode karein:
   - `!` → `%21`
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `&` → `%26`
   - `%` → `%25`
   - `+` → `%2B`
   - `=` → `%3D`

**Quick Fix**:
```bash
node scripts/encode-mongodb-password.js
```

Ya manually:
```javascript
encodeURIComponent('YourPassword!@#')
```

### Error 2: "IP not whitelisted" / "Network access"

**Problem**: Aapka IP address MongoDB Atlas Network Access mein whitelist nahi hai.

**Solution**:
1. MongoDB Atlas → **Network Access** → **"+ ADD IP ADDRESS"**
2. **"ALLOW ACCESS FROM ANYWHERE"** select karein (0.0.0.0/0)
3. **"Confirm"** click karein
4. 1-2 minutes wait karein (propagation time)

### Error 3: "Connection timeout"

**Problem**: Network issue ya MongoDB cluster down hai.

**Solution**:
1. Internet connection check karein
2. MongoDB Atlas dashboard mein cluster status check karein
3. Cluster running hai ya nahi verify karein

### Error 4: "ENOTFOUND" / "getaddrinfo"

**Problem**: Cluster URL galat hai ya DNS resolve nahi ho raha.

**Solution**:
1. Connection string verify karein:
   ```
   mongodb+srv://USERNAME:PASSWORD@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority
   ```
2. Cluster name check karein (cluster0.0pqbi.mongodb.net)
3. Database name check karein (mimecode)

### Error 5: "MONGODB_URI not found"

**Problem**: Environment variable load nahi ho rahi.

**Solution**:
1. `.env.local` file check karein
2. File root directory mein hai ya nahi verify karein
3. Dev server restart karein: `npm run dev`
4. Variable name check karein: `MONGODB_URI` (exact spelling)

## ✅ Step-by-Step Debugging

### Step 1: Check Connection String Format
```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority&appName=Cluster0
```

### Step 2: Verify Password
- MongoDB Atlas → Database Access → User check karein
- Password copy karein (exact copy)
- Special characters URL encode karein

### Step 3: Check Network Access
- MongoDB Atlas → Network Access
- IP whitelist check karein
- "Allow Access from Anywhere" enable karein

### Step 4: Test Connection
1. Browser: `http://localhost:3000/api/test-mongodb`
2. Console: Check server logs for detailed error
3. Response: Check error message and hint

## 🔧 Quick Fixes

### Fix 1: Simple Password Use Karein
Agar special characters se problem ho, to simple password use karein:
- Letters (a-z, A-Z)
- Numbers (0-9)
- Example: `Mimecode2024DB`

### Fix 2: Connection String Template
```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority
```

Replace:
- `USERNAME` → Your MongoDB username
- `PASSWORD` → Your MongoDB password (URL encoded if needed)
- `mimecode` → Your database name

### Fix 3: Test with MongoDB Compass
1. MongoDB Compass install karein
2. Connection string paste karein
3. Connect karke test karein
4. Agar Compass mein connect ho gaya, to connection string sahi hai

## 📝 Example Connection Strings

### Simple Password (No Encoding Needed)
```env
MONGODB_URI=mongodb+srv://yasalkhan90:Mimecode2024DB@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority
```

### Password with Special Characters (URL Encoded)
```env
# Original Password: MyPass!@#123
# URL Encoded: MyPass%21%40%23%23123
MONGODB_URI=mongodb+srv://yasalkhan90:MyPass%21%40%23%23123@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority
```

## 🆘 Still Not Working?

1. **Check Server Logs**: Console mein exact error dekhein
2. **Test Route**: `/api/test-mongodb` mein detailed error dikhega
3. **MongoDB Atlas Dashboard**: Cluster status check karein
4. **Network**: Internet connection verify karein

## 📞 Need Help?

Agar still issue hai, to yeh information share karein:
1. Exact error message (browser console se)
2. Server logs (terminal se)
3. Connection string format (password mask karke)
4. MongoDB Atlas Network Access status


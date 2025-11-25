# Cloudinary Quick Setup (FREE!)

## Perfect Solution for Students! 🎓

Since you can't upgrade Firebase, use **Cloudinary** - it's **100% FREE** for students!

---

## Step 1: Sign Up (2 minutes)

1. Go to: https://cloudinary.com/users/register/free
2. Sign up with your email
3. Verify email
4. Done! ✅

---

## Step 2: Get Your Credentials

1. After login, you'll see your **Dashboard**
2. You'll see:
   - **Cloud Name** (e.g., `dyh3jmwtd`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (click "Reveal" to see it)

---

## Step 3: Add to .env.local

Open `.env.local` and add these 3 lines:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dyh3jmwtd
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456789
```

---

## Step 4: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Step 5: Test!

Now when you upload:
1. Code tries Firebase Storage first
2. If Firebase fails (bucket doesn't exist), **automatically uses Cloudinary** ✅
3. Works seamlessly!

**Test with Postman:**
- URL: `POST http://localhost:3000/api/coupons/upload`
- Body: Same as before

**Expected Response:**
```json
{
  "success": true,
  "logoUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/coupon_logos/...",
  "storage": "cloudinary"
}
```

---

## Free Tier Includes:

- ✅ **25GB storage** - More than enough!
- ✅ **25GB bandwidth/month** - Plenty for your project
- ✅ **Unlimited transformations** - Resize, crop, optimize
- ✅ **CDN included** - Fast delivery worldwide
- ✅ **No credit card required**

---

## That's It! 🎉

Your uploads will now work automatically with Cloudinary when Firebase Storage isn't available!

**No more bucket errors!** ✅


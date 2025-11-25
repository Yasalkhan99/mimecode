# Cloudinary Setup (FREE for Students!)

## Why Cloudinary?
- ✅ **100% FREE** for students and developers
- ✅ **25GB storage** free tier
- ✅ **25GB bandwidth** per month
- ✅ No credit card required
- ✅ Perfect alternative to Firebase Storage

---

## Step 1: Create Free Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up with your email (student email works!)
3. Verify your email
4. You'll be redirected to your dashboard

---

## Step 2: Get Your Credentials

1. In Cloudinary Dashboard, you'll see:
   - **Cloud Name** dyh3jmwtd
   - **API Key** 256681754852456
   - **API Secret** M2kMkOSvISJkFZUO8V2a-X0gM_U

2. Click **"Reveal"** next to API Secret to see it

---

## Step 3: Add to .env.local

Open your `.env.local` file and add:

```env
# Cloudinary Configuration (FREE alternative to Firebase Storage)
CLOUDINARY_CLOUD_NAME=dyh3jmwtd
CLOUDINARY_API_KEY=256681754852456
CLOUDINARY_API_SECRET=M2kMkOSvISJkFZUO8V2a-X0gM_U
```

**Example:**
```env
CLOUDINARY_CLOUD_NAME=dyh3jmwtd
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

---

## Step 4: Restart Dev Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Step 5: Test

Now when you upload a coupon logo:
1. It will try Firebase Storage first (if configured)
2. If Firebase Storage fails, it automatically uses Cloudinary
3. Both work seamlessly!

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

## Free Tier Limits

- ✅ **25GB storage** - More than enough for logos
- ✅ **25GB bandwidth/month** - Plenty for a student project
- ✅ **Unlimited transformations** - Resize, crop, etc.
- ✅ **No credit card required**

---

## Benefits Over Firebase Storage

1. **No upgrade needed** - Works on free tier
2. **Easy setup** - Just 3 environment variables
3. **Automatic fallback** - Code tries Firebase first, then Cloudinary
4. **Image optimization** - Cloudinary automatically optimizes images
5. **CDN included** - Fast image delivery worldwide

---

## Security Note

⚠️ **Never commit `.env.local` to git!**
- Your API Secret is sensitive
- Keep it private
- Already in `.gitignore` ✅

---

## Need Help?

1. **Cloudinary Dashboard:** https://console.cloudinary.com/
2. **Documentation:** https://cloudinary.com/documentation
3. **Support:** Free tier includes community support

---

## Quick Setup Checklist

- [ ] Created Cloudinary account
- [ ] Got Cloud Name, API Key, and API Secret
- [ ] Added to `.env.local`
- [ ] Restarted dev server
- [ ] Tested upload - Success! ✅

---

**That's it! You're all set with FREE image storage! 🎉**


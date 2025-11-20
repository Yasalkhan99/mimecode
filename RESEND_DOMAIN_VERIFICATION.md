# Resend Domain Verification Guide

## Problem

Resend free tier mein **sirf verified email** (`yasalkhan90@gmail.com`) par hi emails send ho sakti hain. Agar aap kisi aur email par send karna chahte hain, to **domain verify karna hoga**.

## Solution: Domain Verification

### Step 1: Resend Dashboard mein Domain Add karein

1. https://resend.com/login par login karein
2. **Domains** section mein jayein
3. **Add Domain** button click karein
4. Apna domain enter karein (e.g., `availcouponcode.com`)
5. Click **Add**

### Step 2: DNS Records Add karein

Resend aapko **3 DNS records** dega:

1. **SPF Record** (TXT)
2. **DKIM Record** (TXT) 
3. **DMARC Record** (TXT) - Optional but recommended

#### DNS Records kahan add karein?

1. Apne domain provider par jayein (GoDaddy, Namecheap, Cloudflare, etc.)
2. DNS Management section mein jayein
3. Records add karein jo Resend ne diye hain

**Example (Cloudflare):**
- Type: `TXT`
- Name: `@` ya domain name
- Content: Resend ka diya hua value
- TTL: `Auto` ya `3600`

### Step 3: Verification Wait karein

1. DNS records add karne ke baad, Resend dashboard mein **Verify** button click karein
2. Usually **5-10 minutes** lagte hain
3. Status **"Verified"** ho jayega jab ready ho

### Step 4: .env.local Update karein

Domain verify hone ke baad, `.env.local` mein yeh add karein:

```env
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=AvailCoupon <newsletter@availcouponcode.com>
```

**Important:** `newsletter@availcouponcode.com` ko apne verified domain se replace karein.

### Step 5: Code Already Updated

Code already updated hai - ab automatically verified domain use karega agar `RESEND_FROM_EMAIL` set hai.

## Current Behavior

### Without Domain Verification:
- ✅ Emails **yasalkhan90@gmail.com** par send hongi (verified email)
- ❌ Kisi aur email par send nahi hongi (Resend limitation)

### With Domain Verification:
- ✅ Emails **kisi bhi email** par send hongi
- ✅ Admin Panel se set ki hui email par directly send hongi

## Quick Test

1. Domain verify karein
2. `.env.local` update karein
3. Server restart: `npm run dev`
4. Newsletter form se test email send karein
5. Admin Panel mein set ki hui email check karein

## Troubleshooting

### Domain verify nahi ho raha?

1. **DNS records check karein:**
   - Records correctly add hue hain?
   - TTL expire ho gaya hai?
   - Typo to nahi hai?

2. **Wait karein:**
   - DNS propagation mein time lagta hai
   - 24 hours tak wait karein agar issue rahe

3. **Resend Support:**
   - Resend dashboard → Support
   - Ya email: support@resend.com

### Still not working?

- Check Resend dashboard → Logs
- Verify API key is correct
- Make sure `RESEND_FROM_EMAIL` uses verified domain

## Alternative: Temporary Workaround

Agar abhi domain verify nahi kar sakte, to:
- Admin Panel mein email **yasalkhan90@gmail.com** rakhein
- Emails isi par jayengi
- Baad mein domain verify karke change kar sakte hain

## That's It!

Domain verify karne ke baad, kisi bhi email par emails send ho sakti hain! 🚀


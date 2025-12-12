# 🚀 Takeads API Integration - Complete Implementation

## ✅ What Was Implemented

Complete Takeads API integration for importing merchants and coupons into your Supabase database.

### 📁 Files Created/Updated

1. **`lib/services/takeadsService.ts`** - Takeads API service
   - `fetchTakeadsMerchants()` - Fetch merchants from Takeads API
   - `fetchTakeadsCoupons()` - Fetch coupons from Takeads API

2. **`app/api/takeads/sync-merchants/route.ts`** - Merchants sync API endpoint
   - Fetches merchants from Takeads
   - Maps to Supabase stores format
   - Upserts to `stores` table

3. **`app/api/takeads/sync-coupons/route.ts`** - Coupons sync API endpoint
   - Fetches coupons from Takeads
   - Maps to Supabase coupons format
   - Links coupons to stores via merchantId
   - Upserts to `coupons` table

4. **`app/admin/stores/page.tsx`** - Updated with Takeads import UI
   - Import merchants section with API key input
   - Sync status messages
   - Auto-refresh after import

5. **`app/admin/coupons/page.tsx`** - Updated with Takeads import UI
   - Import coupons section with API key input
   - Sync status messages
   - Auto-refresh after import

6. **`scripts/add-takeads-columns.sql`** - Optional SQL migration
   - Adds additional columns for Takeads-specific data
   - Run only if you want to store extra Takeads fields

## 🎯 How to Use

### Step 1: Get Your Takeads API Key

1. Visit [Takeads Developers](https://developers.takeads.com)
2. Get your Public Key (Bearer token)
3. Copy the API key

### Step 2: Import Merchants (Stores)

1. Go to **Admin Panel** → **Stores** (`/admin/stores`)
2. Scroll to **"Import Merchants from Takeads"** section
3. Enter your Takeads API key
4. Click **"Import Merchants from Takeads"**
5. Wait for sync to complete
6. Stores will appear in your stores table

### Step 3: Import Coupons

1. Go to **Admin Panel** → **Coupons** (`/admin/coupons`)
2. Scroll to **"Import Coupons from Takeads"** section
3. Enter your Takeads API key
4. Click **"Import Coupons from Takeads"**
5. Wait for sync to complete
6. Coupons will appear in your coupons table

## 📊 Data Mapping

### Merchants → Stores

| Takeads Field | Supabase Column | Notes |
|--------------|----------------|-------|
| `merchantId` | `Store Id`, `Merchant Id` | Primary identifier |
| `name` | `Store Name` | Store name |
| `description` | `Store Description`, `Store Summary` | Description |
| `imageUri` | `Store Logo` | Logo URL |
| `defaultDomain` | `Store Display Url` | Website URL |
| `trackingLink` | `Tracking Url` | Affiliate link |
| `categoryId[0]` | `category_id` | First category |
| `isActive` | `Active` | Active status |
| `currencyCode` | `currency_code` | Optional |
| `countryCodes` | `country_codes` | Optional array |
| `domains` | `domains` | Optional array |
| `averageCommission` | `average_commission` | Optional |
| `paymentModels` | `payment_models` | Optional array |
| `deeplinkAllowed` | `deeplink_allowed` | Optional |

### Coupons → Coupons

| Takeads Field | Supabase Column | Notes |
|--------------|----------------|-------|
| `couponId` | `Coupon Id` | Primary identifier |
| `name` | `Store Name`, `Coupon Title` | Coupon name |
| `code` | `Coupon Code` | Coupon code |
| `description` | `Coupon Desc` | Description |
| `trackingLink` | `Coupon Deep Link` | Affiliate link |
| `imageUri` | `logo_url` | Logo URL |
| `merchantId` | `Store  Id`, `store_ids` | Linked to store |
| `isActive` | `is_active` | Active status |
| `endDate` | `Coupon Expiry`, `end_date` | Expiry date |
| `categoryIds[0]` | `category_id` | First category |
| `languageCodes` | `language_codes` | Optional array |
| `countryCodes` | `country_codes` | Optional array |
| `startDate` | `start_date` | Optional |
| Discount extracted from name/description | `discount`, `discount_type` | Auto-parsed |

## 🔧 Optional: Add Additional Columns

If you want to store additional Takeads-specific fields, run the SQL migration:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `scripts/add-takeads-columns.sql`
3. Copy and paste the SQL
4. Run the migration

This adds optional columns like:
- `currency_code`, `country_codes`, `domains` (stores)
- `language_codes`, `country_codes`, `start_date`, `end_date` (coupons)

## ⚙️ Features

### ✅ Automatic Features

- **Pagination Handling** - Automatically fetches all pages
- **Duplicate Prevention** - Uses upsert to update existing records
- **Store Linking** - Automatically links coupons to stores via merchantId
- **Discount Parsing** - Extracts discount % or fixed amount from coupon names
- **Slug Generation** - Auto-generates slugs for stores
- **Error Handling** - Proper error messages and logging

### 📝 Sync Options

Both sync endpoints support:
- `limit` - Number of items per page (default: 100, max: 500)
- `isActive` - Filter by active status (default: true)
- Automatic pagination - Fetches all available pages

## 🐛 Troubleshooting

### "API key is required"
- Make sure you entered your Takeads API key
- Check that the key is correct (no extra spaces)

### "Supabase admin client not initialized"
- Check your `.env.local` file
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

### "Takeads API error"
- Verify your API key is valid
- Check Takeads API status
- Ensure you have proper API access

### Coupons not linking to stores
- Make sure you imported merchants first
- Check that `merchantId` matches between merchants and coupons
- Verify `Merchant Id` column exists in stores table

## 📚 API Endpoints

### Sync Merchants
```
POST /api/takeads/sync-merchants
Body: {
  "apiKey": "your_api_key",
  "limit": 500,
  "isActive": true
}
```

### Sync Coupons
```
POST /api/takeads/sync-coupons
Body: {
  "apiKey": "your_api_key",
  "limit": 500,
  "isActive": true
}
```

## 🎉 Success!

Your Takeads integration is now complete! You can:
- ✅ Import merchants from Takeads to your stores table
- ✅ Import coupons from Takeads to your coupons table
- ✅ View all imported data in admin panels
- ✅ All data stored in Supabase with proper relationships

---

**Need Help?** Check the console logs for detailed sync progress and any errors.


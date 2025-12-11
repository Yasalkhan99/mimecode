# 📊 CSV to Supabase Column Mapping Guide

Yeh guide aapko CSV columns ko Supabase table format mein convert karne mein help karega.

## 🎯 Stores Table Mapping

### CSV Columns → Supabase Columns

| CSV Column | Supabase Column | Notes |
|-----------|-----------------|-------|
| **Store Name** | `name` | ✅ Direct mapping |
| **Slug** | `slug` | ✅ Direct mapping |
| **Store Description** or **Store Summary** | `description` | Use Store Description first, if empty use Store Summary |
| **Store Logo** | `logo_url` | ✅ Direct mapping |
| **Network Id** | `network_id` | ✅ Direct mapping |
| **Store Display Url** | `website_url` | ✅ Direct mapping |
| **Tracking Url** | `url` | If needed, otherwise can be ignored |
| **Is Featured** | `is_trending` | Convert: "1"/"Yes" → true, "0"/"No" → false |
| **Store Priority** | `layout_position` | ✅ Direct mapping (number) |
| **Cate Ids** | `category_id` | Take first category ID if multiple |
| **Parent Category Id** | `category_id` | Alternative to Cate Ids |
| **Comment** | `about_text` | Store comments/notes |
| **Address** | `headquarters` | Store address/headquarters |
| **Phone**, **Email** | `contact_info` | Combine: "Phone: X, Email: Y" |
| **Created Date** | `created_at` | Convert to timestamp format |
| **Modify Date** | `updated_at` | Convert to timestamp format |
| **Status** | - | Can be ignored (use `is_active` instead) |
| **Active** | `is_active` | Convert boolean |

### Fields NOT in CSV (Optional)

- `sub_store_name` - Leave empty/null
- `voucher_text` - Leave empty/null  
- `features` - Leave empty/null (array)
- `shipping_info` - Leave empty/null
- `return_policy` - Leave empty/null
- `trust_score` - Leave empty/null
- `established_year` - Leave empty/null

## ✅ Solution: CSV Transformation Script

Script create karein jo CSV ko transform kare:

```bash
node scripts/transform-stores-csv.js input.csv output.csv
```

## 📝 Manual Method (Excel/Google Sheets)

1. **Excel/Google Sheets** mein CSV open karein
2. Column headers rename karein (see mapping above)
3. Unnecessary columns delete karein
4. Data format karein (dates, booleans, etc.)
5. **Save as CSV**
6. Supabase mein import karein

## 🚀 Quick Fix Steps

### Step 1: Rename Columns

Excel/Google Sheets mein:
1. First row (headers) ko rename karein:
   - `Store Name` → `name`
   - `Store Description` → `description`
   - `Store Logo` → `logo_url`
   - `Network Id` → `network_id`
   - `Store Display Url` → `website_url`
   - `Slug` → `slug`

### Step 2: Remove Unused Columns

Delete these columns (agar nahi chahiye):
- Store Display Url
- Store Summary
- Tracking Url
- Cate Ids
- Comment
- Address
- Phone
- Email
- Fb Url
- Twitter Url
- Youtube
- Gplus
- Is Featured
- Store Priority
- Status
- Created Date
- Created By
- Modify Date
- Modify By
- Is Logo
- Parent Category Id
- Parent Category Name
- Store Banner
- Is Banner
- Total Views
- Total Coupons
- Active
- Inactive
- Last Updated
- Is API
- Store Id

### Step 3: Keep Only Required Columns

**Minimum Required:**
- `name` (Store Name)
- `description` (Store Description)

**Optional but Recommended:**
- `slug`
- `logo_url`
- `network_id`
- `website_url`
- `category_id`

### Step 4: Format Data

1. **Boolean fields**: "1"/"Yes" → `true`, "0"/"No" → `false`
2. **Dates**: Convert to ISO format (YYYY-MM-DD)
3. **Numbers**: Ensure they're numeric

### Step 5: Save & Import

1. **Save as CSV**
2. Supabase Dashboard → Table Editor → Import
3. Upload transformed CSV

## 💡 Recommended Minimal CSV

Keep only these columns for import:

```
name, description, slug, logo_url, network_id, website_url, category_id, is_trending, layout_position
```

Ya even simpler:
```
name, description
```

Baaki fields baad mein update kar sakte hain.


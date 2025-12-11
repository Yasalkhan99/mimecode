# 📝 Simple CSV Import Guide - Supabase

Aapke CSV mein jo columns hain, woh Supabase table format se match nahi kar rahe. Yeh simple solution hai.

## ✅ Quick Solution (Excel/Google Sheets)

### Step 1: CSV Open Karein

Excel ya Google Sheets mein apna CSV file open karein.

### Step 2: Header Row Edit Karein

First row (header row) mein column names change karein:

**Old Names** → **New Names**

```
Store Name          → name
Store Description   → description  
Store Logo          → logo_url
Network Id          → network_id
Slug                → slug
Store Display Url   → website_url
```

### Step 3: Unnecessary Columns Delete Karein

Agar Supabase mein import karna hai, to yeh columns **delete kar do**:

- Store Display Url ❌
- Store Summary ❌
- Tracking Url ❌
- Cate Ids ❌
- Comment ❌
- Address ❌
- Phone ❌
- Email ❌
- Fb Url ❌
- Twitter Url ❌
- Youtube ❌
- Gplus ❌
- Is Featured ❌
- Store Priority ❌
- Status ❌
- Created Date ❌
- Created By ❌
- Modify Date ❌
- Modify By ❌
- Is Logo ❌
- Parent Category Id ❌
- Parent Category Name ❌
- Store Banner ❌
- Is Banner ❌
- Total Views ❌
- Total Coupons ❌
- Active ❌
- Inactive ❌
- Last Updated ❌
- Is API ❌
- Store Id ❌

### Step 4: Keep Only Required Columns

**Minimum Required Columns:**

| Column Name | Description |
|------------|-------------|
| `name` | Store Name |
| `description` | Store Description |

**Optional Columns (Agar chahiye):**

| Column Name | Description |
|------------|-------------|
| `slug` | URL-friendly slug |
| `logo_url` | Logo URL |
| `network_id` | Network ID |
| `website_url` | Website URL |
| `category_id` | Category ID |
| `is_trending` | Trending (true/false) |
| `layout_position` | Position number |

### Step 5: Data Clean Karein

1. Empty rows delete karein
2. Required fields check karein (`name`, `description` must have values)
3. **Save as CSV**

### Step 6: Supabase Import

1. **Supabase Dashboard** → https://supabase.com/dashboard/project/eluvbskcqxcjedxfamno
2. **Table Editor** → `stores` table select karein
3. **"..."** menu → **"Import data"**
4. CSV file upload karein
5. Column mapping verify karein
6. **Import** click karein

## 📋 Example: Minimal CSV Format

Aapke CSV ko is format mein convert karein:

```csv
name,description,slug,logo_url,network_id,website_url
"Nike","Sports store","nike","https://logo.url","123","https://nike.com"
"Amazon","Online marketplace","amazon","https://logo.url","456","https://amazon.com"
```

## 🎯 Alternative: Use Script

Agar manually karna mushkil hai, to transformation script use karein:

```bash
npx tsx scripts/transform-stores-csv.ts your-file.csv output.csv
```

Phir `output.csv` ko Supabase mein import karein.

## 💡 Tips

1. **Start Simple**: Pehle sirf `name` aur `description` columns rakhein
2. **Test Import**: 1-2 rows se test karein pehle
3. **Add Columns Gradually**: Baad mein optional columns add karein
4. **Data Validation**: Import se pehle data check karein

## ❓ Still Having Issues?

Agar phir bhi problem aaye, to:
1. CSV file ka sample dikhayein
2. Error message share karein
3. Kaunse columns import karna chahte hain batayein

---

**Bottom Line**: CSV headers ko Supabase column names mein change karo, unnecessary columns delete karo, phir import karo! ✅


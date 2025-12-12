# 🏪 Store Auto-Categorization Guide

Yeh guide aapko batayegi kaise automatically apne stores ko categories mein assign kar sakte hain.

## 📋 Features

✨ **Intelligent Categorization**: Script automatically store names aur descriptions ko analyze karke best matching category assign karta hai

📊 **Comprehensive Categories**: 13+ categories supported:
- Fashion & Clothing
- Electronics & Tech
- Home & Garden
- Beauty & Health
- Sports & Outdoors
- Food & Grocery
- Books & Media
- Toys & Kids
- Automotive
- Travel & Hotels
- Jewelry & Watches
- Pet Supplies
- Office & Stationery

🔍 **Smart Matching**: 500+ keywords use karke accurate categorization

## 🚀 Setup Steps

### Step 1: Supabase Column Check

Pehle check karein ki `stores-mimecode` table mein `category_id` column hai ya nahi.

**Option A: Supabase Dashboard se check karein**
1. Supabase Dashboard open karein
2. Table Editor mein jayein
3. `stores-mimecode` table open karein
4. Columns list mein `category_id` dhundein

**Option B: SQL Editor se check karein**
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'stores-mimecode' 
AND column_name = 'category_id';
```

### Step 2: Add Column (Agar Nahi Hai)

Agar `category_id` column nahi hai, toh yeh SQL script run karein:

1. Supabase Dashboard → SQL Editor open karein
2. `scripts/add-category-column-to-stores.sql` file ka content copy karein
3. SQL Editor mein paste karein
4. "Run" button click karein

Yeh script automatically:
- ✅ Column add karega (agar nahi hai)
- ✅ Index create karega (for faster queries)
- ✅ Result dikhayega

### Step 3: Run Auto-Categorization Script

Ab apne terminal mein yeh command run karein:

```bash
npm run categorize:stores
```

## 📊 Script Output Example

```
🚀 Starting auto-categorization of stores...

📂 Fetching categories...
✅ Found 13 categories:
   - Fashion & Clothing (ID: abc123)
   - Electronics & Tech (ID: def456)
   - Home & Garden (ID: ghi789)
   ...

🏪 Fetching stores...
✅ Found 150 stores

🔍 Analyzing stores...

✅ "Nike Store" → Fashion & Clothing
✅ "Best Buy" → Electronics & Tech
✅ "IKEA" → Home & Garden
⏭️  "Target" - Already categorized
❌ "XYZ Store" - No matching category found

📊 Summary:
   - Already categorized: 20
   - Successfully categorized: 120
   - Could not categorize: 10
   - Total stores: 150

💾 Updating 120 stores in database...

✅ Updated "Nike Store" → Fashion & Clothing
✅ Updated "Best Buy" → Electronics & Tech
...

✨ Update Summary:
   - Successfully updated: 120
   - Failed: 0

🎉 Auto-categorization complete!
```

## 🎯 How It Works

Script yeh steps follow karta hai:

1. **Fetch Categories**: Supabase se sabhi categories fetch karta hai
2. **Fetch Stores**: Sabhi stores fetch karta hai jo categorize nahi hue
3. **Analyze**: Har store ka naam aur description analyze karta hai
4. **Match**: Keywords use karke best matching category find karta hai
5. **Update**: Database mein category assignments update karta hai

### Matching Algorithm

Script intelligent matching use karta hai:
- Store name mein keyword match = **3 points** 
- Description mein keyword match = **1 point**
- Highest score wala category select hota hai

## 🔧 Customization

Agar aap keywords customize karna chahte hain:

1. `scripts/auto-categorize-stores.ts` file open karein
2. `categoryKeywords` object mein apne keywords add karein
3. Script phir se run karein

Example:
```typescript
const categoryKeywords: Record<string, string[]> = {
  'Fashion & Clothing': [
    'fashion', 'clothing', 'apparel',
    'your-custom-keyword-here',  // Add your keywords
    // ...
  ],
  // ...
};
```

## 🔄 Re-categorization

Agar aap already categorized stores ko re-categorize karna chahte hain:

Script mein yeh line comment out karein:
```typescript
// Comment out these lines in auto-categorize-stores.ts
if (store.category_id) {
  alreadyCategorizedCount++;
  console.log(`⏭️  "${store.name}" - Already categorized`);
  continue;  // <- Remove or comment this
}
```

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"
- `.env.local` file check karein
- `NEXT_PUBLIC_SUPABASE_URL` aur `SUPABASE_SERVICE_ROLE_KEY` set hain ya nahi

### Error: "Column category_id does not exist"
- Step 2 repeat karein aur SQL script run karein

### Error: "No categories found"
- Check karein ki `categories-mimecode` table mein categories hain
- Admin panel se categories create karein

### Store categorize nahi ho raha
- Store ka naam aur description check karein
- Custom keywords add karein (Customization section dekhein)
- Manually admin panel se category assign karein

## 📝 Manual Categorization

Agar kuch stores automatically categorize nahi hue, toh manually assign kar sakte hain:

1. Admin panel open karein: `/admin/stores`
2. Store edit karein
3. Category dropdown se select karein
4. Save karein

## 🎉 Benefits

✅ **Time-Saving**: Manually assign karne ki jagah automatic
✅ **Accurate**: 500+ keywords use karke precise matching
✅ **Scalable**: Thousands of stores ko minutes mein categorize kar sakte hain
✅ **Safe**: Already categorized stores ko skip karta hai
✅ **Detailed Logs**: Har action ka detailed log milta hai

## 🤝 Support

Agar koi issue hai ya help chahiye:
1. Script output carefully padhein
2. Error messages note karein
3. Troubleshooting section check karein

---

**Happy Categorizing! 🎊**


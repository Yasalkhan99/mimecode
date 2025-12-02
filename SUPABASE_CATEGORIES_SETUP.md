# 🗄️ Supabase Categories Setup Guide (Production Ready)

Complete Supabase-based category system for stores - No MongoDB/Firebase!

## ✅ What's Changed

- ✨ **Categories** → Supabase (was MongoDB/Firebase)
- ✨ **Stores** → Supabase (already there)
- ✨ **Everything in one place** - Clean & Professional
- ✨ **No API dependencies** - Scripts work directly with Supabase

---

## 📋 Setup Steps (Do Once)

### Step 1: Create Categories Table in Supabase

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `scripts/create-categories-table-supabase.sql`
3. Paste and click **Run**

This will:
- ✅ Create `categories` table with proper structure
- ✅ Add 13 default categories (Fashion, Electronics, etc.)
- ✅ Set up indexes for performance
- ✅ Add foreign key constraints

### Step 2: Add category_id Column to Stores Table

1. Still in Supabase SQL Editor
2. Copy content from `scripts/add-category-id-to-stores.sql`
3. Paste and click **Run**

This will:
- ✅ Add `category_id` column to stores table
- ✅ Create foreign key reference to categories
- ✅ Add index for faster queries
- ✅ Works with both `stores` and `stores-mimecode` tables

---

## 🚀 Running Auto-Categorization

### One-Time Run (Recommended)

Simply run:

```bash
npm run categorize:stores
```

That's it! No dev server needed. Script runs directly against Supabase.

### What It Does

1. 📂 Fetches all categories from Supabase
2. 🏪 Fetches all uncategorized stores
3. 🤖 Uses AI matching with 500+ keywords
4. 💾 Updates stores with appropriate categories
5. 📊 Shows detailed progress and summary

### Output Example

```
🚀 Starting auto-categorization of stores...

📂 Fetching categories from Supabase...
✅ Found 13 categories:
   - Fashion & Clothing (ID: abc-123)
   - Electronics & Tech (ID: def-456)
   ...

🏪 Fetching stores from Supabase...
✅ Found 150 stores in table 'stores-mimecode'

🔍 Analyzing stores...

✅ "Nike Store" → Fashion & Clothing
✅ "Best Buy" → Electronics & Tech
✅ "IKEA" → Home & Garden
⏭️  "Target" - Already categorized
❌ "XYZ Corp" - No matching category found

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

---

## 📁 Table Structures

### Categories Table

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    background_color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Stores Table (Updated)

```sql
ALTER TABLE stores
ADD COLUMN category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
```

---

## 🎯 Default Categories

The system includes 13 comprehensive categories:

1. **Fashion & Clothing** - Apparel, shoes, accessories
2. **Electronics & Tech** - Gadgets, computers, phones
3. **Home & Garden** - Furniture, decor, outdoor
4. **Beauty & Health** - Cosmetics, wellness, fitness
5. **Sports & Outdoors** - Athletic gear, camping
6. **Food & Grocery** - Restaurants, supermarkets
7. **Books & Media** - Books, movies, music
8. **Toys & Kids** - Children's products, games
9. **Automotive** - Car parts, accessories
10. **Travel & Hotels** - Airlines, accommodations
11. **Jewelry & Watches** - Luxury accessories
12. **Pet Supplies** - Pet food, accessories
13. **Office & Stationery** - Office supplies, paper

---

## 🔧 Category Matching Algorithm

The script uses intelligent pattern matching:

- **Store name match** = 3 points (highest weight)
- **Description match** = 1 point
- **Highest score wins** the category assignment

Example keywords:
- Fashion: "clothing", "shoes", "nike", "zara"
- Electronics: "laptop", "phone", "apple", "samsung"
- Home: "furniture", "ikea", "home depot"

See `scripts/auto-categorize-stores.ts` for full keyword list (500+ keywords).

---

## 🎨 Frontend Integration

Categories automatically appear in:

1. **Navbar Dropdown** - Hover on "Stores" to see categories
2. **Store Filters** - Filter stores by category
3. **Category Pages** - Browse stores by category

No code changes needed - already integrated!

---

## 🔄 Re-categorization

Want to recategorize all stores?

1. Edit `scripts/auto-categorize-stores.ts`
2. Comment out lines that skip already-categorized stores:

```typescript
// Comment out these lines:
if (store.category_id) {
  alreadyCategorizedCount++;
  console.log(`⏭️  "${storeName}" - Already categorized`);
  continue;  // <-- Remove this
}
```

3. Run: `npm run categorize:stores`

---

## 🐛 Troubleshooting

### Error: "Missing Supabase credentials"

**Fix:** Check `.env.local` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

### Error: "Table categories does not exist"

**Fix:** Run Step 1 (create categories table SQL)

### Error: "Column category_id does not exist"

**Fix:** Run Step 2 (add category_id column SQL)

### Store Not Categorizing

**Reasons:**
- Store name too generic
- No matching keywords
- Description missing

**Fix:** Add custom keywords or manually assign via admin panel

---

## 📊 Performance

- ✅ Direct Supabase queries (fast!)
- ✅ Batch processing (handles 1000+ stores)
- ✅ Indexed queries (sub-second lookups)
- ✅ No API overhead

---

## 🎉 Benefits

✅ **Single Database** - Everything in Supabase  
✅ **Fast Performance** - Direct queries, no middleware  
✅ **Scalable** - Handles thousands of stores  
✅ **Maintainable** - Clean code, clear structure  
✅ **Production Ready** - Proper foreign keys, indexes  

---

## 📝 Files Modified

### API Routes (Now using Supabase):
- `app/api/categories/get/route.ts`
- `app/api/categories/create/route.ts`
- `app/api/categories/update/route.ts`
- `app/api/categories/delete/route.ts`

### Scripts:
- `scripts/create-categories-table-supabase.sql` (NEW)
- `scripts/add-category-id-to-stores.sql` (NEW)
- `scripts/auto-categorize-stores.ts` (UPDATED)

### No Changes Needed:
- Frontend components (already integrated)
- Navbar (already shows categories)
- Store pages (already filter by category)

---

**Yeh hai aapka complete, production-ready solution! 🎊**


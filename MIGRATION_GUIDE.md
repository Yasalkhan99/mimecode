# 🔄 Firestore to Supabase Migration Guide

Yeh guide aapko Firestore se Supabase mein data migrate karne mein help karega.

## ✅ Prerequisites

1. **Supabase MCP Connected**: Aapka Supabase MCP already connected hai
2. **Environment Variables**: `.env.local` mein yeh variables honi chahiye:
   ```env
   # Firebase (already configured)
   FIREBASE_ADMIN_SA='...'
   # OR
   FIREBASE_SERVICE_ACCOUNT_PATH=./path/to/service-account.json
   
   # Supabase (required)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 📋 Migration Steps

### Step 1: Verify Supabase Tables Created

Sab tables already create ho chuki hain:
- ✅ stores
- ✅ categories
- ✅ coupons
- ✅ banners
- ✅ news
- ✅ faqs
- ✅ store_faqs
- ✅ regions
- ✅ logos
- ✅ email_settings
- ✅ newsletter_subscriptions
- ✅ contact_submissions

### Step 2: Run Migration Script

```bash
npm run migrate:firestore-to-supabase
```

Yeh script:
1. Firestore se sab collections read karega
2. Data ko Supabase format mein convert karega
3. Supabase tables mein insert karega
4. Progress aur summary dikhayega

### Step 3: Verify Migration

Migration complete hone ke baad, Supabase dashboard mein check karein:
1. Supabase Dashboard → Table Editor
2. Har table mein data verify karein
3. Row counts check karein

## 📊 Data Mapping

### Firestore → Supabase Field Mapping

| Firestore Field | Supabase Field | Notes |
|----------------|----------------|-------|
| `createdAt` | `created_at` | Timestamp converted to TIMESTAMPTZ |
| `updatedAt` | `updated_at` | Timestamp converted to TIMESTAMPTZ |
| `subStoreName` | `sub_store_name` | camelCase → snake_case |
| `logoUrl` | `logo_url` | camelCase → snake_case |
| `isTrending` | `is_trending` | camelCase → snake_case |
| `layoutPosition` | `layout_position` | camelCase → snake_case |
| `categoryId` | `category_id` | camelCase → snake_case |
| `storeIds` | `store_ids` | Array preserved |
| `features` | `features` | Array preserved |

### Collection Mapping

| Firestore Collection | Supabase Table |
|---------------------|----------------|
| `stores-mimecode` | `stores` |
| `categories-mimecode` | `categories` |
| `coupons-mimecode` | `coupons` |
| `banners-mimecode` | `banners` |
| `news-mimecode` | `news` |
| `faqs-mimecode` | `faqs` |
| `storeFaqs-mimecode` | `store_faqs` |
| `regions-mimecode` | `regions` |
| `logos-mimecode` | `logos` |
| `emailSettings-mimecode` | `email_settings` |
| `newsletterSubscriptions-mimecode` | `newsletter_subscriptions` |
| `contactSubmissions-mimecode` | `contact_submissions` |

## 🔍 Troubleshooting

### Error: "Missing Supabase credentials"
- `.env.local` mein `SUPABASE_URL` aur `SUPABASE_SERVICE_ROLE_KEY` check karein
- Supabase Dashboard → Settings → API → Service Role Key copy karein

### Error: "Firebase Admin SDK not initialized"
- `.env.local` mein `FIREBASE_ADMIN_SA` ya `FIREBASE_SERVICE_ACCOUNT_PATH` check karein
- Firebase service account file sahi path par hai ya nahi verify karein

### Error: "Duplicate key violation"
- Agar data already migrate ho chuka hai, to pehle Supabase tables clean karein:
  ```sql
  TRUNCATE TABLE stores, categories, coupons, banners, news, faqs, store_faqs, regions, logos, email_settings, newsletter_subscriptions, contact_submissions CASCADE;
  ```

### Data Type Mismatch
- Agar koi field type mismatch ho, to migration script mein field conversion check karein
- Supabase table schema verify karein

## 📝 Post-Migration Steps

1. **Update Application Code**: 
   - Firestore queries ko Supabase queries se replace karein
   - Service files update karein (`lib/services/*.ts`)

2. **Test Application**:
   - Sab features test karein
   - Data integrity verify karein

3. **Backup**:
   - Firestore data ka backup lein (agar zarurat ho)
   - Supabase data ka backup lein

## 🎯 Next Steps

Migration complete hone ke baad:

1. ✅ Supabase tables verify karein
2. ✅ Application code update karein (Firestore → Supabase)
3. ✅ Test karein ke sab kuch sahi kaam kar raha hai
4. ✅ Production deploy karein

## 📞 Support

Agar migration mein koi problem aaye, to:
1. Error message check karein
2. Supabase logs check karein
3. Firestore data verify karein

---

**Note**: Yeh migration script data ko copy karta hai, original Firestore data delete nahi hota. Aap manually Firestore data delete kar sakte hain jab aap sure ho jayein ke Supabase migration successful hai.


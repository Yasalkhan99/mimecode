/**
 * Migration Script: Firestore to Supabase
 * 
 * This script migrates all data from Firestore collections to Supabase tables.
 * 
 * Usage:
 * 1. Make sure you have .env.local configured with Firebase and Supabase credentials
 * 2. Run: npx tsx scripts/migrate-firestore-to-supabase.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load .env.local file
const envPath = resolve(process.cwd(), '.env.local');
if (!existsSync(envPath)) {
  console.error('❌ .env.local file not found!');
  console.error(`   Expected at: ${envPath}`);
  process.exit(1);
}

const dotenvResult = config({ path: envPath });

if (dotenvResult.error) {
  console.error('❌ Error loading .env.local:', dotenvResult.error);
  process.exit(1);
}

console.log('✅ Loaded .env.local file');

// Initialize Firebase Admin BEFORE importing (so env vars are available)
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK manually with loaded environment variables
if (!admin.apps.length) {
  // Try service account file path first
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.startsWith('.')
        ? resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      const fileContent = readFileSync(filePath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin SDK initialized from service account file');
    } catch (error) {
      console.error('❌ Failed to initialize from service account file:', error);
    }
  }
  
  // Try environment variable
  if (!admin.apps.length && process.env.FIREBASE_ADMIN_SA) {
    try {
      // Remove surrounding quotes if present
      let serviceAccountString = process.env.FIREBASE_ADMIN_SA.trim();
      if ((serviceAccountString.startsWith("'") && serviceAccountString.endsWith("'")) ||
          (serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"'))) {
        serviceAccountString = serviceAccountString.slice(1, -1);
      }
      let serviceAccount = JSON.parse(serviceAccountString);
      
      // Fix private key formatting
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin SDK initialized from FIREBASE_ADMIN_SA');
    } catch (error) {
      console.error('❌ Failed to initialize from FIREBASE_ADMIN_SA:', error);
    }
  }
}

if (!admin.apps.length) {
  console.error('❌ Firebase Admin SDK failed to initialize!');
  process.exit(1);
}

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Debug: Check what we loaded
console.log('📋 Environment variables check:');
console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
console.log(`   FIREBASE_ADMIN_SA: ${process.env.FIREBASE_ADMIN_SA ? '✅ Set' : '❌ Missing'}`);
console.log(`   FIREBASE_SERVICE_ACCOUNT_PATH: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH ? '✅ Set' : '❌ Missing'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.error(`\nCurrent values:`);
  console.error(`   SUPABASE_URL: ${supabaseUrl || 'undefined'}`);
  console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'Set (hidden)' : 'undefined'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Collection to table mapping
const COLLECTIONS = {
  'stores-mimecode': 'stores',
  'categories-mimecode': 'categories',
  'coupons-mimecode': 'coupons',
  'banners-mimecode': 'banners',
  'news-mimecode': 'news',
  'faqs-mimecode': 'faqs',
  'storeFaqs-mimecode': 'store_faqs',
  'regions-mimecode': 'regions',
  'logos-mimecode': 'logos',
  'emailSettings-mimecode': 'email_settings',
  'newsletterSubscriptions-mimecode': 'newsletter_subscriptions',
  'contactSubmissions-mimecode': 'contact_submissions',
};

// Helper function to convert Firestore Timestamp to ISO string
function convertTimestamp(timestamp: any): string | null {
  if (!timestamp) return null;
  
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  
  return null;
}

// Helper function to convert Firestore document to Supabase row
function convertDocument(doc: any, collectionName: string): any {
  const data = doc.data();
  const converted: any = {};

  // Map fields based on collection
  switch (collectionName) {
    case 'stores-mimecode':
      converted.name = data.name;
      converted.sub_store_name = data.subStoreName || null;
      converted.slug = data.slug || null;
      converted.description = data.description;
      converted.logo_url = data.logoUrl || null;
      converted.voucher_text = data.voucherText || null;
      converted.network_id = data.networkId || null;
      converted.is_trending = data.isTrending || false;
      converted.layout_position = data.layoutPosition || null;
      converted.category_id = data.categoryId || null;
      converted.website_url = data.websiteUrl || null;
      converted.about_text = data.aboutText || null;
      converted.features = data.features || null;
      converted.shipping_info = data.shippingInfo || null;
      converted.return_policy = data.returnPolicy || null;
      converted.contact_info = data.contactInfo || null;
      converted.trust_score = data.trustScore || null;
      converted.established_year = data.establishedYear || null;
      converted.headquarters = data.headquarters || null;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'categories-mimecode':
      converted.name = data.name;
      converted.logo_url = data.logoUrl || null;
      converted.background_color = data.backgroundColor;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'coupons-mimecode':
      converted.code = data.code;
      converted.store_name = data.storeName || null;
      converted.store_ids = data.storeIds || null;
      converted.discount = data.discount;
      converted.discount_type = data.discountType;
      converted.description = data.description;
      converted.is_active = data.isActive !== false;
      converted.max_uses = data.maxUses || 1000;
      converted.current_uses = data.currentUses || 0;
      converted.expiry_date = convertTimestamp(data.expiryDate);
      converted.logo_url = data.logoUrl || null;
      converted.url = data.url || null;
      converted.coupon_type = data.couponType || 'code';
      converted.is_popular = data.isPopular || false;
      converted.layout_position = data.layoutPosition || null;
      converted.is_latest = data.isLatest || false;
      converted.latest_layout_position = data.latestLayoutPosition || null;
      converted.category_id = data.categoryId || null;
      converted.button_text = data.buttonText || null;
      converted.deal_scope = data.dealScope || null;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'banners-mimecode':
      converted.title = data.title;
      converted.image_url = data.imageUrl;
      converted.layout_position = data.layoutPosition || null;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'news-mimecode':
      converted.title = data.title;
      converted.description = data.description;
      converted.content = data.content || null;
      converted.image_url = data.imageUrl;
      converted.article_url = data.articleUrl || null;
      converted.date = data.date || null;
      converted.layout_position = data.layoutPosition || null;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'faqs-mimecode':
      converted.question = data.question;
      converted.answer = data.answer;
      converted.order = data.order || 0;
      converted.is_active = data.isActive !== false;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'storeFaqs-mimecode':
      converted.store_id = data.storeId;
      converted.question = data.question;
      converted.answer = data.answer;
      converted.order = data.order || 0;
      converted.is_active = data.isActive !== false;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'regions-mimecode':
      converted.name = data.name;
      converted.network_id = data.networkId;
      converted.description = data.description || null;
      converted.is_active = data.isActive !== false;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'logos-mimecode':
      converted.name = data.name;
      converted.logo_url = data.logoUrl;
      converted.website_url = data.websiteUrl || null;
      converted.layout_position = data.layoutPosition || null;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'emailSettings-mimecode':
      converted.email1 = data.email1 || 'admin@mimecode.com';
      converted.email2 = data.email2 || null;
      converted.email3 = data.email3 || null;
      converted.created_at = convertTimestamp(data.createdAt);
      converted.updated_at = convertTimestamp(data.updatedAt);
      break;

    case 'newsletterSubscriptions-mimecode':
      converted.email = data.email;
      converted.subscribed_at = convertTimestamp(data.subscribedAt || data.createdAt);
      converted.is_active = data.isActive !== false;
      break;

    case 'contactSubmissions-mimecode':
      converted.name = data.name;
      converted.email = data.email;
      converted.subject = data.subject || null;
      converted.message = data.message;
      converted.submitted_at = convertTimestamp(data.submittedAt || data.createdAt);
      break;

    default:
      console.warn(`⚠️ Unknown collection: ${collectionName}`);
      return null;
  }

  return converted;
}

// Helper function to check if error is quota related
function isQuotaError(error: any): boolean {
  const errorMessage = error?.message || String(error);
  const errorCode = error?.code;
  
  return (
    errorMessage.includes('RESOURCE_EXHAUSTED') ||
    errorMessage.includes('Quota exceeded') ||
    errorCode === 'resource-exhausted' ||
    errorCode === 8 ||
    errorMessage.includes('8 RESOURCE_EXHAUSTED')
  );
}

// Migrate a single collection
async function migrateCollection(firestoreCollection: string, supabaseTable: string) {
  try {
    console.log(`\n📦 Migrating ${firestoreCollection} → ${supabaseTable}...`);

    const firestore = admin.firestore();
    let snapshot;
    
    try {
      snapshot = await firestore.collection(firestoreCollection).get();
    } catch (error: any) {
      if (isQuotaError(error)) {
        console.error(`   ⚠️  Firebase quota exceeded for ${firestoreCollection}`);
        console.error(`   💡 Quota usually resets within 24 hours`);
        console.error(`   📖 See FIREBASE_QUOTA_EXPORT_GUIDE.md for alternatives`);
        return { success: false, error, isQuotaError: true };
      }
      throw error;
    }

    if (snapshot.empty) {
      console.log(`   ℹ️  No documents found in ${firestoreCollection}`);
      return { success: true, count: 0 };
    }

    console.log(`   📊 Found ${snapshot.size} documents`);

    const rows: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    snapshot.forEach((doc) => {
      try {
        const converted = convertDocument(doc, firestoreCollection);
        if (converted) {
          rows.push(converted);
        }
      } catch (error) {
        console.error(`   ❌ Error converting document ${doc.id}:`, error);
        errorCount++;
      }
    });

    if (rows.length === 0) {
      console.log(`   ⚠️  No valid rows to insert`);
      return { success: true, count: 0 };
    }

    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from(supabaseTable).insert(batch);

      if (error) {
        console.error(`   ❌ Error inserting batch ${i / batchSize + 1}:`, error.message);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
        console.log(`   ✅ Inserted batch ${i / batchSize + 1} (${successCount}/${rows.length} total)`);
      }
    }

    console.log(`   ✅ Migration complete: ${successCount} successful, ${errorCount} errors`);
    return { success: true, count: successCount, errors: errorCount };
  } catch (error: any) {
    if (isQuotaError(error)) {
      console.error(`   ⚠️  Firebase quota exceeded for ${firestoreCollection}`);
      console.error(`   💡 Quota usually resets within 24 hours`);
      return { success: false, error, isQuotaError: true };
    }
    console.error(`   ❌ Migration failed for ${firestoreCollection}:`, error);
    return { success: false, error };
  }
}

// Main migration function
async function migrateAll() {
  console.log('🚀 Starting Firestore to Supabase Migration...\n');
  console.log('=' .repeat(60));

  const results: any = {};

  for (const [firestoreCollection, supabaseTable] of Object.entries(COLLECTIONS)) {
    const result = await migrateCollection(firestoreCollection, supabaseTable);
    results[firestoreCollection] = result;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:\n');

  let totalSuccess = 0;
  let totalErrors = 0;
  let quotaErrors = 0;

  for (const [collection, migrationResult] of Object.entries(results)) {
    if (migrationResult && typeof migrationResult === 'object' && 'success' in migrationResult) {
      if (migrationResult.success) {
        const count = (migrationResult as { count?: number }).count || 0;
        const errors = (migrationResult as { errors?: number }).errors || 0;
        console.log(`✅ ${collection}: ${count} documents migrated`);
        totalSuccess += count;
        totalErrors += errors;
      } else {
        const error = (migrationResult as { error?: { message?: string } }).error;
        const isQuota = (migrationResult as { isQuotaError?: boolean }).isQuotaError;
        
        if (isQuota) {
          quotaErrors++;
          console.log(`⚠️  ${collection}: Quota exceeded - ${error?.message || 'RESOURCE_EXHAUSTED'}`);
        } else {
          console.log(`❌ ${collection}: Failed - ${error?.message || 'Unknown error'}`);
        }
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  
  if (quotaErrors > 0) {
    console.log(`\n⚠️  Firebase Quota Exceeded!`);
    console.log(`\n📊 Results:`);
    console.log(`   ✅ Migrated: ${totalSuccess} documents`);
    console.log(`   ⚠️  Quota Errors: ${quotaErrors} collections`);
    console.log(`\n💡 Solutions:`);
    console.log(`   1. Wait 24 hours for quota reset (recommended)`);
    console.log(`   2. See FIREBASE_QUOTA_EXPORT_GUIDE.md for alternative methods`);
    console.log(`   3. Upgrade Firebase plan temporarily for higher limits`);
    console.log(`\n📖 Guide: FIREBASE_QUOTA_EXPORT_GUIDE.md`);
  } else {
    console.log(`\n🎉 Total: ${totalSuccess} documents migrated successfully`);
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} errors encountered`);
    }
  }
  
  console.log('\n✅ Migration script complete!');
}

// Run migration
migrateAll().catch((error) => {
  console.error('❌ Fatal error during migration:', error);
  process.exit(1);
});


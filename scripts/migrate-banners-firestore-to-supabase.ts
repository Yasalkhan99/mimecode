/**
 * Migration script to move banners from Firestore to Supabase
 * 
 * Usage:
 *   tsx scripts/migrate-banners-firestore-to-supabase.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables first
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

// Now import Firebase and Supabase after env is loaded
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try service account path first
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin SDK initialized from service account file');
      } else {
        console.error(`❌ Service account file not found at: ${serviceAccountPath}`);
      }
    }

    // Try service account JSON string
    if (!admin.apps.length && process.env.FIREBASE_ADMIN_SA) {
      let serviceAccountString = process.env.FIREBASE_ADMIN_SA;
      // Remove surrounding quotes if present
      if (serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"')) {
        serviceAccountString = serviceAccountString.slice(1, -1);
      }
      if (serviceAccountString.startsWith("'") && serviceAccountString.endsWith("'")) {
        serviceAccountString = serviceAccountString.slice(1, -1);
      }
      
      try {
        const serviceAccount = JSON.parse(serviceAccountString);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('✅ Firebase Admin SDK initialized from FIREBASE_ADMIN_SA');
      } catch (e) {
        console.error('❌ Failed to parse FIREBASE_ADMIN_SA:', e);
      }
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization error:', error);
  }
}

if (!admin.apps.length) {
  console.error('❌ Firebase Admin SDK not initialized!');
  console.error('   Please configure FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_ADMIN_SA in .env.local');
  process.exit(1);
}

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log('✅ Supabase client initialized');

// Collection name
const collectionName = process.env.NEXT_PUBLIC_BANNERS_COLLECTION || 'banners-mimecode';

interface MigrationResult {
  collection: string;
  total: number;
  migrated: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

interface BannerData {
  id: string;
  title?: string;
  imageUrl?: string;
  layoutPosition?: number | null;
  createdAt?: admin.firestore.Timestamp | Date | string | null;
  updatedAt?: admin.firestore.Timestamp | Date | string | null;
  [key: string]: any; // Allow other properties from Firestore
}

async function migrateBanners(): Promise<MigrationResult> {
  const result: MigrationResult = {
    collection: collectionName,
    total: 0,
    migrated: 0,
    failed: 0,
    errors: [],
  };

  try {
    console.log(`\n📦 Fetching banners from Firestore collection: ${collectionName}`);
    const firestore = admin.firestore();
    const snapshot = await firestore.collection(collectionName).get();

    result.total = snapshot.size;
    console.log(`   Found ${result.total} banner(s) to migrate`);

    if (result.total === 0) {
      console.log('   No banners to migrate. Exiting.');
      return result;
    }

    // Process banners in batches
    const batchSize = 10;
    const banners: BannerData[] = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      } as BannerData;
    });

    for (let i = 0; i < banners.length; i += batchSize) {
      const batch = banners.slice(i, i + batchSize);
      console.log(`\n📤 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(banners.length / batchSize)}`);

      for (const bannerItem of batch) {
        const banner: BannerData = bannerItem;
        try {
          // Convert Firestore timestamp to ISO string
          let createdAt = null;
          if (banner.createdAt) {
            if (banner.createdAt instanceof admin.firestore.Timestamp || (banner.createdAt && typeof (banner.createdAt as any).toDate === 'function')) {
              createdAt = (banner.createdAt as admin.firestore.Timestamp).toDate().toISOString();
            } else if (banner.createdAt instanceof Date) {
              createdAt = banner.createdAt.toISOString();
            } else if (typeof banner.createdAt === 'string') {
              createdAt = banner.createdAt;
            }
          }

          // Prepare banner data for Supabase
          const bannerData: any = {
            title: banner.title || '',
            image_url: banner.imageUrl || '',
            layout_position: banner.layoutPosition || null,
          };

          if (createdAt) {
            bannerData.created_at = createdAt;
          }

          // Insert into Supabase
          const { data, error } = await supabase
            .from('banners')
            .insert(bannerData)
            .select()
            .single();

          if (error) {
            // Check if it's a duplicate (banner already exists)
            if (error.code === '23505') {
              console.log(`   ⚠️  Banner "${banner.title}" already exists in Supabase, skipping...`);
              result.migrated++;
            } else {
              throw error;
            }
          } else {
            console.log(`   ✅ Migrated: "${banner.title}" (${data.id})`);
            result.migrated++;
          }
        } catch (error: any) {
          const errorMsg = error?.message || String(error);
          console.error(`   ❌ Failed to migrate banner "${banner.title}": ${errorMsg}`);
          result.failed++;
          result.errors.push({
            id: banner.id || 'unknown',
            error: errorMsg,
          });
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Migration error:', error);
    const errorMsg = error?.message || String(error);
    result.errors.push({
      id: 'migration',
      error: errorMsg,
    });
  }

  return result;
}

// Run migration
console.log('\n🚀 Starting banner migration from Firestore to Supabase...\n');

migrateBanners()
  .then((result) => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary');
    console.log('='.repeat(60));
    console.log(`Collection: ${result.collection}`);
    console.log(`Total banners: ${result.total}`);
    console.log(`✅ Migrated: ${result.migrated}`);
    console.log(`❌ Failed: ${result.failed}`);

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach((err) => {
        console.log(`   - ${err.id}: ${err.error}`);
      });
    }

    if (result.migrated > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log(`   ${result.migrated} banner(s) are now in Supabase.`);
    } else if (result.total === 0) {
      console.log('\n✅ No banners to migrate.');
    } else {
      console.log('\n⚠️  Migration completed with errors.');
    }

    process.exit(result.failed > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal migration error:', error);
    process.exit(1);
  });


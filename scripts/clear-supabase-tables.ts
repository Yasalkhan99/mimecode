/**
 * Clear all data from Supabase tables
 * 
 * WARNING: This script will DELETE ALL DATA from all tables!
 * Use with caution. This is a destructive operation.
 * 
 * Run with: npx tsx scripts/clear-supabase-tables.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Try to load .env.local file
const envPath = resolve(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const dotenvResult = config({ path: envPath });
  if (dotenvResult.error) {
    console.warn('⚠️  Warning: Error loading .env.local:', dotenvResult.error);
    console.warn('   Trying to use environment variables directly...\n');
  } else {
    console.log('✅ Loaded .env.local file\n');
  }
} else {
  console.warn('⚠️  Warning: .env.local file not found!');
  console.warn(`   Expected at: ${envPath}`);
  console.warn('   Trying to use environment variables directly...\n');
}

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('\n❌ Missing Supabase credentials in .env.local');
  console.error('Required: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// List of all tables to clear (matching the migration script)
const TABLES = [
  'stores',
  'categories',
  'coupons',
  'banners',
  'news',
  'faqs',
  'store_faqs',
  'regions',
  'logos',
  'email_settings',
  'newsletter_subscriptions',
  'contact_submissions',
];

async function clearTable(tableName: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // First, get count of rows
    const { count: initialCount } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (initialCount === 0) {
      return { success: true, count: 0 };
    }

    // Fetch all rows in batches and delete them
    let deletedCount = 0;
    let offset = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      // Fetch a batch of rows
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('id')
        .range(offset, offset + batchSize - 1);

      if (fetchError) {
        // If we can't fetch by id, try a different approach
        // Use a condition that should match all rows
        const { error: deleteError } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (deleteError) {
          return { success: false, error: `Fetch error: ${fetchError.message}, Delete error: ${deleteError.message}` };
        }
        // If delete succeeded, we're done
        return { success: true, count: initialCount || 0 };
      }

      if (!data || data.length === 0) {
        hasMore = false;
        break;
      }

      // Extract IDs
      const ids = data.map(row => row.id).filter(id => id !== null && id !== undefined);

      if (ids.length === 0) {
        // No IDs found, try alternative delete
        const { error: altDeleteError } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (altDeleteError) {
          return { success: false, error: altDeleteError.message };
        }
        return { success: true, count: initialCount || 0 };
      }

      // Delete this batch
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      deletedCount += ids.length;
      offset += batchSize;
      hasMore = data.length === batchSize;

      // Small delay to avoid overwhelming the API
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { success: true, count: deletedCount || initialCount || 0 };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

async function clearAllTables() {
  console.log('\n🗑️  Starting to clear all Supabase tables...\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA from all tables!\n');

  const results: Array<{ table: string; success: boolean; count?: number; error?: string }> = [];

  for (const table of TABLES) {
    console.log(`Clearing table: ${table}...`);
    const result = await clearTable(table);
    results.push({ table, ...result });

    if (result.success) {
      console.log(`✅ Cleared ${table} (${result.count || 0} rows deleted)\n`);
    } else {
      console.log(`❌ Failed to clear ${table}: ${result.error}\n`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalRows = successful.reduce((sum, r) => sum + (r.count || 0), 0);

  console.log(`✅ Successfully cleared: ${successful.length} tables`);
  console.log(`❌ Failed to clear: ${failed.length} tables`);
  console.log(`📊 Total rows deleted: ${totalRows}`);

  if (failed.length > 0) {
    console.log('\n❌ Failed tables:');
    failed.forEach(r => {
      console.log(`   - ${r.table}: ${r.error}`);
    });
  }

  console.log('\n✨ Done!\n');
}

// Run the script
clearAllTables()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });

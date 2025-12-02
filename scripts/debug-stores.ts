/**
 * Debug Script - Check Stores Data
 * Shows first 20 stores to understand the data structure
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStores() {
  console.log('🔍 Debugging Stores Data...\n');
  
  // Find stores table
  const tables = ['stores', 'stores-mimecode', 'Stores'];
  let storesTable = '';
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error && data) {
        storesTable = table;
        console.log(`✅ Found stores table: "${table}"\n`);
        break;
      }
    } catch (e) {
      // Continue
    }
  }
  
  if (!storesTable) {
    console.error('❌ Could not find stores table');
    return;
  }
  
  // Get first 20 stores
  const { data: stores, error } = await supabase
    .from(storesTable)
    .select('*')
    .limit(20);
  
  if (error) {
    console.error('❌ Error fetching stores:', error.message);
    return;
  }
  
  console.log(`📊 Total stores fetched: ${stores?.length}\n`);
  console.log('═'.repeat(80) + '\n');
  
  stores?.forEach((store, index) => {
    console.log(`Store ${index + 1}:`);
    console.log(`  All columns: ${Object.keys(store).join(', ')}`);
    console.log(`  Name: ${store.name || store['Store Name'] || store['store_name'] || 'N/A'}`);
    console.log(`  Description: ${(store.description || store.Description || '').substring(0, 100) || 'N/A'}`);
    console.log(`  Category ID: ${store.category_id || store.categoryId || 'Not set'}`);
    console.log(`  ID: ${store.id || store['Store Id'] || 'N/A'}`);
    console.log('');
  });
  
  console.log('═'.repeat(80) + '\n');
  
  // Count categorized vs uncategorized
  const { data: allStores } = await supabase
    .from(storesTable)
    .select('*');
  
  const totalStores = allStores?.length || 0;
  const categorized = allStores?.filter(s => s.category_id || s.categoryId).length || 0;
  const uncategorized = totalStores - categorized;
  
  console.log('📊 Summary:');
  console.log(`   Total stores: ${totalStores}`);
  console.log(`   Categorized: ${categorized}`);
  console.log(`   Uncategorized: ${uncategorized}`);
  console.log(`   Percentage: ${totalStores > 0 ? Math.round((categorized / totalStores) * 100) : 0}%\n`);
  
  // Show sample store names for keyword analysis
  console.log('📝 Sample Store Names (first 30):');
  allStores?.slice(0, 30).forEach((store, i) => {
    const name = store.name || store['Store Name'] || store['store_name'] || 'N/A';
    const hasCat = store.category_id || store.categoryId ? '✅' : '❌';
    console.log(`   ${i + 1}. ${hasCat} ${name}`);
  });
}

debugStores().catch(console.error);


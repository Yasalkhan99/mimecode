/**
 * Verify Categorization Results
 * Check if stores are properly categorized and match with categories
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

async function verifyCategorizatio() {
  console.log('🔍 Verifying Categorization...\n');
  console.log('═'.repeat(60) + '\n');
  
  // Get categories
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*');
  
  if (catError) {
    console.error('❌ Error fetching categories:', catError.message);
    return;
  }
  
  console.log(`📂 Categories in database: ${categories?.length}\n`);
  
  // Get stores
  const { data: stores, error: storesError } = await supabase
    .from('stores')
    .select('*');
  
  if (storesError) {
    console.error('❌ Error fetching stores:', storesError.message);
    return;
  }
  
  console.log(`🏪 Total stores: ${stores?.length}\n`);
  
  // Group stores by category
  const categoryGroups = new Map<string, any[]>();
  let withCategory = 0;
  let withoutCategory = 0;
  
  for (const store of stores || []) {
    if (store.category_id) {
      withCategory++;
      if (!categoryGroups.has(store.category_id)) {
        categoryGroups.set(store.category_id, []);
      }
      categoryGroups.get(store.category_id)?.push(store);
    } else {
      withoutCategory++;
    }
  }
  
  console.log('📊 Categorization Status:');
  console.log(`   ✅ With category_id: ${withCategory} (${Math.round(withCategory / (stores?.length || 1) * 100)}%)`);
  console.log(`   ❌ Without category_id: ${withoutCategory}\n`);
  
  console.log('═'.repeat(60) + '\n');
  console.log('📋 Stores Per Category:\n');
  
  // Show stores per category
  for (const category of categories || []) {
    const categoryStores = categoryGroups.get(category.id) || [];
    console.log(`${category.name}:`);
    console.log(`   Count: ${categoryStores.length} stores`);
    
    if (categoryStores.length > 0) {
      console.log(`   Sample stores:`);
      categoryStores.slice(0, 5).forEach(store => {
        const name = store['Store Name'] || store.name || 'Unknown';
        console.log(`      - ${name}`);
      });
    } else {
      console.log(`   ⚠️  No stores in this category!`);
    }
    console.log('');
  }
  
  console.log('═'.repeat(60) + '\n');
  
  // Check if category IDs match
  console.log('🔗 Checking Category ID Matches:\n');
  
  const categoryIds = new Set(categories?.map(c => c.id));
  const storeCategoryIds = new Set(stores?.map(s => s.category_id).filter(Boolean));
  
  console.log(`Category IDs in categories table: ${categoryIds.size}`);
  console.log(`Unique category IDs in stores: ${storeCategoryIds.size}\n`);
  
  // Find mismatched IDs
  const mismatchedIds = [...storeCategoryIds].filter(id => !categoryIds.has(id));
  
  if (mismatchedIds.length > 0) {
    console.log('⚠️  WARNING: Some stores have category IDs that don\'t exist in categories table!');
    console.log(`   Mismatched IDs: ${mismatchedIds.length}`);
    console.log(`   First few: ${mismatchedIds.slice(0, 5).join(', ')}\n`);
    console.log('   💡 Solution: Run "npm run reset:categories" again to fix this!\n');
  } else {
    console.log('✅ All category IDs match correctly!\n');
  }
  
  // Sample uncategorized stores
  if (withoutCategory > 0) {
    console.log('❌ Sample Uncategorized Stores:\n');
    stores?.filter(s => !s.category_id).slice(0, 10).forEach((store, i) => {
      const name = store['Store Name'] || store.name || 'Unknown';
      console.log(`   ${i + 1}. ${name}`);
    });
    console.log('');
  }
}

verifyCategorizatio().catch(console.error);


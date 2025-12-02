/**
 * Reset and Re-categorize All Stores
 * 
 * This script:
 * 1. Clears all existing category_id values (sets to NULL)
 * 2. Re-categorizes all stores with NEW Supabase categories
 * 
 * Use this when you want a fresh start!
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

// Enhanced category keywords
const categoryKeywords: Record<string, string[]> = {
  'Fashion & Clothing': ['fashion', 'clothing', 'apparel', 'wear', 'dress', 'shirt', 'pants', 'jeans', 'shoes', 'sneakers', 'boots', 'footwear', 'nike', 'adidas', 'zara', 'diesel', 'old navy', 't-shirt', 'tshirt', 'footwear', 'spencer'],
  'Electronics & Tech': ['electronics', 'tech', 'computer', 'laptop', 'phone', 'mobile', 'tablet', 'gadget', 'apple', 'samsung', 'xiaomi', 'mi pakistan'],
  'Home & Garden': ['home', 'furniture', 'decor', 'garden', 'warehouse', 'furniture@work'],
  'Beauty & Health': ['beauty', 'cosmetics', 'makeup', 'skincare', 'hair', 'health', 'wellness', 'juara', 'adore beauty', 'skincare', 'perfume', 'bees'],
  'Sports & Outdoors': ['sports', 'fitness', 'outdoor', 'athletic', 'mountain'],
  'Food & Grocery': ['food', 'grocery', 'restaurant', 'delivery', 'foodora', 'gousto', 'red bull', 'drink', 'energy'],
  'Books & Media': ['book', 'media'],
  'Toys & Kids': ['toy', 'kids', 'children', 'baby', 'cherub', 'burts bees baby'],
  'Automotive': ['auto', 'car'],
  'Travel & Hotels': ['travel', 'hotel'],
  'Jewelry & Watches': ['jewelry', 'jewellery', 'watch', 'diamond'],
  'Pet Supplies': ['pet', 'dog', 'cat', 'mui pet', 'pet chemist', 'chains collar'],
  'Office & Stationery': ['office', 'stationery', 'menkind']
};

function determineCategory(storeName: string, description: string, categoryMap: Map<string, string>): string | null {
  const searchText = `${storeName} ${description}`.toLowerCase();
  const categoryScores = new Map<string, number>();
  
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += storeName.toLowerCase().includes(keyword.toLowerCase()) ? 3 : 1;
      }
    }
    if (score > 0) {
      categoryScores.set(categoryName, score);
    }
  }
  
  if (categoryScores.size === 0) return null;
  
  let bestCategory = '';
  let bestScore = 0;
  
  for (const [categoryName, score] of categoryScores) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = categoryName;
    }
  }
  
  return categoryMap.get(bestCategory) || null;
}

async function main() {
  console.log('🔄 Reset and Re-categorize All Stores\n');
  console.log('═'.repeat(60) + '\n');
  
  // Step 1: Find stores table
  console.log('🔍 Step 1: Finding stores table...');
  const tables = ['stores', 'stores-mimecode'];
  let storesTable = '';
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      if (!error) {
        storesTable = table;
        console.log(`✅ Found: "${table}"\n`);
        break;
      }
    } catch (e) {
      // Continue
    }
  }
  
  if (!storesTable) {
    console.error('❌ Could not find stores table');
    process.exit(1);
  }
  
  // Step 2: Get total stores count
  const { data: allStores, error: countError } = await supabase
    .from(storesTable)
    .select('*');
  
  if (countError) {
    console.error('❌ Error fetching stores:', countError.message);
    process.exit(1);
  }
  
  const totalStores = allStores?.length || 0;
  console.log(`📊 Total stores found: ${totalStores}\n`);
  
  // Step 3: Reset all category_ids to NULL
  console.log('🧹 Step 2: Clearing all existing category IDs...');
  console.log('   (This will allow fresh categorization)\n');
  
  const { error: resetError } = await supabase
    .from(storesTable)
    .update({ category_id: null })
    .neq('Store Id', ''); // Update all rows
  
  if (resetError) {
    console.error('❌ Error resetting categories:', resetError.message);
    process.exit(1);
  }
  
  console.log('✅ All category IDs cleared!\n');
  
  // Step 4: Get categories
  console.log('📂 Step 3: Loading categories...');
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('*');
  
  if (catError) {
    console.error('❌ Error fetching categories:', catError.message);
    process.exit(1);
  }
  
  const categoryMap = new Map<string, string>();
  categoriesData?.forEach((cat: any) => {
    categoryMap.set(cat.name, cat.id);
  });
  
  console.log(`✅ Loaded ${categoryMap.size} categories\n`);
  
  // Step 5: Categorize all stores
  console.log('🤖 Step 4: Auto-categorizing all stores...\n');
  
  let categorized = 0;
  let failed = 0;
  let batchCount = 0;
  
  for (const store of allStores || []) {
    const storeName = store['Store Name'] || store.name || '';
    const storeDescription = store.description || store.Description || '';
    const storeId = store['Store Id'] || store.id;
    
    if (!storeName) {
      failed++;
      continue;
    }
    
    const categoryId = determineCategory(storeName, storeDescription, categoryMap);
    
    if (categoryId) {
      const categoryName = [...categoryMap.entries()].find(([_, id]) => id === categoryId)?.[0];
      
      const { error } = await supabase
        .from(storesTable)
        .update({ category_id: categoryId })
        .eq('Store Id', storeId);
      
      if (error) {
        console.error(`❌ "${storeName}" - Failed`);
        failed++;
      } else {
        categorized++;
        
        // Show progress every 50 stores
        if (categorized % 50 === 0) {
          console.log(`   ✅ Progress: ${categorized}/${totalStores} categorized...`);
        }
      }
    } else {
      failed++;
    }
    
    batchCount++;
    
    // Small delay every 100 stores to avoid rate limits
    if (batchCount % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 Complete!\n');
  console.log('📊 Results:');
  console.log(`   ✅ Successfully categorized: ${categorized} stores`);
  console.log(`   ❌ Could not categorize: ${failed} stores`);
  console.log(`   📈 Success rate: ${totalStores > 0 ? Math.round((categorized / totalStores) * 100) : 0}%\n`);
  
  if (failed > 0) {
    console.log('💡 Tip: Failed stores have generic names or no matching keywords');
    console.log('   You can manually assign categories from admin panel\n');
  }
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


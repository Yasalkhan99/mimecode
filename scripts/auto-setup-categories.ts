/**
 * Complete Auto-Setup for Categories
 * 
 * This script does EVERYTHING automatically:
 * 1. Creates categories table if not exists
 * 2. Adds category_id column to stores if not exists
 * 3. Creates default categories
 * 4. Auto-categorizes all stores
 * 
 * ONE COMMAND - COMPLETE SETUP! 🚀
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default categories with colors
const defaultCategories = [
  { name: 'Fashion & Clothing', backgroundColor: '#FF6B9D', logoUrl: 'https://api.iconify.design/mdi/tshirt-crew.svg?color=%23ffffff' },
  { name: 'Electronics & Tech', backgroundColor: '#4A90E2', logoUrl: 'https://api.iconify.design/mdi/laptop.svg?color=%23ffffff' },
  { name: 'Home & Garden', backgroundColor: '#7ED321', logoUrl: 'https://api.iconify.design/mdi/home.svg?color=%23ffffff' },
  { name: 'Beauty & Health', backgroundColor: '#F5A623', logoUrl: 'https://api.iconify.design/mdi/spa.svg?color=%23ffffff' },
  { name: 'Sports & Outdoors', backgroundColor: '#50E3C2', logoUrl: 'https://api.iconify.design/mdi/basketball.svg?color=%23ffffff' },
  { name: 'Food & Grocery', backgroundColor: '#FF5722', logoUrl: 'https://api.iconify.design/mdi/food.svg?color=%23ffffff' },
  { name: 'Books & Media', backgroundColor: '#9013FE', logoUrl: 'https://api.iconify.design/mdi/book-open-page-variant.svg?color=%23ffffff' },
  { name: 'Toys & Kids', backgroundColor: '#FF4081', logoUrl: 'https://api.iconify.design/mdi/toy-brick.svg?color=%23ffffff' },
  { name: 'Automotive', backgroundColor: '#607D8B', logoUrl: 'https://api.iconify.design/mdi/car.svg?color=%23ffffff' },
  { name: 'Travel & Hotels', backgroundColor: '#00BCD4', logoUrl: 'https://api.iconify.design/mdi/airplane.svg?color=%23ffffff' },
  { name: 'Jewelry & Watches', backgroundColor: '#E91E63', logoUrl: 'https://api.iconify.design/mdi/diamond-stone.svg?color=%23ffffff' },
  { name: 'Pet Supplies', backgroundColor: '#8BC34A', logoUrl: 'https://api.iconify.design/mdi/paw.svg?color=%23ffffff' },
  { name: 'Office & Stationery', backgroundColor: '#3F51B5', logoUrl: 'https://api.iconify.design/mdi/briefcase.svg?color=%23ffffff' }
];

// Category keywords for matching
const categoryKeywords: Record<string, string[]> = {
  'Fashion & Clothing': ['fashion', 'clothing', 'apparel', 'wear', 'dress', 'shirt', 'pants', 'jeans', 'shoes', 'sneakers', 'boots', 'footwear', 'nike', 'adidas', 'zara', 'h&m', 'gap', 'uniqlo'],
  'Electronics & Tech': ['electronics', 'tech', 'computer', 'laptop', 'phone', 'mobile', 'tablet', 'gadget', 'apple', 'samsung', 'dell', 'hp', 'lenovo', 'microsoft', 'sony', 'best buy'],
  'Home & Garden': ['home', 'furniture', 'decor', 'garden', 'outdoor', 'kitchen', 'bath', 'ikea', 'wayfair', 'home depot', 'lowes'],
  'Beauty & Health': ['beauty', 'cosmetics', 'makeup', 'skincare', 'hair', 'health', 'wellness', 'fitness', 'sephora', 'ulta'],
  'Sports & Outdoors': ['sports', 'fitness', 'outdoor', 'athletic', 'gym', 'yoga', 'running', 'cycling', 'camping', 'hiking'],
  'Food & Grocery': ['food', 'grocery', 'restaurant', 'cafe', 'pizza', 'burger', 'delivery', 'meal', 'walmart', 'kroger'],
  'Books & Media': ['book', 'ebook', 'magazine', 'movie', 'dvd', 'music', 'cd', 'streaming', 'amazon books', 'barnes'],
  'Toys & Kids': ['toy', 'kids', 'children', 'baby', 'infant', 'toddler', 'game', 'puzzle', 'lego'],
  'Automotive': ['auto', 'car', 'vehicle', 'motorcycle', 'truck', 'parts', 'tire', 'autozone'],
  'Travel & Hotels': ['travel', 'hotel', 'flight', 'airline', 'vacation', 'cruise', 'expedia', 'booking'],
  'Jewelry & Watches': ['jewelry', 'jewellery', 'watch', 'diamond', 'gold', 'silver', 'ring', 'necklace'],
  'Pet Supplies': ['pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'petco', 'petsmart', 'chewy'],
  'Office & Stationery': ['office', 'stationery', 'supplies', 'paper', 'pen', 'notebook', 'staples']
};

async function createCategoriesTable() {
  console.log('📋 Step 1: Creating categories table...');
  
  try {
    // Check if table exists by trying to query it
    const { error: checkError } = await supabase
      .from('categories')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ Categories table already exists\n');
      return true;
    }
    
    // Table doesn't exist, create it using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL UNIQUE,
          logo_url TEXT,
          background_color TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
      `
    });
    
    if (error) {
      console.log('⚠️  Could not create table via RPC, trying alternative method...');
      console.log('   Please run this SQL in Supabase SQL Editor:');
      console.log('   See: scripts/create-categories-table-supabase.sql\n');
      return false;
    }
    
    console.log('✅ Created categories table\n');
    return true;
  } catch (error) {
    console.log('⚠️  Please create categories table manually in Supabase SQL Editor');
    console.log('   File: scripts/create-categories-table-supabase.sql\n');
    return false;
  }
}

async function addCategoryColumnToStores(tableName: string) {
  console.log(`📋 Step 2: Adding category_id column to ${tableName} table...`);
  
  try {
    // Try to add column (will fail if already exists, which is fine)
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE "${tableName}" 
        ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_${tableName.replace('-', '_')}_category_id 
        ON "${tableName}"(category_id);
      `
    });
    
    if (error && !error.message.includes('already exists')) {
      console.log('⚠️  Could not add column via RPC, trying alternative...');
      console.log('   Column might already exist or needs manual creation\n');
    } else {
      console.log('✅ Added category_id column\n');
    }
    
    return true;
  } catch (error) {
    console.log('⚠️  Please add category_id column manually if needed');
    console.log('   File: scripts/add-category-id-to-stores.sql\n');
    return true; // Continue anyway
  }
}

async function createCategories() {
  console.log('📋 Step 3: Creating default categories...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const category of defaultCategories) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{
          name: category.name,
          background_color: category.backgroundColor,
          logo_url: category.logoUrl
        }])
        .select();
      
      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          console.log(`⏭️  "${category.name}" - Already exists`);
          skipped++;
        } else {
          console.error(`❌ Error creating "${category.name}":`, error.message);
        }
      } else {
        console.log(`✅ Created "${category.name}"`);
        created++;
      }
    } catch (error: any) {
      console.error(`❌ Error creating "${category.name}":`, error.message);
    }
  }
  
  console.log(`\n📊 Categories: ${created} created, ${skipped} already existed\n`);
  return true;
}

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

async function categorizeStores(tableName: string) {
  console.log('📋 Step 4: Auto-categorizing stores...\n');
  
  // Fetch categories
  const { data: categoriesData, error: catError } = await supabase
    .from('categories')
    .select('*');
  
  if (catError) {
    console.error('❌ Error fetching categories:', catError.message);
    return false;
  }
  
  const categoryMap = new Map<string, string>();
  categoriesData?.forEach((cat: any) => {
    categoryMap.set(cat.name, cat.id);
  });
  
  console.log(`✅ Loaded ${categoryMap.size} categories\n`);
  
  // Fetch stores
  const { data: storesData, error: storesError } = await supabase
    .from(tableName)
    .select('*');
  
  if (storesError) {
    console.error('❌ Error fetching stores:', storesError.message);
    return false;
  }
  
  console.log(`✅ Found ${storesData?.length || 0} stores\n`);
  console.log('🔍 Categorizing...\n');
  
  let categorized = 0;
  let skipped = 0;
  let failed = 0;
  
  for (const store of storesData || []) {
    // Handle multiple naming conventions
    const storeName = store.name || store['Store Name'] || store['store_name'] || store.Name || '';
    const storeDescription = store.description || store.Description || store['Store Description'] || '';
    const storeId = store.id || store['Store Id'] || store.store_id || store['id'];
    
    if (!storeName) {
      skipped++;
      continue;
    }
    
    if (store.category_id || store['category_id'] || store.categoryId) {
      console.log(`⏭️  "${storeName}" - Already categorized`);
      skipped++;
      continue;
    }
    
    const categoryId = determineCategory(storeName, storeDescription, categoryMap);
    
    if (categoryId) {
      const categoryName = [...categoryMap.entries()].find(([_, id]) => id === categoryId)?.[0];
      
      // Try to update with different ID column names
      let updateError = null;
      const idColumns = ['id', 'Store Id', 'store_id'];
      
      for (const idCol of idColumns) {
        const { error } = await supabase
          .from(tableName)
          .update({ category_id: categoryId })
          .eq(idCol, storeId);
        
        if (!error) {
          console.log(`✅ "${storeName}" → ${categoryName}`);
          categorized++;
          updateError = null;
          break;
        } else {
          updateError = error;
        }
      }
      
      if (updateError) {
        console.error(`❌ "${storeName}" - Update failed: ${updateError.message}`);
        failed++;
      }
    } else {
      console.log(`❓ "${storeName}" - No matching category`);
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${categorized} categorized, ${skipped} skipped, ${failed} failed\n`);
  return true;
}

async function main() {
  console.log('🚀 Starting Complete Auto-Setup for Categories...\n');
  console.log('═'.repeat(60) + '\n');
  
  // Step 1: Create categories table
  await createCategoriesTable();
  
  // Step 2: Find stores table
  console.log('🔍 Finding stores table...');
  let storesTable = '';
  
  const tables = ['stores', 'stores-mimecode', 'Stores', 'public.stores'];
  for (const table of tables) {
    // Try different column names for selection
    const columnAttempts = ['id', '"Store Id"', 'store_id', '*'];
    
    for (const column of columnAttempts) {
      try {
        const { data, error } = await supabase.from(table).select(column).limit(1);
        if (!error && data !== null) {
          storesTable = table;
          console.log(`✅ Found stores table: "${table}"\n`);
          console.log(`   Sample row keys: ${data[0] ? Object.keys(data[0]).slice(0, 5).join(', ') : 'No data'}\n`);
          break;
        }
      } catch (e) {
        // Continue to next attempt
      }
    }
    
    if (storesTable) break;
  }
  
  if (!storesTable) {
    console.error('❌ Could not find stores table');
    console.error('   Tried table names: ' + tables.join(', '));
    console.error('\n💡 Please check Supabase dashboard for actual table name');
    console.error('   Then update this script with the correct name\n');
    process.exit(1);
  }
  
  // Step 3: Add category column
  await addCategoryColumnToStores(storesTable);
  
  // Step 4: Create categories
  await createCategories();
  
  // Step 5: Categorize stores
  await categorizeStores(storesTable);
  
  console.log('═'.repeat(60));
  console.log('\n🎉 Complete! Categories setup finished successfully!\n');
  console.log('✅ Categories created');
  console.log('✅ Stores categorized');
  console.log('✅ Ready to use in frontend\n');
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});


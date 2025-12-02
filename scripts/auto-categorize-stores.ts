/**
 * Auto-Categorize Stores Script
 * 
 * This script automatically assigns categories to stores based on their names
 * and business types. It uses intelligent pattern matching to determine the
 * most appropriate category for each store.
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

// Category keywords mapping
const categoryKeywords: Record<string, string[]> = {
  'Fashion & Clothing': [
    'fashion', 'clothing', 'apparel', 'wear', 'dress', 'shirt', 'pants', 'jeans',
    'shoes', 'sneakers', 'boots', 'footwear', 'accessories', 'bags', 'handbag',
    'nike', 'adidas', 'zara', 'h&m', 'gap', 'uniqlo', 'forever21', 'asos',
    'shein', 'boohoo', 'prettylittlething', 'missguided', 'topshop', 'urban outfitters',
    'levi', 'tommy', 'calvin klein', 'gucci', 'prada', 'versace', 'burberry',
    'fashion nova', 'revolve', 'nordstrom', 'macy', 'bloomingdale', 'saks',
    'neiman marcus', 'bergdorf', 'selfridges', 'harrods', 'liberty'
  ],
  'Electronics & Tech': [
    'electronics', 'tech', 'computer', 'laptop', 'phone', 'mobile', 'tablet',
    'gadget', 'apple', 'samsung', 'dell', 'hp', 'lenovo', 'microsoft', 'sony',
    'lg', 'asus', 'acer', 'huawei', 'xiaomi', 'oneplus', 'google pixel',
    'best buy', 'newegg', 'b&h photo', 'adorama', 'micro center', 'fry\'s',
    'gaming', 'pc', 'console', 'playstation', 'xbox', 'nintendo', 'steam'
  ],
  'Home & Garden': [
    'home', 'furniture', 'decor', 'garden', 'outdoor', 'kitchen', 'bath',
    'bedroom', 'living room', 'dining', 'lighting', 'rug', 'curtain', 'bedding',
    'ikea', 'wayfair', 'home depot', 'lowes', 'bed bath & beyond', 'target home',
    'pottery barn', 'west elm', 'crate and barrel', 'williams sonoma', 'sur la table',
    'homegoods', 'pier 1', 'world market', 'anthropologie home', 'cb2',
    'restoration hardware', 'room & board', 'ethan allen', 'ashley furniture'
  ],
  'Beauty & Health': [
    'beauty', 'cosmetics', 'makeup', 'skincare', 'hair', 'fragrance', 'perfume',
    'health', 'wellness', 'fitness', 'supplement', 'vitamin', 'pharmacy', 'spa',
    'sephora', 'ulta', 'mac', 'nyx', 'maybelline', 'loreal', 'estee lauder',
    'clinique', 'lancome', 'dior beauty', 'chanel beauty', 'glossier', 'fenty',
    'kylie cosmetics', 'anastasia', 'too faced', 'benefit', 'bare minerals',
    'the body shop', 'lush', 'bath & body works', 'victoria\'s secret beauty',
    'walgreens', 'cvs', 'rite aid', 'boots', 'superdrug', 'gnc', 'vitamin shoppe'
  ],
  'Sports & Outdoors': [
    'sports', 'fitness', 'outdoor', 'athletic', 'gym', 'yoga', 'running',
    'cycling', 'camping', 'hiking', 'fishing', 'hunting', 'golf', 'tennis',
    'soccer', 'basketball', 'football', 'baseball', 'swimming', 'ski', 'snowboard',
    'nike', 'adidas', 'under armour', 'puma', 'reebok', 'new balance', 'asics',
    'dick\'s sporting goods', 'academy sports', 'rei', 'cabela\'s', 'bass pro shops',
    'decathlon', 'sports direct', 'jd sports', 'foot locker', 'finish line',
    'lululemon', 'athleta', 'gymshark', 'fabletics', 'outdoor voices'
  ],
  'Food & Grocery': [
    'food', 'grocery', 'supermarket', 'restaurant', 'cafe', 'pizza', 'burger',
    'delivery', 'meal', 'snack', 'beverage', 'drink', 'coffee', 'tea', 'wine',
    'beer', 'organic', 'fresh', 'produce', 'bakery', 'deli', 'meat', 'seafood',
    'walmart grocery', 'kroger', 'safeway', 'whole foods', 'trader joe', 'aldi',
    'lidl', 'costco', 'sam\'s club', 'target grocery', 'publix', 'wegmans',
    'mcdonald', 'burger king', 'kfc', 'subway', 'starbucks', 'dunkin', 'chipotle',
    'panera', 'domino', 'pizza hut', 'papa john', 'grubhub', 'uber eats', 'doordash'
  ],
  'Books & Media': [
    'book', 'ebook', 'audiobook', 'magazine', 'newspaper', 'comic', 'manga',
    'movie', 'dvd', 'blu-ray', 'music', 'cd', 'vinyl', 'streaming', 'video',
    'amazon books', 'barnes & noble', 'books-a-million', 'waterstones', 'audible',
    'kindle', 'kobo', 'nook', 'scribd', 'bookshop', 'thriftbooks', 'abebooks',
    'netflix', 'hulu', 'disney+', 'hbo', 'prime video', 'spotify', 'apple music',
    'youtube music', 'pandora', 'tidal', 'deezer', 'soundcloud'
  ],
  'Toys & Kids': [
    'toy', 'kids', 'children', 'baby', 'infant', 'toddler', 'nursery', 'playground',
    'educational', 'learning', 'game', 'puzzle', 'doll', 'action figure', 'lego',
    'toys r us', 'toysrus', 'toys"r"us', 'target toys', 'walmart toys', 'amazon toys',
    'fisher-price', 'mattel', 'hasbro', 'melissa & doug', 'lego store', 'playmobil',
    'build-a-bear', 'american girl', 'disney store', 'carter\'s', 'gymboree',
    'oshkosh', 'gap kids', 'old navy kids', 'children\'s place', 'justice',
    'buy buy baby', 'babies r us', 'baby depot', 'motherhood', 'destination maternity'
  ],
  'Automotive': [
    'auto', 'car', 'vehicle', 'motorcycle', 'bike', 'truck', 'suv', 'parts',
    'accessories', 'tire', 'wheel', 'oil', 'battery', 'brake', 'engine', 'repair',
    'autozone', 'advance auto', 'o\'reilly', 'napa', 'pep boys', 'car parts',
    'rockauto', 'summit racing', 'jegs', 'tire rack', 'discount tire',
    'ford', 'chevy', 'toyota', 'honda', 'bmw', 'mercedes', 'audi', 'volkswagen',
    'nissan', 'mazda', 'hyundai', 'kia', 'tesla', 'carmax', 'carvana', 'vroom'
  ],
  'Travel & Hotels': [
    'travel', 'hotel', 'flight', 'airline', 'vacation', 'trip', 'cruise', 'resort',
    'accommodation', 'booking', 'tour', 'tourism', 'destination', 'airport', 'rental',
    'expedia', 'booking.com', 'hotels.com', 'priceline', 'kayak', 'tripadvisor',
    'airbnb', 'vrbo', 'homeaway', 'marriott', 'hilton', 'hyatt', 'ihg', 'best western',
    'delta', 'united', 'american airlines', 'southwest', 'jetblue', 'spirit',
    'carnival', 'royal caribbean', 'norwegian', 'celebrity cruises', 'disney cruise',
    'hertz', 'enterprise', 'budget', 'avis', 'national', 'alamo', 'thrifty'
  ],
  'Jewelry & Watches': [
    'jewelry', 'jewellery', 'watch', 'diamond', 'gold', 'silver', 'platinum',
    'ring', 'necklace', 'bracelet', 'earring', 'pendant', 'chain', 'luxury',
    'tiffany', 'cartier', 'bulgari', 'van cleef', 'harry winston', 'chopard',
    'rolex', 'omega', 'tag heuer', 'breitling', 'iwc', 'patek philippe', 'audemars',
    'pandora', 'swarovski', 'kay jewelers', 'zales', 'jared', 'blue nile',
    'james allen', 'brilliant earth', 'mejuri', 'catbird', 'missoma'
  ],
  'Pet Supplies': [
    'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'bird', 'fish', 'aquarium',
    'reptile', 'hamster', 'rabbit', 'guinea pig', 'pet food', 'pet care', 'vet',
    'petco', 'petsmart', 'chewy', 'petflow', 'pet supplies plus', 'petland',
    'pet valu', 'pet supermarket', 'blue buffalo', 'purina', 'pedigree', 'iams',
    'royal canin', 'hill\'s', 'science diet', 'wellness', 'natural balance',
    'barkbox', 'pupbox', 'kittenbox', 'meowbox', 'pet plate', 'the farmer\'s dog'
  ],
  'Office & Stationery': [
    'office', 'stationery', 'supplies', 'paper', 'pen', 'pencil', 'notebook',
    'planner', 'calendar', 'desk', 'chair', 'filing', 'printer', 'ink', 'toner',
    'staples', 'office depot', 'officemax', 'viking', 'quill', 'staples.com',
    'amazon basics', 'mead', 'five star', 'post-it', 'sharpie', 'bic', 'pilot',
    'leuchtturm', 'moleskine', 'rhodia', 'erin condren', 'at-a-glance', 'day designer',
    'blueline', 'cambridge', 'tops', 'black n red', 'strathmore', 'canson'
  ]
};

// Intelligent category matching function
function determineCategory(
  storeName: string,
  description: string,
  categories: Map<string, string>
): string | null {
  const searchText = `${storeName} ${description}`.toLowerCase();
  
  // Count matches for each category
  const categoryScores = new Map<string, number>();
  
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        // Give higher weight to matches in store name
        score += storeName.toLowerCase().includes(keyword.toLowerCase()) ? 3 : 1;
      }
    }
    if (score > 0) {
      categoryScores.set(categoryName, score);
    }
  }
  
  // Find category with highest score
  if (categoryScores.size === 0) {
    return null; // No match found
  }
  
  let bestCategory = '';
  let bestScore = 0;
  
  for (const [categoryName, score] of categoryScores) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = categoryName;
    }
  }
  
  // Get the category ID from the categories map
  return categories.get(bestCategory) || null;
}

async function main() {
  console.log('🚀 Starting auto-categorization of stores...\n');
  
  // 1. Fetch all categories from Supabase
  console.log('📂 Fetching categories from Supabase...');
  const { data: categoriesData, error: categoriesError } = await supabase
    .from('categories')
    .select('*');
  
  if (categoriesError) {
    console.error('❌ Error fetching categories:', categoriesError.message);
    process.exit(1);
  }
  
  // Create a map of category names to IDs
  const categoryMap = new Map<string, string>();
  categoriesData?.forEach((cat: any) => {
    categoryMap.set(cat.name, cat.id);
  });
  
  console.log(`✅ Found ${categoryMap.size} categories:`);
  categoryMap.forEach((id, name) => {
    console.log(`   - ${name} (ID: ${id})`);
  });
  console.log('');
  
  // 2. Fetch all stores from Supabase
  console.log('🏪 Fetching stores from Supabase...');
  
  // Try stores-mimecode first, then stores
  let storesData: any[] = [];
  let storesTableName = 'stores-mimecode';
  
  let { data, error } = await supabase
    .from('stores-mimecode')
    .select('*');
  
  if (error && error.code === 'PGRST204') {
    // Table not found, try 'stores'
    console.log('   ℹ️  Table stores-mimecode not found, trying stores...');
    const result = await supabase
      .from('stores')
      .select('*');
    
    if (result.error) {
      console.error('❌ Error fetching stores:', result.error.message);
      process.exit(1);
    }
    
    storesData = result.data || [];
    storesTableName = 'stores';
  } else if (error) {
    console.error('❌ Error fetching stores:', error.message);
    process.exit(1);
  } else {
    storesData = data || [];
  }
  
  console.log(`✅ Found ${storesData.length} stores in table '${storesTableName}'\n`);
  
  // 3. Categorize each store
  let categorizedCount = 0;
  let uncategorizedCount = 0;
  let alreadyCategorizedCount = 0;
  const updates: Array<{ id: string; categoryId: string; name: string; categoryName: string; tableName: string }> = [];
  
  console.log('🔍 Analyzing stores...\n');
  
  for (const store of storesData) {
    // Get store name (handle both snake_case and camelCase)
    const storeName = store.name || store['Store Name'] || store['store_name'] || '';
    const storeDescription = store.description || store['description'] || '';
    const storeId = store.id;
    
    if (!storeName) {
      console.log(`⏭️  Skipping store without name (ID: ${storeId})`);
      continue;
    }
    
    // Skip if already categorized (unless we want to re-categorize)
    if (store.category_id) {
      alreadyCategorizedCount++;
      console.log(`⏭️  "${storeName}" - Already categorized`);
      continue;
    }
    
    const categoryId = determineCategory(
      storeName,
      storeDescription,
      categoryMap
    );
    
    if (categoryId) {
      const categoryName = [...categoryMap.entries()].find(([_, id]) => id === categoryId)?.[0] || 'Unknown';
      updates.push({
        id: storeId,
        categoryId,
        name: storeName,
        categoryName,
        tableName: storesTableName
      });
      categorizedCount++;
      console.log(`✅ "${storeName}" → ${categoryName}`);
    } else {
      uncategorizedCount++;
      console.log(`❌ "${storeName}" - No matching category found`);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   - Already categorized: ${alreadyCategorizedCount}`);
  console.log(`   - Successfully categorized: ${categorizedCount}`);
  console.log(`   - Could not categorize: ${uncategorizedCount}`);
  console.log(`   - Total stores: ${storesData?.length || 0}\n`);
  
  // 4. Update stores in Supabase
  if (updates.length > 0) {
    console.log(`💾 Updating ${updates.length} stores in database...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    const tableName = updates[0].tableName; // All updates use same table
    
    for (const update of updates) {
      try {
        const { error } = await supabase
          .from(tableName)
          .update({ category_id: update.categoryId })
          .eq('id', update.id);
        
        if (error) {
          console.error(`❌ Error updating "${update.name}":`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Updated "${update.name}" → ${update.categoryName}`);
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ Error updating "${update.name}":`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n✨ Update Summary:');
    console.log(`   - Successfully updated: ${successCount}`);
    console.log(`   - Failed: ${errorCount}`);
  } else {
    console.log('ℹ️  No stores to update.');
  }
  
  console.log('\n🎉 Auto-categorization complete!');
}

main().catch(console.error);


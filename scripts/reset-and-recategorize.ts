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

// MASSIVE category keywords with actual brand names
const categoryKeywords: Record<string, string[]> = {
  'Fashion & Clothing': [
    'fashion', 'clothing', 'apparel', 'boutique', 'wardrobe', 
    // More specific terms
    'jeans', 't-shirt', 'tshirt', 'dresses', 'suits', 'eyewear', 'glasses',
    // Brands (SPECIFIC fashion brands)
    'zara', 'diesel', 'old navy', 'marks & spencer', 'spencer',
    'begg shoes', 'cat footwear', 'journeys', 'headline shirts', 'my face t-shirt',
    'lee jeans', 'h&m', 'gap', 'forever21', 'uniqlo', 'topshop', 'asos',
    'gucci', 'prada', 'versace', 'burberry', 'calvin klein', 'tommy',
    'levi', 'polo', 'armani', 'hugo boss', 'lacoste', 'vans', 'converse',
    'skechers', 'timberland', 'clarks', 'crocs', 'ugg', 'steve madden',
    'aldo', 'payless', 'foot locker', 'ecco', 'farah', 'siwy',
    'eileen fisher', 'j.crew', 'jcrew', 'neon beach', 'smartbuyglasses',
    'girlfriend collective', 'luiza barcelos', 'aanya linen'
  ],
  'Electronics & Tech': [
    'electronics', 'tech', 'computer', 'laptop', 'phone', 'mobile', 'tablet',
    'gadget', 'gaming', 'console', 'camera', 'audio', 'headphone',
    // Brands  
    'apple', 'samsung', 'xiaomi', 'mi pakistan', 'sony', 'lg', 'dell', 'hp',
    'lenovo', 'asus', 'acer', 'microsoft', 'intel', 'amd', 'nvidia',
    'best buy', 'newegg', 'micro center', 'fry', 'currys', 'pc world',
    'huawei', 'oneplus', 'google', 'pixel', 'motorola', 'nokia'
  ],
  'Home & Garden': [
    'home', 'furniture', 'decor', 'garden', 'house', 'kitchen', 'bath', 'bedroom',
    'living', 'dining', 'outdoor', 'patio', 'lawn', 'plant', 'succulent', 'linen',
    // Brands
    'ikea', 'warehouse', 'furniture@work', 'home depot', 'lowes', 'wayfair',
    'bed bath & beyond', 'target', 'walmart', 'pottery barn', 'west elm',
    'crate and barrel', 'williams sonoma', 'homegoods', 'pier 1', 'world market',
    'dunelm', 'colourwarehouse', 'hawkins new york', 'shop succulents'
  ],
  'Beauty & Health': [
    'beauty', 'cosmetics', 'makeup', 'skincare', 'skin care', 'hair', 'salon',
    'spa', 'wellness', 'health', 'fragrance', 'perfume', 'cologne', 'nails', 'lash',
    // Brands
    'juara', 'adore beauty', 'jamie makeup', 'dcl skincare', 'revolution beauty',
    'perfume shop', 'sephora', 'ulta', 'mac', 'nyx', 'maybelline', 'loreal',
    'estee lauder', 'clinique', 'lancome', 'dior', 'chanel', 'glossier',
    'fenty', 'kylie', 'anastasia', 'too faced', 'benefit', 'lush', 
    'body shop', 'bath & body', 'victoria secret', 'bees', 'burt',
    'eczema company', 'lash rehab'
  ],
  'Sports & Outdoors': [
    'sports', 'fitness', 'gym', 'outdoor', 'athletic', 'running', 'cycling',
    'camping', 'hiking', 'climbing', 'fishing', 'hunting', 'golf', 'tennis',
    'sportswear', 'activewear', 'intersports', 'sport shop',
    // Brands
    'mountain warehouse', 'legend footwear', 'dick sporting', 'academy sports',
    'rei', 'cabela', 'bass pro', 'decathlon', 'sports direct', 'jd sports',
    'lululemon', 'athleta', 'gymshark', 'fabletics', 'intersports',
    'new balance', 'nike', 'adidas', 'puma', 'reebok', 'under armour'
  ],
  'Food & Grocery': [
    'food', 'grocery', 'restaurant', 'delivery', 'meal', 'kitchen', 'cook',
    'recipe', 'dining', 'cafe', 'coffee', 'tea', 'pizza', 'burger',
    // Brands
    'foodora', 'gousto', 'red bull', 'drink', 'energy', 'walmart', 'kroger',
    'safeway', 'whole foods', 'trader joe', 'aldi', 'lidl', 'costco',
    'mcdonald', 'burger king', 'kfc', 'subway', 'starbucks', 'dunkin'
  ],
  'Books & Media': [
    'book', 'ebook', 'magazine', 'newspaper', 'reading', 'library', 'author',
    'novel', 'comic', 'manga', 'movie', 'film', 'dvd', 'music', 'cd',
    // Brands
    'amazon books', 'barnes', 'noble', 'waterstones', 'audible', 'kindle',
    'kobo', 'nook', 'scribd', 'bookshop', 'netflix', 'spotify'
  ],
  'Toys & Kids': [
    'toy', 'kids', 'children', 'baby', 'infant', 'toddler', 'nursery',
    'playground', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'fun factory',
    // Brands
    'cherub', 'burts bees baby', 'toys r us', 'fisher-price', 'mattel',
    'hasbro', 'melissa doug', 'build-a-bear', 'disney store', 'carter',
    'gymboree', 'oshkosh', 'gap kids', 'old navy kids', 'children place',
    'three little pigs', 'fun factory'
  ],
  'Automotive': [
    'auto', 'car', 'vehicle', 'motorcycle', 'bike', 'truck', 'parts',
    'tire', 'wheel', 'engine', 'brake', 'oil', 'battery', 'repair',
    // Brands
    'autozone', 'advance auto', 'napa', 'pep boys', 'tire rack',
    'carmax', 'carvana', 'ford', 'chevy', 'toyota', 'honda', 'bmw'
  ],
  'Travel & Hotels': [
    'travel', 'hotel', 'flight', 'airline', 'vacation', 'trip', 'cruise',
    'resort', 'accommodation', 'booking', 'tour', 'tourism', 'airport', 'air',
    // Brands
    'expedia', 'booking', 'hotels.com', 'priceline', 'kayak', 'tripadvisor',
    'airbnb', 'vrbo', 'marriott', 'hilton', 'hyatt', 'ihg', 'cheapoair'
  ],
  'Jewelry & Watches': [
    'jewelry', 'jewellery', 'watch', 'diamond', 'gold', 'silver', 'platinum',
    'ring', 'necklace', 'bracelet', 'earring', 'pendant', 'chain',
    // Brands
    'tiffany', 'cartier', 'bulgari', 'rolex', 'omega', 'pandora',
    'swarovski', 'kay jewelers', 'zales', 'jared', 'blue nile', 'yfn'
  ],
  'Pet Supplies': [
    'pet', 'dog', 'cat', 'puppy', 'kitten', 'animal', 'bird', 'fish',
    'aquarium', 'reptile', 'hamster', 'rabbit', 'guinea pig',
    // Brands
    'mui pet', 'pet chemist', 'chains collar', 'big dog', 'petco', 'petsmart',
    'chewy', 'pet supplies', 'pet store', 'vet', 'veterinary'
  ],
  'Office & Stationery': [
    'office', 'stationery', 'supplies', 'paper', 'pen', 'pencil', 'notebook',
    'planner', 'desk', 'chair', 'printer', 'ink', 'toner',
    // Brands
    'menkind', 'staples', 'office depot', 'officemax', 'viking'
  ]
};

// Generic fallback patterns for unknown brands
const genericPatterns: Record<string, string[]> = {
  'Fashion & Clothing': ['fashion', 'apparel', 'clothing', 'wear', 'dress', 'shirt', 'jeans', 'shoes', 'footwear', 'boots', 'sneakers', 'glasses', 'eyewear', 'sunglasses', 'linen', 'textile', 'fabric', 'collective'],
  'Beauty & Health': ['beauty', 'cosmetics', 'makeup', 'skin', 'hair', 'lash', 'brow', 'nail', 'spa', 'wellness', 'health', 'eczema', 'derma'],
  'Home & Garden': ['home', 'garden', 'furniture', 'decor', 'house', 'kitchen', 'living', 'succulent', 'plant', 'warehouse', 'linen'],
  'Sports & Outdoors': ['sport', 'fitness', 'gym', 'athletic', 'balance', 'active'],
  'Electronics & Tech': ['tech', 'electronics', 'gadget', 'smart', 'digital', '3d'],
  'Travel & Hotels': ['travel', 'flight', 'air', 'hotel', 'vacation', 'trip'],
  'Food & Grocery': ['food', 'restaurant', 'cafe', 'grocery', 'kitchen', 'cook'],
  'Jewelry & Watches': ['jewelry', 'jewellery', 'watch', 'diamond', 'gold', 'silver'],
  'Pet Supplies': ['pet', 'dog', 'cat', 'animal'],
  'Toys & Kids': ['toy', 'kids', 'children', 'baby', 'factory', 'fun factory'],
  'Books & Media': ['book', 'media', 'read', 'publish'],
  'Office & Stationery': ['office', 'stationery', 'writer', 'write', 'paper'],
  'Automotive': ['auto', 'car', 'vehicle', 'motor']
};

function determineCategory(storeName: string, description: string, categoryMap: Map<string, string>): { id: string | null, category: string | null, score: number } {
  const storeNameLower = storeName.toLowerCase();
  const searchText = `${storeName} ${description}`.toLowerCase();
  
  const categoryScores = new Map<string, number>();
  
  // PHASE 1: Exact brand/keyword matching
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    
    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase();
      
      // Exact brand name match
      if (keyword.length > 3) {
        const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
        if (regex.test(storeNameLower)) {
          score += 100;
        }
      }
      // Partial match in store name
      if (storeNameLower.includes(keywordLower) && keywordLower.length > 3) {
        score += 20;
      }
    }
    
    if (score > 0) {
      categoryScores.set(categoryName, score);
    }
  }
  
  // PHASE 2: If no strong match, use generic patterns (FALLBACK)
  if (categoryScores.size === 0 || Math.max(...categoryScores.values()) < 20) {
    for (const [categoryName, patterns] of Object.entries(genericPatterns)) {
      let score = 0;
      
      for (const pattern of patterns) {
        if (storeNameLower.includes(pattern)) {
          score += 10;
        }
        if (searchText.includes(pattern)) {
          score += 5;
        }
      }
      
      if (score > 0) {
        const existingScore = categoryScores.get(categoryName) || 0;
        categoryScores.set(categoryName, existingScore + score);
      }
    }
  }
  
  if (categoryScores.size === 0) {
    return { id: null, category: null, score: 0 };
  }
  
  // Find best category
  let bestCategory = '';
  let bestScore = 0;
  
  for (const [categoryName, score] of categoryScores) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = categoryName;
    }
  }
  
  // Only return if score is above threshold
  if (bestScore < 5) {
    return { id: null, category: null, score: 0 };
  }
  
  const categoryId = categoryMap.get(bestCategory) || null;
  return { id: categoryId, category: bestCategory, score: bestScore };
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
  const failedStores: string[] = [];
  
  for (const store of allStores || []) {
    const storeName = store['Store Name'] || store.name || '';
    const storeDescription = store.description || store.Description || '';
    const storeId = store['Store Id'] || store.id;
    
    if (!storeName) {
      failed++;
      continue;
    }
    
    const result = determineCategory(storeName, storeDescription, categoryMap);
    
    if (result.id && result.score > 0) {
      const { error } = await supabase
        .from(storesTable)
        .update({ category_id: result.id })
        .eq('Store Id', storeId);
      
      if (error) {
        failed++;
        failedStores.push(storeName);
      } else {
        categorized++;
        
        // Show progress every 100 stores
        if (categorized % 100 === 0) {
          console.log(`   ✅ Progress: ${categorized}/${totalStores} categorized...`);
        }
      }
    } else {
      failed++;
      if (failedStores.length < 20) {
        failedStores.push(storeName);
      }
    }
    
    batchCount++;
    
    // Small delay every 100 stores to avoid rate limits
    if (batchCount % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 Complete!\n');
  console.log('📊 Results:');
  console.log(`   ✅ Successfully categorized: ${categorized} stores`);
  console.log(`   ❌ Could not categorize: ${failed} stores`);
  console.log(`   📈 Success rate: ${totalStores > 0 ? Math.round((categorized / totalStores) * 100) : 0}%\n`);
  
  if (failedStores.length > 0) {
    console.log('❌ Sample of stores that could NOT be categorized:');
    failedStores.slice(0, 20).forEach((name, i) => {
      console.log(`   ${i + 1}. ${name}`);
    });
    console.log('\n💡 Tip: These stores have generic/unique names or no matching keywords');
    console.log('   You can manually assign categories from admin panel\n');
  }
  
  console.log('✅ Frontend will now show categories in the navbar dropdown!');
  console.log('   Refresh your website to see the changes\n');
}

main().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});



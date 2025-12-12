/**
 * Seed Categories Script
 * 
 * This script creates sample categories in MongoDB for store categorization
 * Requires the Next.js dev server to be running on http://localhost:3000
 */

// Sample categories with colors and icons
const sampleCategories = [
  {
    name: 'Fashion & Clothing',
    backgroundColor: '#FF6B9D',
    logoUrl: 'https://api.iconify.design/mdi/tshirt-crew.svg?color=%23ffffff'
  },
  {
    name: 'Electronics & Tech',
    backgroundColor: '#4A90E2',
    logoUrl: 'https://api.iconify.design/mdi/laptop.svg?color=%23ffffff'
  },
  {
    name: 'Home & Garden',
    backgroundColor: '#7ED321',
    logoUrl: 'https://api.iconify.design/mdi/home.svg?color=%23ffffff'
  },
  {
    name: 'Beauty & Health',
    backgroundColor: '#F5A623',
    logoUrl: 'https://api.iconify.design/mdi/spa.svg?color=%23ffffff'
  },
  {
    name: 'Sports & Outdoors',
    backgroundColor: '#50E3C2',
    logoUrl: 'https://api.iconify.design/mdi/basketball.svg?color=%23ffffff'
  },
  {
    name: 'Food & Grocery',
    backgroundColor: '#FF5722',
    logoUrl: 'https://api.iconify.design/mdi/food.svg?color=%23ffffff'
  },
  {
    name: 'Books & Media',
    backgroundColor: '#9013FE',
    logoUrl: 'https://api.iconify.design/mdi/book-open-page-variant.svg?color=%23ffffff'
  },
  {
    name: 'Toys & Kids',
    backgroundColor: '#FF4081',
    logoUrl: 'https://api.iconify.design/mdi/toy-brick.svg?color=%23ffffff'
  },
  {
    name: 'Automotive',
    backgroundColor: '#607D8B',
    logoUrl: 'https://api.iconify.design/mdi/car.svg?color=%23ffffff'
  },
  {
    name: 'Travel & Hotels',
    backgroundColor: '#00BCD4',
    logoUrl: 'https://api.iconify.design/mdi/airplane.svg?color=%23ffffff'
  },
  {
    name: 'Jewelry & Watches',
    backgroundColor: '#E91E63',
    logoUrl: 'https://api.iconify.design/mdi/diamond-stone.svg?color=%23ffffff'
  },
  {
    name: 'Pet Supplies',
    backgroundColor: '#8BC34A',
    logoUrl: 'https://api.iconify.design/mdi/paw.svg?color=%23ffffff'
  },
  {
    name: 'Office & Stationery',
    backgroundColor: '#3F51B5',
    logoUrl: 'https://api.iconify.design/mdi/briefcase.svg?color=%23ffffff'
  }
];

async function seedCategories() {
  console.log('🌱 Starting categories seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;
  
  // First, check if categories already exist
  console.log('📂 Checking existing categories...');
  try {
    const response = await fetch('http://localhost:3000/api/categories/get');
    if (!response.ok) {
      console.error('❌ Error: Development server is not running on http://localhost:3000');
      console.log('\n💡 Please run "npm run dev" first in another terminal\n');
      process.exit(1);
    }
    
    const data = await response.json();
    const existingCategories = data.categories || [];
    
    if (existingCategories.length > 0) {
      console.log(`✅ Found ${existingCategories.length} existing categories:`);
      existingCategories.forEach((cat: any) => {
        console.log(`   - ${cat.name}`);
      });
      console.log('\n⚠️  Categories already exist. Do you want to continue? (This will create duplicates)');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
      
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('✅ No existing categories found\n');
    }
  } catch (error) {
    console.error('❌ Error connecting to API:', error);
    console.log('\n💡 Make sure the development server is running: npm run dev\n');
    process.exit(1);
  }
  
  console.log('🚀 Creating categories...\n');
  
  for (const category of sampleCategories) {
    try {
      const response = await fetch('http://localhost:3000/api/categories/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Created: ${category.name}`);
        successCount++;
      } else {
        console.error(`❌ Failed to create ${category.name}: ${data.error || 'Unknown error'}`);
        errorCount++;
      }
    } catch (error: any) {
      console.error(`❌ Error creating ${category.name}:`, error.message);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   ✅ Successfully created: ${successCount}`);
  console.log(`   ❌ Failed: ${errorCount}`);
  console.log(`   ⏭️  Skipped: ${skippedCount}`);
  console.log(`   📝 Total: ${sampleCategories.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Categories seeding complete!');
    console.log('\n📝 Next step: Run the auto-categorization script:');
    console.log('   npm run categorize:stores\n');
  } else {
    console.log('\n⚠️  No categories were created. Please check the errors above.\n');
  }
}

// Run the seeding
seedCategories().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});


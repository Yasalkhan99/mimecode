/**
 * Helper script to format FIREBASE_ADMIN_SA for .env.local
 * 
 * Usage:
 * 1. Place your service account JSON file in the project root
 * 2. Run: node scripts/fix-env-format.js path/to/service-account.json
 * 3. Copy the output and paste it into .env.local
 */

const fs = require('fs');
const path = require('path');

const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.error('❌ Please provide the path to your service account JSON file');
  console.log('\nUsage: node scripts/fix-env-format.js path/to/service-account.json');
  process.exit(1);
}

try {
  // Read the JSON file
  const jsonContent = fs.readFileSync(path.resolve(jsonFilePath), 'utf8');
  const serviceAccount = JSON.parse(jsonContent);
  
  // Validate required fields
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    console.error('❌ Invalid service account JSON: missing required fields');
    process.exit(1);
  }
  
  // Ensure private_key has proper newline formatting
  // Replace actual newlines with \n escape sequences for environment variable
  const formattedPrivateKey = serviceAccount.private_key
    .replace(/\r\n/g, '\\n')
    .replace(/\n/g, '\\n');
  
  // Create formatted JSON string
  const formattedServiceAccount = {
    ...serviceAccount,
    private_key: formattedPrivateKey
  };
  
  // Convert to JSON string
  const envValue = JSON.stringify(formattedServiceAccount);
  
  console.log('\n✅ Formatted FIREBASE_ADMIN_SA:\n');
  console.log('─'.repeat(80));
  console.log('\n📋 For .env.local (with quotes):');
  console.log(`FIREBASE_ADMIN_SA='${envValue.replace(/'/g, "\\'")}'`);
  console.log('\n📋 For Vercel Environment Variables (NO quotes, paste directly):');
  console.log('─'.repeat(80));
  console.log(envValue);
  console.log('─'.repeat(80));
  console.log('\n💡 Important for Vercel:');
  console.log('   1. Copy the value WITHOUT quotes');
  console.log('   2. Paste it directly into Vercel Environment Variable');
  console.log('   3. Do NOT add quotes around it\n');
  
} catch (error) {
  console.error('❌ Error processing file:', error.message);
  process.exit(1);
}


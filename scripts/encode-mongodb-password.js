// Script to URL encode MongoDB password
// Usage: node scripts/encode-mongodb-password.js

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 MongoDB Password URL Encoder\n');

rl.question('Enter your MongoDB password: ', (password) => {
  // URL encode special characters
  const encoded = encodeURIComponent(password);
  
  console.log('\n✅ Encoded Password:');
  console.log(encoded);
  console.log('\n📝 Use this in your connection string:');
  console.log(`mongodb+srv://yasalkhan90:${encoded}@cluster0.0pqbi.mongodb.net/mimecode?retryWrites=true&w=majority&appName=Cluster0`);
  console.log('\n💡 Copy the connection string above and update .env.local');
  
  rl.close();
});


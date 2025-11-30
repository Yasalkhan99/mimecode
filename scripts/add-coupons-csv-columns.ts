/**
 * Add CSV Headers as Columns to Supabase Coupons Table
 * 
 * This script reads Coupons.csv headers and adds them as columns to Supabase coupons table
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Read CSV headers - read first line only
const csvContent = readFileSync('public/Coupons.csv', 'utf-8');
const lines = csvContent.split('\n').filter(l => l.trim());
const firstLine = lines[0].trim();

// Parse CSV headers properly (handle quoted values)
const headers: string[] = [];
let currentHeader = '';
let inQuotes = false;

for (let i = 0; i < firstLine.length; i++) {
  const char = firstLine[i];
  if (char === '"') {
    inQuotes = !inQuotes;
  } else if (char === ',' && !inQuotes) {
    headers.push(currentHeader.trim());
    currentHeader = '';
  } else {
    currentHeader += char;
  }
}
if (currentHeader.trim()) {
  headers.push(currentHeader.trim());
}

console.log('Headers extracted:', headers.length);

// Read first data row for sample values
const firstDataLine = lines[1] || '';
const sampleRow: string[] = [];
currentHeader = '';
inQuotes = false;

for (let i = 0; i < firstDataLine.length; i++) {
  const char = firstDataLine[i];
  if (char === '"') {
    inQuotes = !inQuotes;
  } else if (char === ',' && !inQuotes) {
    sampleRow.push(currentHeader.trim());
    currentHeader = '';
  } else {
    currentHeader += char;
  }
}
if (currentHeader.trim()) {
  sampleRow.push(currentHeader.trim());
}
console.log('📋 CSV Headers found:', headers.length);
headers.forEach((h, i) => {
  console.log(`  ${i + 1}. "${h}"`);
});

// Get data type based on header name and sample data
function getDataType(header: string, sampleValue: any): string {
  const lower = header.toLowerCase();
  
  // Check sample value if available
  if (sampleValue) {
    const val = String(sampleValue).trim();
    if (val && !isNaN(Number(val)) && val !== '') {
      if (lower.includes('id') || lower.includes('priority')) return 'TEXT'; // IDs can be text
      if (lower.includes('date') || lower.includes('expiry')) return 'TEXT'; // Dates as text for CSV
      return 'INTEGER';
    }
    if (val.match(/^\d{4}-\d{2}-\d{2}/)) return 'TEXT'; // Date format YYYY-MM-DD
    if (val.match(/\d{2}-\d{2}-\d{4}/)) return 'TEXT'; // Date format DD-MM-YYYY
  }
  
  // Default based on header name
  if (lower.includes('id') && !lower.includes('url') && !lower.includes('link')) return 'TEXT';
  if (lower.includes('date') || lower.includes('expiry')) return 'TEXT'; // TEXT for CSV dates
  if (lower.includes('priority') || lower.includes('coupons')) return 'INTEGER';
  if (lower.includes('type') || lower.includes('status')) return 'TEXT';
  return 'TEXT'; // Default to TEXT for CSV compatibility
}

// Generate SQL ALTER TABLE statements
console.log('\n🔧 Generating SQL migration...\n');

const alterStatements: string[] = [];
const existingColumns = new Set([
  'id', 'code', 'store_name', 'store_ids', 'discount', 'discount_type', 'description',
  'is_active', 'max_uses', 'current_uses', 'expiry_date', 'logo_url', 'url',
  'coupon_type', 'is_popular', 'layout_position', 'is_latest', 'latest_layout_position',
  'category_id', 'button_text', 'deal_scope', 'created_at', 'updated_at'
]);

// Function to escape column names with spaces and special characters
function escapeColumnName(name: string): string {
  // PostgreSQL quoted identifier - preserve exact name including spaces
  return `"${name.replace(/"/g, '""')}"`;
}

headers.forEach((header, index) => {
  // Use exact CSV header name with quotes for columns with spaces
  const columnName = escapeColumnName(header);
  const sampleValue = sampleRow[index] || null;
  const dataType = getDataType(header, sampleValue);
  
  // Skip if column already exists (case-insensitive check needed)
  const normalizedHeader = header.toLowerCase().replace(/\s+/g, '_');
  const existingMatch = Array.from(existingColumns).some(existing => 
    existing.toLowerCase() === normalizedHeader
  );
  
  if (existingMatch) {
    console.log(`⏭️  Skipping ${header} (similar column exists)`);
    return;
  }
  
  alterStatements.push(`ALTER TABLE coupons ADD COLUMN IF NOT EXISTS ${columnName} ${dataType} NULL;`);
  console.log(`✅ Adding: ${columnName} (${dataType}) - from "${header}"`);
});

console.log('\n📝 SQL Migration:\n');
console.log(alterStatements.join('\n'));

// Write to file
import { writeFileSync } from 'fs';
writeFileSync('scripts/coupons_csv_columns_migration.sql', alterStatements.join('\n') + '\n');
console.log('\n✅ SQL migration saved to: scripts/coupons_csv_columns_migration.sql');

console.log(`\n📊 Summary:`);
console.log(`- Total CSV headers: ${headers.length}`);
console.log(`- Columns to add: ${alterStatements.length}`);
console.log(`- Columns skipped: ${headers.length - alterStatements.length}`);


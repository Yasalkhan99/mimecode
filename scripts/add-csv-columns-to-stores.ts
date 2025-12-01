/**
 * Add CSV Headers as Columns to Supabase Stores Table
 * 
 * This script reads CSV headers and adds them as columns to Supabase stores table
 */

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

// Read CSV headers
const csvContent = readFileSync('public/Stores.csv', 'utf-8');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  bom: true,
  to_line: 1,
});

const headers = Object.keys(records[0] || {});
console.log('📋 CSV Headers found:', headers);

// Convert header name to SQL column name (snake_case, handle special cases)
function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Determine SQL data type based on column name and sample data
function getDataType(header: string, sampleValue: any): string {
  const lower = header.toLowerCase();
  
  // ID columns
  if (lower.includes('id') || lower === 'store id' || lower === 'merchant id') {
    return 'TEXT';
  }
  
  // Boolean columns
  if (lower.includes('is ') || lower.includes('active') || lower.includes('inactive') || 
      lower === 'is featured' || lower === 'is logo' || lower === 'is banner' || lower === 'is api') {
    return 'BOOLEAN';
  }
  
  // Date columns
  if (lower.includes('date') || lower.includes('updated')) {
    return 'TIMESTAMPTZ';
  }
  
  // Numeric columns
  if (lower.includes('priority') || lower.includes('views') || lower.includes('coupons') || 
      lower.includes('total')) {
    return 'INTEGER';
  }
  
  // URL columns
  if (lower.includes('url') || lower.includes('logo') || lower.includes('banner') || 
      lower.includes('display') || lower.includes('tracking')) {
    return 'TEXT';
  }
  
  // Email, Phone
  if (lower === 'email' || lower === 'phone') {
    return 'TEXT';
  }
  
  // Social media
  if (lower.includes('fb') || lower.includes('twitter') || lower.includes('youtube') || 
      lower.includes('gplus')) {
    return 'TEXT';
  }
  
  // Default to TEXT for everything else
  return 'TEXT';
}

// Generate SQL ALTER TABLE statements
console.log('\n🔧 Generating SQL migration...\n');

const alterStatements: string[] = [];
const existingColumns = new Set([
  'id', 'name', 'sub_store_name', 'slug', 'description', 'logo_url', 'voucher_text',
  'network_id', 'is_trending', 'layout_position', 'category_id', 'website_url',
  'about_text', 'features', 'shipping_info', 'return_policy', 'contact_info',
  'trust_score', 'established_year', 'headquarters', 'created_at', 'updated_at'
]);

headers.forEach(header => {
  const columnName = toSnakeCase(header);
  const dataType = getDataType(header, null);
  
  // Skip if column already exists
  if (existingColumns.has(columnName)) {
    console.log(`⏭️  Skipping ${columnName} (already exists)`);
    return;
  }
  
  const nullable = dataType === 'TEXT' || dataType === 'INTEGER' ? 'NULL' : '';
  alterStatements.push(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS ${columnName} ${dataType}${nullable ? ' ' + nullable : ''};`);
  console.log(`✅ Adding: ${columnName} (${dataType}) - from "${header}"`);
});

console.log('\n📝 SQL Migration:\n');
console.log('--'.repeat(40));
console.log(alterStatements.join('\n'));
console.log('--'.repeat(40));

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('scripts/add_csv_columns_migration.sql', alterStatements.join('\n'));
console.log('\n✅ SQL saved to: scripts/add_csv_columns_migration.sql');


/**
 * Create Supabase columns from CSV headers
 */

// CSV Headers from Stores.csv
const csvHeaders = [
  'Store Id',
  'Store Name',
  'Slug',
  'Merchant Id',
  'Network Id',
  'Store Logo',
  'Store Display Url',
  'Store Summary',
  'Store Description',
  'Tracking Url',
  'Cate Ids',
  'Comment',
  'Address',
  'Phone',
  'Email',
  'Fb Url',
  'Twitter Url',
  'Youtube',
  'Gplus',
  'Is Featured',
  'Store Priority',
  'Status',
  'Created Date',
  'Created By',
  'Modify Date',
  'Modify By',
  'Is Logo',
  'Parent Category Id',
  'Parent Category Name',
  'Store Banner',
  'Is Banner',
  'Total Views',
  'Total Coupons',
  'Active',
  'Inactive',
  'Last Updated',
  'Is API'
];

// Convert to snake_case
function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/\//g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Get data type
function getDataType(header: string): string {
  const lower = header.toLowerCase();
  
  if (lower.includes('id') && !lower.includes('url')) {
    return 'TEXT';
  }
  if (lower.includes('is ') || lower === 'active' || lower === 'inactive') {
    return 'BOOLEAN';
  }
  if (lower.includes('date') || lower.includes('updated')) {
    return 'TIMESTAMPTZ';
  }
  if (lower.includes('priority') || lower.includes('views') || lower.includes('coupons') || lower.includes('total')) {
    return 'INTEGER';
  }
  return 'TEXT';
}

// Map CSV headers to column definitions
const columnDefinitions = csvHeaders.map(header => ({
  original: header,
  columnName: toSnakeCase(header),
  dataType: getDataType(header),
}));

console.log('📋 CSV Headers → Supabase Columns:\n');
columnDefinitions.forEach(({ original, columnName, dataType }) => {
  console.log(`${original.padEnd(30)} → ${columnName.padEnd(30)} (${dataType})`);
});

// Generate SQL
const existingColumns = [
  'id', 'name', 'sub_store_name', 'slug', 'description', 'logo_url', 'voucher_text',
  'network_id', 'is_trending', 'layout_position', 'category_id', 'website_url',
  'about_text', 'features', 'shipping_info', 'return_policy', 'contact_info',
  'trust_score', 'established_year', 'headquarters', 'created_at', 'updated_at'
];

const newColumns = columnDefinitions.filter(col => !existingColumns.includes(col.columnName));

console.log(`\n\n📊 Summary:`);
console.log(`   Total CSV headers: ${csvHeaders.length}`);
console.log(`   Existing columns: ${existingColumns.length}`);
console.log(`   New columns to add: ${newColumns.length}\n`);

// Generate ALTER TABLE statements
const sqlStatements = newColumns.map(col => {
  const nullable = col.dataType === 'TEXT' || col.dataType === 'INTEGER' ? ' NULL' : '';
  return `ALTER TABLE stores ADD COLUMN IF NOT EXISTS ${col.columnName} ${col.dataType}${nullable};`;
});

console.log('🔧 SQL Migration:\n');
console.log('-- Add columns from CSV headers\n');
console.log(sqlStatements.join('\n'));

// Save to file
import { writeFileSync } from 'fs';
writeFileSync('scripts/csv_columns_migration.sql', sqlStatements.join('\n'));
console.log('\n\n✅ SQL saved to: scripts/csv_columns_migration.sql');


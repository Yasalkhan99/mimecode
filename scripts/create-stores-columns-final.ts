/**
 * Create Supabase columns from CSV headers with proper mapping
 */

// CSV Headers from Stores.csv
const csvHeaders = [
  'Store Id', 'Store Name', 'Slug', 'Merchant Id', 'Network Id',
  'Store Logo', 'Store Display Url', 'Store Summary', 'Store Description',
  'Tracking Url', 'Cate Ids', 'Comment', 'Address', 'Phone', 'Email',
  'Fb Url', 'Twitter Url', 'Youtube', 'Gplus', 'Is Featured',
  'Store Priority', 'Status', 'Created Date', 'Created By',
  'Modify Date', 'Modify By', 'Is Logo', 'Parent Category Id',
  'Parent Category Name', 'Store Banner', 'Is Banner',
  'Total Views', 'Total Coupons', 'Active', 'Inactive',
  'Last Updated', 'Is API'
];

// Map CSV headers to existing Supabase columns (if they exist)
const columnMapping: Record<string, string> = {
  'Store Name': 'name', // Already exists
  'Slug': 'slug', // Already exists
  'Network Id': 'network_id', // Already exists
  'Store Description': 'description', // Already exists
  'Store Logo': 'logo_url', // Already exists
  'Store Display Url': 'website_url', // Already exists
  'Parent Category Id': 'category_id', // Already exists
  'Store Priority': 'layout_position', // Already exists
  'Is Featured': 'is_trending', // Already exists
  'Created Date': 'created_at', // Already exists
  'Modify Date': 'updated_at', // Already exists
};

function toSnakeCase(str: string): string {
  return str
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase()
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function getDataType(header: string): string {
  const lower = header.toLowerCase();
  if (lower.includes('id') && !lower.includes('url')) return 'TEXT';
  if (lower.includes('is ') || lower === 'active' || lower === 'inactive') return 'BOOLEAN';
  if (lower.includes('date') || lower.includes('updated')) return 'TIMESTAMPTZ';
  if (lower.includes('priority') || lower.includes('views') || lower.includes('coupons') || lower.includes('total')) return 'INTEGER';
  return 'TEXT';
}

const existingColumns = new Set([
  'id', 'name', 'sub_store_name', 'slug', 'description', 'logo_url', 'voucher_text',
  'network_id', 'is_trending', 'layout_position', 'category_id', 'website_url',
  'about_text', 'features', 'shipping_info', 'return_policy', 'contact_info',
  'trust_score', 'established_year', 'headquarters', 'created_at', 'updated_at'
]);

const newColumns: Array<{csvHeader: string, columnName: string, dataType: string}> = [];

csvHeaders.forEach(header => {
  // Check if mapped to existing column
  if (columnMapping[header]) {
    const mappedCol = columnMapping[header];
    if (existingColumns.has(mappedCol)) {
      console.log(`✅ "${header}" → ${mappedCol} (already exists)`);
      return;
    }
  }
  
  // Get column name
  const columnName = columnMapping[header] || toSnakeCase(header);
  
  // Skip if already exists
  if (existingColumns.has(columnName)) {
    console.log(`✅ "${header}" → ${columnName} (already exists)`);
    return;
  }
  
  const dataType = getDataType(header);
  newColumns.push({ csvHeader: header, columnName, dataType });
  console.log(`➕ "${header}" → ${columnName} (${dataType})`);
});

console.log(`\n📊 Summary:`);
console.log(`   Total CSV headers: ${csvHeaders.length}`);
console.log(`   Mapped to existing: ${Object.keys(columnMapping).length}`);
console.log(`   New columns to add: ${newColumns.length}\n`);

// Generate SQL
const sqlStatements = newColumns.map(col => {
  const nullable = col.dataType === 'TEXT' || col.dataType === 'INTEGER' ? ' NULL' : '';
  return `ALTER TABLE stores ADD COLUMN IF NOT EXISTS ${col.columnName} ${col.dataType}${nullable};`;
});

console.log('🔧 SQL Migration:\n');
console.log('-- Add columns from CSV headers\n');
console.log(sqlStatements.join('\n'));

import { writeFileSync } from 'fs';
writeFileSync('scripts/stores_csv_columns_migration.sql', sqlStatements.join('\n'));
console.log('\n✅ SQL saved to: scripts/stores_csv_columns_migration.sql');


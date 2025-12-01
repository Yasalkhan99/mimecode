/**
 * Add exact CSV header columns to Supabase stores table
 * Uses quoted identifiers for columns with spaces
 */

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

// Columns that already exist (from table check)
const existingColumns = new Set([
  'Store Id', 'Store Name', 'Slug', 'Network Id', 'Store Logo'
]);

function getDataType(header: string): string {
  const lower = header.toLowerCase();
  if (lower.includes('id') && !lower.includes('url')) return 'TEXT';
  if (lower.includes('is ') || lower === 'active' || lower === 'inactive') return 'BOOLEAN';
  if (lower.includes('date') || lower.includes('updated')) return 'TIMESTAMPTZ';
  if (lower.includes('priority') || lower.includes('views') || lower.includes('coupons') || lower.includes('total')) return 'INTEGER';
  return 'TEXT';
}

function escapeColumnName(name: string): string {
  // PostgreSQL quoted identifier
  return `"${name.replace(/"/g, '""')}"`;
}

const newColumns = csvHeaders.filter(header => !existingColumns.has(header));

console.log('📋 Adding CSV header columns to stores table...\n');

const sqlStatements = newColumns.map(header => {
  const dataType = getDataType(header);
  const nullable = dataType === 'TEXT' || dataType === 'INTEGER' ? ' NULL' : '';
  const quotedName = escapeColumnName(header);
  return `ALTER TABLE stores ADD COLUMN IF NOT EXISTS ${quotedName} ${dataType}${nullable};`;
});

console.log(`Total CSV headers: ${csvHeaders.length}`);
console.log(`Already exist: ${existingColumns.size}`);
console.log(`New columns to add: ${newColumns.length}\n`);

console.log('🔧 SQL Migration:\n');
console.log('-- Add columns with exact CSV header names\n');
console.log(sqlStatements.join('\n'));

import { writeFileSync } from 'fs';
writeFileSync('scripts/add_exact_csv_headers.sql', sqlStatements.join('\n'));
console.log('\n✅ SQL saved to: scripts/add_exact_csv_headers.sql');


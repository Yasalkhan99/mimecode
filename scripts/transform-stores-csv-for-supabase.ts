/**
 * Transform Stores.csv to match Supabase column names
 * Converts CSV headers to snake_case and maps data
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// CSV header to Supabase column mapping
const HEADER_MAPPING: Record<string, string> = {
  'Store Id': 'store_id',
  'Store Name': 'name', // Maps to existing 'name' column
  'Slug': 'slug', // Already exists
  'Merchant Id': 'merchant_id',
  'Network Id': 'network_id', // Already exists
  'Store Logo': 'logo_url', // Maps to existing 'logo_url'
  'Store Display Url': 'website_url', // Maps to existing 'website_url'
  'Store Summary': 'store_summary',
  'Store Description': 'description', // Maps to existing 'description'
  'Tracking Url': 'tracking_url',
  'Cate Ids': 'cate_ids',
  'Comment': 'comment',
  'Address': 'address',
  'Phone': 'phone',
  'Email': 'email',
  'Fb Url': 'fb_url',
  'Twitter Url': 'twitter_url',
  'Youtube': 'youtube',
  'Gplus': 'gplus',
  'Is Featured': 'is_trending', // Maps to existing 'is_trending'
  'Store Priority': 'layout_position', // Maps to existing 'layout_position'
  'Status': 'status',
  'Created Date': 'created_at', // Maps to existing 'created_at'
  'Created By': 'created_by',
  'Modify Date': 'updated_at', // Maps to existing 'updated_at'
  'Modify By': 'modify_by',
  'Is Logo': 'is_logo',
  'Parent Category Id': 'category_id', // Maps to existing 'category_id'
  'Parent Category Name': 'parent_category_name',
  'Store Banner': 'store_banner',
  'Is Banner': 'is_banner',
  'Total Views': 'total_views',
  'Total Coupons': 'total_coupons',
  'Active': 'active',
  'Inactive': 'inactive',
  'Last Updated': 'last_updated',
  'Is API': 'is_api',
};

function transformBoolean(value: string): boolean | null {
  if (!value) return null;
  const lower = value.toString().toLowerCase().trim();
  if (lower === '1' || lower === 'yes' || lower === 'true' || lower === 'y' || lower === 'enable') {
    return true;
  }
  if (lower === '0' || lower === 'no' || lower === 'false' || lower === 'n' || lower === 'disable') {
    return false;
  }
  return null;
}

function transformDate(value: string): string | null {
  if (!value || value.trim() === '') return null;
  try {
    // Handle different date formats
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function transformNumber(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
}

function main() {
  const inputFile = 'public/Stores.csv';
  const outputFile = 'public/Stores-Supabase.csv';

  try {
    console.log(`📖 Reading CSV: ${inputFile}`);
    
    const fileContent = readFileSync(inputFile, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    }) as any[];

    console.log(`📊 Found ${records.length} rows`);

    // Transform records
    const transformedRecords = records.map((row, index) => {
      const transformed: any = {};

      // Transform each CSV column
      Object.entries(HEADER_MAPPING).forEach(([csvHeader, supabaseColumn]) => {
        const value = row[csvHeader];
        
        if (value !== undefined && value !== null && value.toString().trim() !== '') {
          let transformedValue: any = value;

          // Transform based on column type
          if (supabaseColumn === 'is_trending' || supabaseColumn === 'is_logo' || 
              supabaseColumn === 'is_banner' || supabaseColumn === 'active' || 
              supabaseColumn === 'inactive' || supabaseColumn === 'is_api') {
            transformedValue = transformBoolean(value);
          } else if (supabaseColumn === 'created_at' || supabaseColumn === 'updated_at' || 
                     supabaseColumn === 'last_updated') {
            transformedValue = transformDate(value);
          } else if (supabaseColumn === 'layout_position' || supabaseColumn === 'total_views' || 
                     supabaseColumn === 'total_coupons') {
            transformedValue = transformNumber(value);
          }

          // Handle multiple mappings (Store Description vs Store Summary)
          if (supabaseColumn === 'description' && transformed.description) {
            // Already has description from Store Description
          } else {
            transformed[supabaseColumn] = transformedValue;
          }
        }
      });

      // Priority: Store Description > Store Summary for description field
      if (row['Store Description'] && row['Store Description'].trim()) {
        transformed.description = row['Store Description'];
      } else if (row['Store Summary'] && row['Store Summary'].trim()) {
        transformed.description = row['Store Summary'];
      }

      return transformed;
    });

    // Get all columns used
    const allColumns = new Set<string>();
    transformedRecords.forEach(record => {
      Object.keys(record).forEach(key => allColumns.add(key));
    });

    // Sort columns: required first, then optional
    const requiredColumns = ['name', 'description'];
    const optionalColumns = Array.from(allColumns).filter(col => !requiredColumns.includes(col)).sort();
    const columnOrder = [...requiredColumns, ...optionalColumns];

    // Create output CSV
    const output = stringify(transformedRecords, {
      header: true,
      columns: columnOrder,
    });

    writeFileSync(outputFile, output, 'utf-8');

    console.log(`\n✅ Transformed CSV saved: ${outputFile}`);
    console.log(`📋 Columns: ${columnOrder.length} columns`);
    console.log(`   Required: ${requiredColumns.join(', ')}`);
    console.log(`   Optional: ${optionalColumns.length} additional columns`);
    console.log(`✅ ${transformedRecords.length} rows transformed successfully!`);
    console.log(`\n🚀 Ab is file ko Supabase mein import kar sakte ho!`);

  } catch (error) {
    console.error('❌ Error transforming CSV:', error);
    process.exit(1);
  }
}

main();


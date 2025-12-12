/**
 * CSV Transformation Script
 * 
 * Transforms old CSV format to Supabase stores table format
 * 
 * Usage:
 *   npx tsx scripts/transform-stores-csv.ts input.csv output.csv
 */

import { readFileSync, writeFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

// Column mapping: Old CSV Column → New Supabase Column
const COLUMN_MAPPING: Record<string, string> = {
  'Store Name': 'name',
  'Slug': 'slug',
  'Store Description': 'description',
  'Store Summary': 'description', // Fallback if Store Description is empty
  'Store Logo': 'logo_url',
  'Network Id': 'network_id',
  'Store Display Url': 'website_url',
  'Tracking Url': 'url', // Optional
  'Cate Ids': 'category_id',
  'Parent Category Id': 'category_id', // Alternative
  'Comment': 'about_text',
  'Address': 'headquarters',
  'Is Featured': 'is_trending',
  'Store Priority': 'layout_position',
  'Created Date': 'created_at',
  'Modify Date': 'updated_at',
  'Status': 'status', // Will be converted to is_active
  'Active': 'is_active',
};

// Required columns in Supabase
const REQUIRED_COLUMNS = ['name', 'description'];

function transformBoolean(value: string): string {
  if (!value) return 'false';
  const lower = value.toString().toLowerCase().trim();
  if (lower === '1' || lower === 'yes' || lower === 'true' || lower === 'y') {
    return 'true';
  }
  return 'false';
}

function transformDate(value: string): string | null {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

function transformNumber(value: string): string | null {
  if (!value) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num.toString();
}

function combineContactInfo(phone?: string, email?: string): string | null {
  const parts: string[] = [];
  if (phone) parts.push(`Phone: ${phone}`);
  if (email) parts.push(`Email: ${email}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('❌ Usage: npx tsx scripts/transform-stores-csv.ts <input.csv> <output.csv>');
    process.exit(1);
  }

  const inputFile = args[0];
  const outputFile = args[1];

  try {
    console.log(`📖 Reading CSV: ${inputFile}`);
    
    // Read and parse CSV
    const fileContent = readFileSync(inputFile, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
    }) as any[];

    console.log(`📊 Found ${records.length} rows`);

    // Transform data
    const transformedRecords = records.map((row, index) => {
      const transformed: any = {};

      // Map columns
      for (const [oldCol, newCol] of Object.entries(COLUMN_MAPPING)) {
        if (row[oldCol] !== undefined && row[oldCol] !== '') {
          let value = row[oldCol];

          // Transform based on column type
          if (newCol === 'is_trending' || newCol === 'is_active') {
            value = transformBoolean(value);
          } else if (newCol === 'created_at' || newCol === 'updated_at') {
            value = transformDate(value);
          } else if (newCol === 'layout_position' || newCol === 'trust_score' || newCol === 'established_year') {
            value = transformNumber(value);
          }

          // Handle duplicate mappings (Store Description vs Store Summary)
          if (newCol === 'description' && transformed.description) {
            // Already has description, skip
          } else {
            transformed[newCol] = value;
          }
        }
      }

      // Handle Store Description vs Store Summary priority
      if (row['Store Description']) {
        transformed.description = row['Store Description'];
      } else if (row['Store Summary']) {
        transformed.description = row['Store Summary'];
      }

      // Combine contact info
      const contactInfo = combineContactInfo(row['Phone'], row['Email']);
      if (contactInfo) {
        transformed.contact_info = contactInfo;
      }

      // Ensure required columns
      for (const col of REQUIRED_COLUMNS) {
        if (!transformed[col]) {
          transformed[col] = '';
        }
      }

      return transformed;
    });

    // Get all unique columns
    const allColumns = new Set<string>();
    transformedRecords.forEach(record => {
      Object.keys(record).forEach(key => allColumns.add(key));
    });

    // Create output CSV
    const output = stringify(transformedRecords, {
      header: true,
      columns: Array.from(allColumns),
    });

    writeFileSync(outputFile, output, 'utf-8');

    console.log(`✅ Transformed CSV saved: ${outputFile}`);
    console.log(`📋 Columns: ${Array.from(allColumns).join(', ')}`);
    console.log(`✅ ${transformedRecords.length} rows transformed successfully!`);

  } catch (error) {
    console.error('❌ Error transforming CSV:', error);
    process.exit(1);
  }
}

main();


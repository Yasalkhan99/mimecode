import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ success: false, error: 'Supabase admin client not initialized' }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Read file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let jsonData: any[] = [];

    // Handle CSV or Excel
    if (file.name.endsWith('.csv')) {
      // Handle CSV
      const text = buffer.toString('utf-8');
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return NextResponse.json({ success: false, error: 'CSV file must have at least a header and one data row' }, { status: 400 });
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: any = {};
        headers.forEach((header, idx) => {
          row[header] = values[idx] || '';
        });
        if (row.slug || row.url || row['logo url'] || row.logourl) {
          jsonData.push(row);
        }
      }
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Handle Excel
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      jsonData = XLSX.utils.sheet_to_json(worksheet);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid file type. Please upload CSV or Excel file' }, { status: 400 });
    }

    if (jsonData.length === 0) {
      return NextResponse.json({ success: false, error: 'No data found in file' }, { status: 400 });
    }

    console.log(`📊 Processing ${jsonData.length} rows for bulk logo upload`);

    let successCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      try {
        // Get slug or URL from various possible column names (case-insensitive)
        const slug = (
          row['Slug'] || row['slug'] || row['Store Slug'] || row['store_slug'] || 
          row['store slug'] || row['StoreSlug'] || ''
        ).toString().trim();
        
        const url = (
          row['URL'] || row['url'] || row['Store URL'] || row['store_url'] || 
          row['store url'] || row['StoreURL'] || row['Website URL'] || row['website_url'] || 
          row['website url'] || row['WebsiteURL'] || row['Store Display Url'] || ''
        ).toString().trim();
        
        const logoUrl = (
          row['Logo URL'] || row['logo_url'] || row['logo url'] || row['LogoURL'] || 
          row['Logo'] || row['logo'] || row['LogoUrl'] || row['logoUrl'] || ''
        ).toString().trim();

        if (!logoUrl) {
          failedCount++;
          errors.push(`Row ${i + 2}: Logo URL is required`);
          continue;
        }

        // Find store by slug or URL
        let store = null;
        
        if (slug) {
          // Try to find by slug (case-insensitive)
          const { data: storesBySlug, error: slugError } = await supabaseAdmin
            .from('stores')
            .select('id, slug, "Store Name"')
            .ilike('slug', slug.toLowerCase())
            .limit(1);
          
          if (!slugError && storesBySlug && storesBySlug.length > 0) {
            store = storesBySlug[0];
            console.log(`✅ Found store by slug "${slug}": ${store['Store Name'] || store.id}`);
          }
        }

        if (!store && url) {
          // Try to find by URL (normalize and search)
          const normalizedUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase();
          
          // Try multiple URL fields
          const { data: storesByUrl, error: urlError } = await supabaseAdmin
            .from('stores')
            .select('id, slug, "Store Name", "Store Display Url", websiteUrl')
            .or(`"Store Display Url".ilike.%${normalizedUrl}%,websiteUrl.ilike.%${normalizedUrl}%`)
            .limit(1);
          
          if (!urlError && storesByUrl && storesByUrl.length > 0) {
            store = storesByUrl[0];
            console.log(`✅ Found store by URL "${url}": ${store['Store Name'] || store.id}`);
          }
        }

        if (!store) {
          failedCount++;
          const identifier = slug || url || 'N/A';
          errors.push(`Row ${i + 2}: Store not found (Slug: ${slug || 'N/A'}, URL: ${url || 'N/A'})`);
          continue;
        }

        // Update store with logo URL
        const { error: updateError } = await supabaseAdmin
          .from('stores')
          .update({ 
            logo_url: logoUrl,
            logoUrl: logoUrl
          })
          .eq('id', store.id);

        if (updateError) {
          failedCount++;
          errors.push(`Row ${i + 2}: Failed to update store "${store['Store Name'] || store.id}" - ${updateError.message}`);
          console.error(`❌ Error updating store ${store.id}:`, updateError);
        } else {
          successCount++;
          console.log(`✅ Updated logo for store "${store['Store Name'] || store.id}"`);
        }
      } catch (error: any) {
        failedCount++;
        errors.push(`Row ${i + 2}: ${error.message || 'Unknown error'}`);
        console.error(`❌ Error processing row ${i + 2}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      successCount,
      failedCount,
      errors: errors.slice(0, 50), // Limit errors to first 50
      message: `Processed ${jsonData.length} rows. Success: ${successCount}, Failed: ${failedCount}`
    });
  } catch (error: any) {
    console.error('Bulk logo upload error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process bulk logo upload'
    }, { status: 500 });
  }
}


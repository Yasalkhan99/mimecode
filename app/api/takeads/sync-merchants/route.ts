// Sync Merchants from Takeads API to Supabase
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchTakeadsMerchants, TakeadsMerchant } from '@/lib/services/takeadsService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Use API key from request body, or fallback to environment variable
    let apiKey = body.apiKey || process.env.TAKEADS_API_KEY;
    const limit = body.limit || 100;
    const isActive = body.isActive !== undefined ? body.isActive : true;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required. Please provide it in the request or set TAKEADS_API_KEY in environment variables.' },
        { status: 400 }
      );
    }

    // Remove "Bearer " prefix if present (API key should be just the key)
    apiKey = apiKey.replace(/^Bearer\s+/i, '').trim();

    // Debug: Log API key info (first 8 and last 4 chars only for security)
    const apiKeyPreview = apiKey.length > 12 
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : '***';
    console.log(`🔑 Using API key: ${apiKeyPreview} (length: ${apiKey.length})`);

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    let allMerchants: TakeadsMerchant[] = [];
    let next: number | null = null;
    let pageCount = 0;
    const maxPages = 10; // Limit to prevent infinite loops

    console.log('🔄 Starting Takeads merchants sync...');

    // Fetch all pages
    do {
      console.log(`📄 Fetching page ${pageCount + 1}...`);
      const response = await fetchTakeadsMerchants(apiKey, {
        next: next || undefined,
        limit,
        isActive,
      });

      allMerchants = [...allMerchants, ...response.data];
      next = response.meta.next;
      pageCount++;

      console.log(`✅ Fetched ${response.data.length} merchants (Total: ${allMerchants.length})`);

      if (pageCount >= maxPages) {
        console.log(`⚠️ Reached max pages limit (${maxPages})`);
        break;
      }
    } while (next !== null);

    console.log(`📊 Total merchants fetched: ${allMerchants.length}`);

    // Map Takeads merchants to Supabase stores format
    const storesToInsert = allMerchants.map((merchant) => {
      // Generate slug from name
      const slug = merchant.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return {
        'Store Id': String(merchant.merchantId || Date.now() + Math.random()),
        'Store Name': merchant.name,
        'Slug': slug,
        'Store Description': merchant.description || '',
        'Store Summary': merchant.description || '',
        'Store Logo': merchant.imageUri || null,
        'Store Display Url': merchant.defaultDomain || merchant.domains?.[0] || '',
        'Tracking Url': merchant.trackingLink || merchant.defaultDomain || '',
        'Network Id': String(merchant.merchantId || ''),
        'Merchant Id': String(merchant.merchantId || ''),
        'category_id': merchant.categoryId?.[0] ? String(merchant.categoryId[0]) : null,
        'Active': merchant.isActive,
        'Is Featured': false,
        'Store Priority': null,
        'Created Date': merchant.createdAt || new Date().toISOString(),
        'Modify Date': merchant.updatedAt || new Date().toISOString(),
        // Additional fields from Takeads
        'currency_code': merchant.currencyCode,
        'country_codes': merchant.countryCodes,
        'average_commission': merchant.averageCommission,
        'payment_models': merchant.paymentModels,
        'deeplink_allowed': merchant.deeplinkAllowed,
        'domains': merchant.domains,
      };
    });

    console.log(`💾 Upserting ${storesToInsert.length} stores to Supabase...`);

    // Upsert to Supabase (update if exists, insert if new)
    const { data, error } = await supabaseAdmin
      .from('stores')
      .upsert(storesToInsert, {
        onConflict: 'Store Id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('❌ Supabase upsert error:', error);
      throw error;
    }

    console.log(`✅ Successfully synced ${data?.length || 0} stores`);

    return NextResponse.json({
      success: true,
      imported: storesToInsert.length,
      synced: data?.length || 0,
      message: `Successfully synced ${storesToInsert.length} merchants from Takeads`,
    });
  } catch (error: any) {
    console.error('❌ Sync merchants error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync merchants',
      },
      { status: 500 }
    );
  }
}


// Sync Coupons from Takeads API to Supabase
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { fetchTakeadsCoupons, TakeadsCoupon } from '@/lib/services/takeadsService';

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

    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    let allCoupons: TakeadsCoupon[] = [];
    let next: string | null = null;
    let pageCount = 0;
    const maxPages = 50; // Limit to prevent infinite loops

    console.log('🔄 Starting Takeads coupons sync...');

    // Fetch all pages
    do {
      console.log(`📄 Fetching page ${pageCount + 1}...`);
      const response = await fetchTakeadsCoupons(apiKey, {
        next: next || undefined,
        limit,
        isActive,
      });

      allCoupons = [...allCoupons, ...response.data];
      next = response.meta.next;
      pageCount++;

      console.log(`✅ Fetched ${response.data.length} coupons (Total: ${allCoupons.length})`);

      if (pageCount >= maxPages) {
        console.log(`⚠️ Reached max pages limit (${maxPages})`);
        break;
      }
    } while (next !== null);

    console.log(`📊 Total coupons fetched: ${allCoupons.length}`);

    // Get all stores to map merchantId to Store Id
    const { data: allStores } = await supabaseAdmin
      .from('stores')
      .select('"Store Id", "Merchant Id"');

    const merchantIdToStoreId = new Map<string, string>();
    allStores?.forEach((store: any) => {
      const merchantId = String(store['Merchant Id'] || store['Store Id'] || '');
      const storeId = String(store['Store Id'] || '');
      if (merchantId && storeId) {
        merchantIdToStoreId.set(merchantId, storeId);
      }
    });

    console.log(`🔗 Mapped ${merchantIdToStoreId.size} merchant IDs to store IDs`);

    // Map Takeads coupons to Supabase format
    const couponsToInsert = allCoupons.map((coupon) => {
      const storeId = merchantIdToStoreId.get(String(coupon.merchantId)) || null;
      const storeIdsArray = storeId ? [storeId] : [];

      // Extract discount from description or code if possible
      let discount = 0;
      let discountType: 'percentage' | 'fixed' = 'percentage';
      
      // Try to extract discount from name or description
      const discountMatch = coupon.name?.match(/(\d+)%/) || coupon.description?.match(/(\d+)%/);
      if (discountMatch) {
        discount = parseInt(discountMatch[1]);
        discountType = 'percentage';
      } else {
        // Try to find fixed amount (e.g., $10, £5)
        const fixedMatch = coupon.name?.match(/[\$£€](\d+)/) || coupon.description?.match(/[\$£€](\d+)/);
        if (fixedMatch) {
          discount = parseInt(fixedMatch[1]);
          discountType = 'fixed';
        }
      }

      return {
        'Coupon Id': coupon.couponId,
        'Store Name': coupon.name || '',
        'Coupon Code': coupon.code || null,
        'Coupon Title': coupon.name || coupon.description || '',
        'Coupon Desc': coupon.description || '',
        'Coupon Type': coupon.code ? 'code' : 'deal',
        'discount': discount,
        'discount_type': discountType,
        'is_active': coupon.isActive,
        'max_uses': 1000,
        'current_uses': 0,
        'is_popular': false,
        'is_latest': false,
        'Coupon Deep Link': coupon.trackingLink || null,
        'Coupon Expiry': coupon.endDate || null,
        'Created Date': coupon.createdAt || new Date().toISOString(),
        'Modify Date': coupon.updatedAt || new Date().toISOString(),
        'Store  Id': storeId,
        'store_ids': storeIdsArray,
        'logo_url': coupon.imageUri || null,
        'category_id': coupon.categoryIds?.[0] ? String(coupon.categoryIds[0]) : null,
        // Additional Takeads fields
        'language_codes': coupon.languageCodes || [],
        'country_codes': coupon.countryCodes || [],
        'start_date': coupon.startDate || null,
        'end_date': coupon.endDate || null,
      };
    });

    console.log(`💾 Upserting ${couponsToInsert.length} coupons to Supabase...`);

    // Upsert to Supabase
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .upsert(couponsToInsert, {
        onConflict: 'Coupon Id',
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      console.error('❌ Supabase upsert error:', error);
      throw error;
    }

    console.log(`✅ Successfully synced ${data?.length || 0} coupons`);

    return NextResponse.json({
      success: true,
      imported: couponsToInsert.length,
      synced: data?.length || 0,
      message: `Successfully synced ${couponsToInsert.length} coupons from Takeads`,
    });
  } catch (error: any) {
    console.error('❌ Sync coupons error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync coupons',
      },
      { status: 500 }
    );
  }
}


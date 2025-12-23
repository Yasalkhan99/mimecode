import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Create Coupon API Called ===');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { coupon } = body || {};

    console.log('📥 Received coupon create request:', {
      hasCoupon: !!coupon,
      couponType: coupon?.couponType,
      hasCode: !!coupon?.code,
      hasDescription: !!coupon?.description,
      hasStoreName: !!coupon?.storeName,
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Missing coupon data' }, { status: 400 });
    }

    // Validate required fields based on coupon type
    if (coupon.couponType === 'code' && (!coupon.code || (typeof coupon.code === 'string' && coupon.code.trim() === ''))) {
      return NextResponse.json({ success: false, error: 'Coupon code is required for code type coupons' }, { status: 400 });
    }

    // Generate a sequential numeric Coupon Id starting from 1 (if not provided)
    let couponId: string;
    
    if (coupon.id) {
      // Use provided ID
      couponId = coupon.id;
    } else {
      // Generate sequential numeric ID
      // First, get all existing coupons to find the maximum numeric ID
      const { data: existingCoupons, error: fetchError } = await supabaseAdmin
        .from('coupons')
        .select('"Coupon Id"');

      if (fetchError) {
        console.error('❌ Error fetching existing coupons:', fetchError);
        // Start from 1 if fetch fails
        couponId = '1';
      } else {
        // Find the maximum numeric ID, but only consider IDs that are reasonable (not timestamps)
        // Timestamp-based IDs are typically > 100000, so we ignore those
        const MAX_REASONABLE_ID = 100000;
        let maxId = 0;
        
        if (existingCoupons && existingCoupons.length > 0) {
          for (const couponRow of existingCoupons) {
            const id = couponRow['Coupon Id'];
            if (id) {
              // Try to parse as number
              const numericId = parseInt(String(id), 10);
              // Only consider IDs that are reasonable (not timestamp-based)
              if (!isNaN(numericId) && numericId <= MAX_REASONABLE_ID && numericId > maxId) {
                maxId = numericId;
              }
            }
          }
        }
        // Generate next sequential ID starting from 1
        couponId = String(maxId + 1);
      }
    }

    // Convert to Supabase format
    const supabaseCoupon: any = {
      'Coupon Id': couponId,
      'Store Name': coupon.storeName || '',
      'Coupon Code': coupon.code || null,
      'Coupon Title': coupon.title || null, // Don't fallback to description - keep title separate
      'Coupon Desc': coupon.description || '',
      'Coupon Type': coupon.couponType || 'code',
      'discount': coupon.discount || 0,
      'discount_type': coupon.discountType || 'percentage',
      'is_active': coupon.isActive !== false,
      'max_uses': coupon.maxUses || 1000,
      'current_uses': coupon.currentUses || 0,
      'is_popular': coupon.isPopular || false,
      'is_latest': coupon.isLatest || false,
      'deal_scope': coupon.dealScope || null,
      'Created Date': new Date().toISOString(),
      'Modify Date': new Date().toISOString(),
    };

    // Add optional fields
    if (coupon.storeIds && Array.isArray(coupon.storeIds)) {
      supabaseCoupon['store_ids'] = coupon.storeIds;
      // Also set Store  Id (with two spaces) for backward compatibility
      // Convert UUID to numeric Store Id if needed
      if (coupon.storeIds.length > 0) {
        let storeIdForField = coupon.storeIds[0];
        
        // If storeId is a UUID, fetch the store to get its numeric Store Id
        if (storeIdForField && storeIdForField.includes('-')) {
          try {
            const { data: storeData, error: storeError } = await supabaseAdmin
              .from('stores')
              .select('"Store Id"')
              .eq('id', storeIdForField)
              .single();
            
            if (storeError) {
              console.warn('⚠️ Could not fetch store to convert UUID to numeric Store Id:', storeError);
            }
            
            if (storeData && storeData['Store Id']) {
              storeIdForField = String(storeData['Store Id']);
              console.log(`✅ Converted UUID ${coupon.storeIds[0]} to numeric Store Id: ${storeIdForField}`);
            } else {
              console.error(`❌ Store with UUID ${storeIdForField} not found or has no numeric Store Id`);
            }
          } catch (error) {
            console.error('❌ Error converting UUID to numeric Store Id:', error);
            // Don't save UUID - this will cause query issues
            // Throw error to prevent saving coupon with invalid Store Id
            throw new Error(`Invalid store ID: ${storeIdForField}. Could not convert UUID to numeric Store Id.`);
          }
        }
        
        supabaseCoupon['Store  Id'] = storeIdForField;
        console.log(`💾 Saving coupon with Store  Id: ${storeIdForField}`);
      }
    }
    // Handle url field - save to Coupon URL column (NEW column)
    // Always save url field, even if null or empty
    if (coupon.url !== undefined) {
      supabaseCoupon['Coupon URL'] = coupon.url === null || coupon.url === '' ? null : String(coupon.url).trim();
      console.log('🔗 Saving Coupon URL:', supabaseCoupon['Coupon URL']);
    }
    if (coupon.affiliateLink) supabaseCoupon['affiliate_link'] = coupon.affiliateLink;
    if (coupon.logoUrl) supabaseCoupon['logo_url'] = coupon.logoUrl;
    if (coupon.imageAlt !== undefined) supabaseCoupon['image_alt'] = coupon.imageAlt || null;
    if (coupon.priority !== undefined) supabaseCoupon['priority'] = coupon.priority || 0;
    if (coupon.expiryDate) supabaseCoupon['Coupon Expiry'] = coupon.expiryDate;
    if (coupon.categoryId) supabaseCoupon['category_id'] = coupon.categoryId;
    if (coupon.layoutPosition !== null && coupon.layoutPosition !== undefined) {
      supabaseCoupon['Coupon Priority'] = coupon.layoutPosition;
    }
    if (coupon.latestLayoutPosition !== null && coupon.latestLayoutPosition !== undefined) {
      supabaseCoupon['latest_layout_position'] = coupon.latestLayoutPosition;
    }
    if (coupon.buttonText) supabaseCoupon['button_text'] = coupon.buttonText;
    if (coupon.networkId) supabaseCoupon['Network Id'] = coupon.networkId;

    console.log('💾 Inserting coupon into Supabase...');
    console.log('📦 Coupon data:', JSON.stringify(supabaseCoupon, null, 2));

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([supabaseCoupon])
      .select('id, "Coupon Id", "Store Name", "Coupon Code"')
      .single();

    if (error) {
      console.error('❌ Supabase create coupon error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Failed coupon data:', JSON.stringify(supabaseCoupon, null, 2));
      return NextResponse.json(
        { success: false, error: error.message || String(error) },
        { status: 500 }
      );
    }

    if (!data) {
      console.error('❌ No data returned from Supabase insert');
      return NextResponse.json(
        { success: false, error: 'No data returned from database' },
        { status: 500 }
      );
    }

    console.log('✅ Coupon created successfully:', { id: data.id, couponId: data['Coupon Id'], storeName: data['Store Name'] });

    return NextResponse.json({ success: true, id: data.id || data['Coupon Id'] }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Create coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}

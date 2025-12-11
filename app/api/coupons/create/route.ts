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

    // Generate a unique Coupon Id if not provided
    const couponId = coupon.id || `${Date.now()}${Math.floor(Math.random() * 10000)}`;

    // Convert to Supabase format
    const supabaseCoupon: any = {
      'Coupon Id': couponId,
      'Store Name': coupon.storeName || '',
      'Coupon Code': coupon.code || null,
      'Coupon Title': coupon.title || coupon.description || '',
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
      if (coupon.storeIds.length > 0) {
        supabaseCoupon['Store  Id'] = coupon.storeIds[0];
      }
    }
    if (coupon.url) supabaseCoupon['Coupon Deep Link'] = coupon.url;
    if (coupon.affiliateLink) supabaseCoupon['affiliate_link'] = coupon.affiliateLink;
    if (coupon.logoUrl) supabaseCoupon['logo_url'] = coupon.logoUrl;
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

    const { data, error } = await supabaseAdmin
      .from('coupons')
      .insert([supabaseCoupon])
      .select('id, "Coupon Id"')
      .single();

    if (error) {
      console.error('❌ Supabase create coupon error:', error);
      throw error;
    }

    console.log('✅ Coupon created successfully');

    return NextResponse.json({ success: true, id: data.id || data['Coupon Id'] }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Create coupon error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}

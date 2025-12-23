import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clearCouponsCache } from '@/lib/cache/couponsCache';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { id, updates } = body || {};

    console.log('🔄 Update coupon request:', { id, updates });

    if (!id || !updates) {
      console.error('❌ Missing coupon ID or updates');
      return NextResponse.json({ 
        success: false, 
        error: 'Missing coupon ID or updates' 
      }, { status: 400 });
    }

    // Prepare update data (convert camelCase to snake_case for Supabase)
    const updateData: any = {
      updated_at: new Date().toISOString(),
      'Modify Date': new Date().toISOString(), // Update Modify Date field
    };

    // Map fields
    if (updates.code !== undefined) updateData['Coupon Code'] = updates.code;
    if (updates.storeName !== undefined) updateData['Store Name'] = updates.storeName;
    if (updates.storeId !== undefined) updateData.store_id = updates.storeId;
    if (updates.discount !== undefined) updateData.discount = updates.discount;
    if (updates.discountType !== undefined) updateData.discount_type = updates.discountType;
    if (updates.description !== undefined) updateData['Coupon Desc'] = updates.description;
    if (updates.title !== undefined) updateData['Coupon Title'] = updates.title; // Title field
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses;
    if (updates.currentUses !== undefined) updateData.current_uses = updates.currentUses;
    // Handle expiryDate - explicitly include null values
    if (updates.expiryDate !== undefined) {
      updateData['Coupon Expiry'] = updates.expiryDate === null || updates.expiryDate === '' ? null : updates.expiryDate;
    }
    if (updates.couponType !== undefined) updateData['Coupon Type'] = updates.couponType;
    // Handle url field - map to Coupon URL (primary field for coupon URL)
    // CRITICAL: Always include url field, even if it's null or empty, to clear existing values
    if (updates.url !== undefined) {
      const urlValue = updates.url === null || updates.url === '' ? null : String(updates.url).trim();
      updateData['Coupon URL'] = urlValue || null;
      console.log('🔗 Setting Coupon URL:', urlValue);
    }
    if (updates.dealUrl !== undefined) updateData.deal_url = updates.dealUrl;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
    if (updates.imageAlt !== undefined) updateData['image_alt'] = updates.imageAlt || null;
    if (updates.priority !== undefined) updateData['priority'] = updates.priority || 0;
    if (updates.logoUrl !== undefined) updateData['logo_url'] = updates.logoUrl || null;

    console.log('📦 Prepared update data:', updateData);
    console.log('🔍 Checking for Coupon URL in updateData:', updateData['Coupon URL']);

    // Update in Supabase - try by row ID first, then by Coupon Id field
    let data, error;
    
    // First try by Supabase row ID
    const resultById = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    data = resultById.data;
    error = resultById.error;
    
    // If not found by row ID, try by Coupon Id field
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Not found by row ID, trying by Coupon Id field...');
      const resultByCouponId = await supabaseAdmin
        .from('coupons')
        .update(updateData)
        .eq('Coupon Id', id)
        .select()
        .single();
      
      data = resultByCouponId.data;
      error = resultByCouponId.error;
    }

    if (error) {
      console.error('❌ Supabase update error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      console.error('❌ Update data that failed:', JSON.stringify(updateData, null, 2));
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update coupon', details: error },
        { status: 500 }
      );
    }
    
    // Verify the update was successful
    if (data) {
      console.log('✅ Updated coupon data:', data);
      console.log('🔍 Coupon URL after update:', data['Coupon URL']);
    }

    console.log('✅ Coupon updated successfully:', data);
    
    // Clear coupons cache to ensure fresh data on next fetch
    clearCouponsCache();
    console.log('🗑️ Cleared coupons cache after update');
    
    // Return response with revalidation headers to clear Next.js route cache
    const response = NextResponse.json({ success: true, coupon: data }, { status: 200 });
    
    // Add cache revalidation headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('❌ Update coupon error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}


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
    };

    // Map fields
    if (updates.code !== undefined) updateData.code = updates.code;
    if (updates.storeName !== undefined) updateData.store_name = updates.storeName;
    if (updates.storeId !== undefined) updateData.store_id = updates.storeId;
    if (updates.discount !== undefined) updateData.discount = updates.discount;
    if (updates.discountType !== undefined) updateData.discount_type = updates.discountType;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.title !== undefined) updateData['Coupon Title'] = updates.title; // Title field
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.maxUses !== undefined) updateData.max_uses = updates.maxUses;
    if (updates.currentUses !== undefined) updateData.current_uses = updates.currentUses;
    // Handle expiryDate - explicitly include null values
    if (updates.expiryDate !== undefined) {
      updateData.expiry_date = updates.expiryDate === null || updates.expiryDate === '' ? null : updates.expiryDate;
    }
    if (updates.couponType !== undefined) updateData.coupon_type = updates.couponType;
    if (updates.dealUrl !== undefined) updateData.deal_url = updates.dealUrl;
    if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;

    console.log('📦 Prepared update data:', updateData);

    // Update in Supabase
    const { data, error } = await supabaseAdmin
      .from('coupons')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase update error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to update coupon' },
        { status: 500 }
      );
    }

    console.log('✅ Coupon updated successfully:', data);
    
    // Clear coupons cache to ensure fresh data on next fetch
    clearCouponsCache();
    console.log('🗑️ Cleared coupons cache after update');
    
    return NextResponse.json({ success: true, coupon: data }, { status: 200 });
  } catch (error) {
    console.error('❌ Update coupon error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}


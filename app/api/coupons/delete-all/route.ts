import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { clearCouponsCache } from '@/lib/cache/couponsCache';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Delete All Coupons API Called ===');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized');
    }

    // Get count of coupons before deletion
    const { count: couponCount } = await supabaseAdmin
      .from('coupons')
      .select('*', { count: 'exact', head: true });

    console.log(`🗑️ Deleting all coupons (${couponCount || 0} total)...`);

    // Delete all coupons from Supabase
    // Using .neq() with a condition that should match all rows
    const { data: deletedData, error: deleteError } = await supabaseAdmin
      .from('coupons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (deleteError) {
      console.error('❌ Supabase delete all coupons error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message || String(deleteError) },
        { status: 500 }
      );
    }

    const deletedCount = deletedData?.length || couponCount || 0;
    console.log(`✅ Successfully deleted ${deletedCount} coupons`);
    
    // Clear coupons cache to ensure fresh data on next fetch
    clearCouponsCache();
    console.log('🗑️ Cleared coupons cache after deletion');
    
    // Return response with revalidation headers to clear Next.js route cache
    const response = NextResponse.json({ 
      success: true, 
      deletedCount 
    }, { status: 200 });
    
    // Add cache revalidation headers
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error: any) {
    console.error('❌ Delete all coupons error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}


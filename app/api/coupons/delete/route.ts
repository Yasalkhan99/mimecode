import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Delete Coupon API Called ===');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { id } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing coupon ID' }, { status: 400 });
    }

    console.log('🗑️ Deleting coupon with ID:', id, 'Type:', typeof id);

    // Delete from Supabase - try both row ID and Coupon Id field at once
    const idString = String(id);
    const { data: deletedData, error: deleteError } = await supabaseAdmin
      .from('coupons')
      .delete()
      .or(`id.eq.${idString},Coupon Id.eq.${idString}`)
      .select();

    console.log('Delete result:', { 
      deletedData, 
      deleteError, 
      count: deletedData?.length,
      deletedIds: deletedData?.map((d: any) => ({ id: d.id, couponId: d['Coupon Id'] }))
    });

    if (deleteError) {
      console.error('❌ Supabase delete coupon error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message || String(deleteError) },
        { status: 500 }
      );
    }

    if (!deletedData || deletedData.length === 0) {
      console.error('❌ No coupon found with ID:', id);
      return NextResponse.json(
        { success: false, error: `Coupon with ID "${id}" not found` },
        { status: 404 }
      );
    }

    console.log('✅ Coupon deleted successfully');
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Delete coupon error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}


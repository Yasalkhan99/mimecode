import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Delete All Stores API Called ===');
    
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      throw new Error('Supabase admin client not initialized');
    }

    // Get count of stores before deletion
    const { count: storeCount } = await supabaseAdmin
      .from('stores')
      .select('*', { count: 'exact', head: true });

    console.log(`🗑️ Deleting all stores (${storeCount || 0} total)...`);

    // Delete all stores from Supabase
    // Using .neq() with a condition that should match all rows
    const { data: deletedData, error: deleteError } = await supabaseAdmin
      .from('stores')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
      .select();

    if (deleteError) {
      console.error('❌ Supabase delete all stores error:', deleteError);
      return NextResponse.json(
        { success: false, error: deleteError.message || String(deleteError) },
        { status: 500 }
      );
    }

    const deletedCount = deletedData?.length || storeCount || 0;
    console.log(`✅ Successfully deleted ${deletedCount} stores`);
    
    return NextResponse.json({ 
      success: true, 
      deletedCount 
    }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Delete all stores error:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}




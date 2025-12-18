// Server-side store delete route
// Uses Supabase (migrated from MongoDB)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing store ID' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting store with ID:', id, 'Type:', typeof id);

    // Delete from Supabase - try by row ID first, then by Store Id field
    let error;
    
    // First try by Supabase row ID (UUID)
    const resultById = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('id', id);
    
    error = resultById.error;
    
    // If not found by row ID, try by Store Id field (numeric)
    if (error && error.code === 'PGRST116') {
      console.log('⚠️ Not found by row ID, trying by Store Id field...');
      const resultByStoreId = await supabaseAdmin
        .from('stores')
        .delete()
        .eq('Store Id', id);
      
      error = resultByStoreId.error;
    }

    if (error) {
      console.error('❌ Supabase delete store error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to delete store', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Store deleted successfully');

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete store error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete store',
      },
      { status: 500 }
    );
  }
}
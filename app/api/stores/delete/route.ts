// Server-side store delete route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing store ID' },
        { status: 400 }
      );
    }

    console.log('Deleting store with ID:', id);

    // Delete store by Store Id (Supabase uses 'Store Id' as the identifier)
    // First check if store exists
    const { data: checkData, error: checkError } = await supabaseAdmin
      .from('stores')
      .select('"Store Id"')
      .eq('Store Id', id)
      .single();

    if (checkError || !checkData) {
      console.error('Store not found or error checking:', checkError);
      return NextResponse.json(
        { success: false, error: 'Store not found' },
        { status: 404 }
      );
    }

    // Now delete the store
    const { error } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('Store Id', id);

    if (error) {
      console.error('Supabase delete store error:', error);
      throw error;
    }

    console.log('Store deleted successfully:', id);

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Supabase delete store error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete store',
      },
      { status: 500 }
    );
  }
}


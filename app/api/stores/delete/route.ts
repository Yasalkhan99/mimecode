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

    // Delete from Supabase
    // Note: The stores table uses "Store Id" column (with space), not "id"
    const { error } = await supabaseAdmin
      .from('stores')
      .delete()
      .eq('Store Id', id);

    if (error) {
      console.error('Supabase delete store error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to delete store' },
        { status: 500 }
      );
    }

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


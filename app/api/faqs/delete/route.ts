// Server-side FAQ deletion route
// Uses Supabase

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
        { success: false, error: 'FAQ ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete FAQ error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'FAQ not found' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    console.log('✅ FAQ deleted successfully:', id);
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Delete FAQ error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to delete FAQ',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Clear categories cache (shared with get route)
function clearCategoriesCache() {
  if (typeof (global as any).categoriesCache !== 'undefined') {
    (global as any).categoriesCache.data = null;
    (global as any).categoriesCache.timestamp = 0;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id } = body || {};

  if (!id) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing category ID' 
    }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    // Clear cache after successful delete
    clearCategoriesCache();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase delete category error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) 
    }, { status: 500 });
  }
}


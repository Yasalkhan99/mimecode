// Server-side news delete route
// Uses Supabase (migrated from Firebase)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id } = body || {};

  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing news article ID' }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { error } = await supabaseAdmin
      .from('news')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase delete news error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || String(error) 
    }, { status: 500 });
  }
}

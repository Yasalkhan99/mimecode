// Server-side news update route
// Uses Supabase (migrated from Firebase)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, updates } = body || {};

  if (!id || !updates) {
    return NextResponse.json({ success: false, error: 'Missing news article ID or updates' }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Convert updates to Supabase format
    const supabaseUpdates: any = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.description !== undefined) supabaseUpdates.description = updates.description;
    if (updates.content !== undefined) supabaseUpdates.content = updates.content;
    if (updates.imageUrl !== undefined) supabaseUpdates.image_url = updates.imageUrl;
    if (updates.articleUrl !== undefined) supabaseUpdates.article_url = updates.articleUrl;
    if (updates.date !== undefined) supabaseUpdates.date = updates.date;
    if (updates.layoutPosition !== undefined) {
      supabaseUpdates.layout_position = updates.layoutPosition !== null ? Number(updates.layoutPosition) : null;
    }

    const { error } = await supabaseAdmin
      .from('news')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase update news error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || String(error) 
    }, { status: 500 });
  }
}

// Server-side news read route
// Uses Supabase (migrated from Firebase)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any) => {
  // Ensure layoutPosition is a number if it exists
  let layoutPosition = row.layout_position;
  if (layoutPosition !== null && layoutPosition !== undefined) {
    layoutPosition = Number(layoutPosition);
    if (isNaN(layoutPosition)) {
      layoutPosition = null;
    }
  } else {
    layoutPosition = null;
  }
  
  return {
    id: row.id || '',
    title: row.title || '',
    description: row.description || '',
    content: row.content || '',
    imageUrl: row.image_url || '',
    articleUrl: row.article_url || '',
    date: row.date || null,
    layoutPosition: layoutPosition,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Get news by ID
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('news')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }

      return NextResponse.json({
        success: true,
        news: data ? convertToAPIFormat(data) : null,
      });
    }

    // Get all news, sorted by layout_position (ascending, nulls last), then by created_at (descending)
    const { data, error } = await supabaseAdmin
      .from('news')
      .select('*')
      .order('layout_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // console.log(`📊 Supabase news API: Fetched ${data?.length || 0} news articles from database`);

    const convertedNews = (data || []).map(convertToAPIFormat);

    // console.log(`✅ Converted ${convertedNews.length} news articles`);

    return NextResponse.json({
      success: true,
      news: convertedNews,
    });
  } catch (error: any) {
    console.error('Supabase get news error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get news',
        news: [],
      },
      { status: 500 }
    );
  }
}

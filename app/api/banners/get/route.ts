// Server-side banner read route
// Uses Supabase (migrated from MongoDB)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any) => {
  // Ensure layoutPosition is a number if it exists
  let layoutPosition = row.layout_position;
  if (layoutPosition !== null && layoutPosition !== undefined) {
    layoutPosition = Number(layoutPosition);
    // If conversion failed, set to null
    if (isNaN(layoutPosition)) {
      layoutPosition = null;
    }
  } else {
    layoutPosition = null;
  }
  
  return {
    id: row.id || '',
    title: row.title || '',
    imageUrl: row.image_url || '',
    layoutPosition: layoutPosition,
    createdAt: row.created_at || null,
  };
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Get all banners, sorted by layout_position (ascending, nulls last), then by created_at (descending)
    const { data, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('layout_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Supabase banners API: Fetched ${data?.length || 0} banners from database`);
    if (data && data.length > 0) {
      console.log(`📋 Banner layout positions:`, data.map((b: any) => ({ 
        id: b.id, 
        title: b.title, 
        layout_position: b.layout_position,
        layout_position_type: typeof b.layout_position,
        raw_row: b // Full row for debugging
      })));
      
      // Specifically check for layout position 5
      const layout5Banners = data.filter((b: any) => {
        const pos = b.layout_position;
        return pos === 5 || pos === '5' || Number(pos) === 5;
      });
      console.log(`🎯 Banners with layout position 5:`, layout5Banners.length, layout5Banners);
    }

    const convertedBanners = (data || []).map(convertToAPIFormat);
    
    console.log(`✅ Converted ${convertedBanners.length} banners`);
    
    // Log converted banners with layout position 5
    const convertedLayout5 = convertedBanners.filter(b => {
      const pos = b.layoutPosition;
      return pos === 5 || pos === '5' || Number(pos) === 5;
    });
    console.log(`🎯 Converted banners with layout position 5:`, convertedLayout5.length, convertedLayout5);

    return NextResponse.json({
      success: true,
      banners: convertedBanners,
    });
  } catch (error: any) {
    console.error('Supabase get banners error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get banners',
        banners: [],
      },
      { status: 500 }
    );
  }
}


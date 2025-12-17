// Server-side banner read route
// Uses Supabase with caching

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Simple in-memory cache with shorter TTL for better real-time updates
let bannersCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 10 * 1000; // 10 seconds cache - balance between performance and freshness

// Export function to clear cache (called by create/update/delete routes)
export function clearBannersCache() {
  bannersCache = { data: null, timestamp: 0 };
  console.log('🗑️ Banners cache cleared');
}

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any) => {
  let layoutPosition = row.layout_position;
  if (layoutPosition !== null && layoutPosition !== undefined) {
    layoutPosition = Number(layoutPosition);
    if (isNaN(layoutPosition)) layoutPosition = null;
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
  const startTime = Date.now();
  try {
    // Check for cache-busting query parameter
    const { searchParams } = new URL(req.url);
    const cacheBuster = searchParams.get('t');
    const forceRefresh = cacheBuster !== null;
    
    // Check cache first (unless force refresh)
    const now = Date.now();
    if (!forceRefresh && bannersCache.data && (now - bannersCache.timestamp) < CACHE_TTL) {
      console.log('📦 Returning cached banners (', bannersCache.data.length, 'banners)');
      return NextResponse.json(
        { success: true, banners: bannersCache.data },
        { 
          headers: { 
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
            'CDN-Cache-Control': 'public, s-maxage=300',
            'Vary': 'Accept-Encoding'
          } 
        }
      );
    }
    
    console.log('🔄 Fetching banners from Supabase', forceRefresh ? '(force refresh)' : '');

    // Check if Supabase Admin is available
    if (!supabaseAdmin) {
      console.warn('⚠️ Supabase Admin not initialized, returning empty banners array');
      return NextResponse.json(
        { success: true, banners: [] },
        { 
          headers: { 
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
            'CDN-Cache-Control': 'public, s-maxage=300',
            'Vary': 'Accept-Encoding'
          } 
        }
      );
    }
    
    // Fetch banners from Supabase
    const { data: bannersData, error } = await supabaseAdmin
      .from('banners')
      .select('*')
      .order('layout_position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase get banners error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to get banners', banners: [] },
        { 
          status: 200,
          headers: { 
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
            'CDN-Cache-Control': 'public, s-maxage=60',
            'Vary': 'Accept-Encoding'
          } 
        }
      );
    }
    
    // Convert Supabase rows to API format
    // Supabase already orders by layout_position and created_at, so no need to sort again
    const banners: any[] = (bannersData || []).map(convertToAPIFormat);

    // Update cache
    bannersCache = { data: banners, timestamp: now };
    
    const duration = Date.now() - startTime;
    console.log('✅ Fetched', banners.length, 'banners from Supabase in', duration, 'ms');

    return NextResponse.json(
      { success: true, banners: banners },
      { 
        headers: { 
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
          'CDN-Cache-Control': 'public, s-maxage=300',
          'Vary': 'Accept-Encoding'
        } 
      }
    );
  } catch (error: any) {
    console.error('❌ Supabase get banners error:', error);
    // Return 200 with empty array to prevent frontend errors
    return NextResponse.json(
      { success: true, banners: [] },
      { 
        status: 200,
        headers: { 
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vary': 'Accept-Encoding'
        }
      }
    );
  }
}


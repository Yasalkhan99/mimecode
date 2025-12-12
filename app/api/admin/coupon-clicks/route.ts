// API endpoint to get coupon click analytics for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabaseAdmin
      .from('coupon_clicks')
      .select('*', { count: 'exact' })
      .order('clicked_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('clicked_at', startDate);
    }
    if (endDate) {
      query = query.lte('clicked_at', endDate);
    }

    const { data: clicks, error, count } = await query;

    if (error) throw error;

    // Get stats
    const { data: statsData } = await supabaseAdmin
      .from('coupon_clicks')
      .select('country, device_type, coupon_type, store_name');

    // Calculate stats
    const stats = {
      totalClicks: count || 0,
      byCountry: {} as Record<string, number>,
      byDevice: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      topStores: {} as Record<string, number>,
    };

    statsData?.forEach((click: any) => {
      // By country
      const country = click.country || 'Unknown';
      stats.byCountry[country] = (stats.byCountry[country] || 0) + 1;

      // By device
      const device = click.device_type || 'Unknown';
      stats.byDevice[device] = (stats.byDevice[device] || 0) + 1;

      // By type
      const type = click.coupon_type || 'deal';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Top stores
      const store = click.store_name || 'Unknown';
      stats.topStores[store] = (stats.topStores[store] || 0) + 1;
    });

    // Sort top stores
    const sortedStores = Object.entries(stats.topStores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);
    stats.topStores = Object.fromEntries(sortedStores);

    return NextResponse.json({
      success: true,
      clicks: clicks || [],
      stats,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    });
  } catch (error: any) {
    console.error('Get coupon clicks error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get click data', clicks: [], stats: {} },
      { status: 500 }
    );
  }
}


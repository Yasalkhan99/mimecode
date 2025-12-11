// Server-side coupons read route for Dashboard
// Uses Supabase - Returns all coupons without pagination limits

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to normalize URL - add https:// if missing
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// Helper function to convert Firestore document to API format
const convertToAPIFormat = (doc: any, docId: string, storeData?: any) => {
  const data = doc.data ? doc.data() : doc;
  
  // Get coupon URL with fallback to store's Tracking Url or Store Display Url
  let couponUrl = data['Coupon Deep Link'] || data.url || null;
  
  // If no coupon URL, try store's Tracking Url or Store Display Url
  if (!couponUrl && storeData) {
    couponUrl = storeData['Tracking Url'] || storeData['Store Display Url'] || storeData.websiteUrl || null;
  }
  
  // Normalize the URL (add https:// if missing)
  couponUrl = normalizeUrl(couponUrl);
  
  return {
    id: docId || data['Coupon Id'] || data.id || '',
    code: data['Coupon Code'] || data.code || '',
    storeName: data['Store Name'] || data.storeName || storeData?.['Store Name'] || '',
    storeIds: data['Store  Id'] ? [data['Store  Id']] : (data.storeIds || []),
    discount: data.discount ? parseFloat(String(data.discount)) : 0,
    discountType: data.discount_type || data.discountType || 'percentage',
    description: data['Coupon Desc'] || data.description || '',
    title: data['Coupon Title'] || data['Coupon Desc'] || data.description || data.title || null,
    isActive: data.is_active !== false && data.isActive !== false,
    maxUses: data.max_uses || data.maxUses || 1000,
    currentUses: data.current_uses || data.currentUses || 0,
    expiryDate: data['Coupon Expiry'] || data.expiryDate || data.expiry_date || null,
    logoUrl: data.logo_url || data.logoUrl || null,
    url: couponUrl,
    couponType: data['Coupon Type'] || data.couponType || 'code',
    isPopular: data.is_popular || data.isPopular || false,
    layoutPosition: data['Coupon Priority'] ? parseInt(String(data['Coupon Priority'])) : (data.layoutPosition || null),
    isLatest: data.is_latest || data.isLatest || false,
    latestLayoutPosition: data.latest_layout_position || data.latestLayoutPosition || null,
    categoryId: data.category_id || data.categoryId || null,
    createdAt: data.created_at || data.createdAt || data['Created Date'] || null,
    updatedAt: data.updated_at || data.updatedAt || data['Modify Date'] || null,
  };
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const tableName = 'coupons';

    // OPTIMIZED: Use database aggregation instead of fetching all data
    // Get counts and minimal data using efficient queries
    const [totalCountResult, activeCountResult, statsData] = await Promise.all([
      // Total coupons count
      supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true }),
      
      // Active coupons count (where is_active is not false)
      supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .or('is_active.is.null,is_active.eq.true'),
      
      // Get only the fields we need for calculations (much faster than fetching all)
      supabaseAdmin
        .from(tableName)
        .select('current_uses,currentUses,discount'),
    ]);

    const totalCoupons = totalCountResult.count || 0;
    const activeCoupons = activeCountResult.count || 0;
    
    // Calculate total uses from minimal data
    const totalUses = (statsData.data || []).reduce((sum: number, coupon: any) => {
      return sum + (parseInt(coupon.current_uses || coupon.currentUses || 0) || 0);
    }, 0);
    
    // Calculate average discount from minimal data
    const discountValues = (statsData.data || [])
      .map((c: any) => parseFloat(c.discount || 0))
      .filter((d: number) => !isNaN(d) && d > 0);
    
    const averageDiscount = discountValues.length > 0
      ? (discountValues.reduce((sum: number, d: number) => sum + d, 0) / discountValues.length).toFixed(2)
      : '0.00';

    console.log(`✅ Dashboard API: Fast stats calculated - Total: ${totalCoupons}, Active: ${activeCoupons}`);

    // For the table, fetch only recent coupons (limit to 10-20 for faster loading)
    const { data: recentCoupons, error: recentError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })
      .order('Modify Date', { ascending: false })
      .limit(20);

    let convertedCoupons: any[] = [];
    
    if (recentCoupons && recentCoupons.length > 0) {
      // Get unique store IDs for batch fetch (only for recent coupons)
      const storeIds = new Set<string>();
      recentCoupons.forEach((coupon: any) => {
        if (coupon['Store  Id']) storeIds.add(coupon['Store  Id']);
        if (coupon.storeIds && Array.isArray(coupon.storeIds)) {
          coupon.storeIds.forEach((id: string) => storeIds.add(id));
        }
      });
      
      // Fetch store data only for recent coupons
      const storeDataMap = new Map();
      if (storeIds.size > 0) {
        const { data: stores } = await supabaseAdmin
          .from('stores')
          .select('*')
          .in('id', Array.from(storeIds));
        
        stores?.forEach(store => {
          storeDataMap.set(store.id, store);
        });
      }

      // Convert only recent coupons
      convertedCoupons = recentCoupons.map((coupon: any) => {
        const couponStoreId = coupon['Store  Id'] || coupon.storeIds?.[0];
        const storeData = couponStoreId ? storeDataMap.get(couponStoreId) : null;
        return convertToAPIFormat({ data: () => coupon }, coupon.id, storeData);
      });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalCoupons,
        activeCoupons,
        totalUses,
        averageDiscount,
      },
      coupons: convertedCoupons, // Return only recent coupons for table
    });
  } catch (error: any) {
    console.error('Supabase get dashboard coupons error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get dashboard coupons',
        stats: {
          totalCoupons: 0,
          activeCoupons: 0,
          totalUses: 0,
          averageDiscount: '0.00',
        },
        coupons: [],
      },
      { status: 500 }
    );
  }
}


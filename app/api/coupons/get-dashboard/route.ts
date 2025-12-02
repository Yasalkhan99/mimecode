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
    const storesTableName = 'stores';

    // Get all coupons without any filters - for dashboard stats
    // Fetch all coupons using pagination to bypass 1000 row limit
    let baseQuery = supabaseAdmin.from(tableName).select('*', { count: 'exact' });
    
    // Fetch all coupons using pagination to bypass 1000 row limit
    let allCoupons: any[] = [];
    const batchSize = 1000;
    let from = 0;
    let hasMore = true;
    
    while (hasMore) {
      let batchQuery = baseQuery.range(from, from + batchSize - 1);
      const { data: batchCoupons, error: batchError, count } = await batchQuery;
      
      if (batchError) {
        throw batchError;
      }
      
      if (batchCoupons && batchCoupons.length > 0) {
        allCoupons = [...allCoupons, ...batchCoupons];
        from += batchSize;
        // Continue if we got a full batch and there might be more
        hasMore = batchCoupons.length === batchSize && (count === null || from < count);
      } else {
        hasMore = false;
      }
    }
    
    const coupons = allCoupons;

    console.log(`📊 Dashboard API: Fetched ${coupons?.length || 0} coupons from Supabase`);

    // Get unique store IDs for batch fetch
    const storeIds = new Set<string>();
    coupons?.forEach((coupon: any) => {
      if (coupon['Store  Id']) storeIds.add(coupon['Store  Id']);
      if (coupon.storeIds && Array.isArray(coupon.storeIds)) {
        coupon.storeIds.forEach((id: string) => storeIds.add(id));
      }
    });
    
    // Fetch store data for all unique store IDs
    const storeDataMap = new Map();
    if (storeIds.size > 0) {
      const { data: stores } = await supabaseAdmin
        .from(storesTableName)
        .select('*')
        .in('id', Array.from(storeIds));
      
      stores?.forEach(store => {
        storeDataMap.set(store.id, store);
      });
    }

    // Convert coupons with store data fallback
    let convertedCoupons = (coupons || []).map((coupon: any) => {
      const couponStoreId = coupon['Store  Id'] || coupon.storeIds?.[0];
      const storeData = couponStoreId ? storeDataMap.get(couponStoreId) : null;
      return convertToAPIFormat({ data: () => coupon }, coupon.id, storeData);
    });

    console.log(`✅ Dashboard API: Converted ${convertedCoupons.length} coupons`);

    // Calculate stats
    const totalCoupons = convertedCoupons.length;
    const activeCoupons = convertedCoupons.filter((coupon: any) => coupon.isActive !== false).length;
    const totalUses = convertedCoupons.reduce((sum: number, coupon: any) => sum + (coupon.currentUses || 0), 0);
    const averageDiscount = convertedCoupons.length > 0
      ? (convertedCoupons.reduce((sum: number, coupon: any) => sum + (coupon.discount || 0), 0) / convertedCoupons.length).toFixed(2)
      : '0.00';

    return NextResponse.json({
      success: true,
      stats: {
        totalCoupons,
        activeCoupons,
        totalUses,
        averageDiscount,
      },
      coupons: convertedCoupons, // Return all coupons for dashboard
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


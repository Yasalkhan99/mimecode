// Server-side coupons read route
// Uses Supabase with caching

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Simple in-memory cache
let couponsCache: { data: any[] | null; timestamp: number; key: string } = { data: null, timestamp: 0, key: '' };
const CACHE_TTL = 30 * 1000; // 30 seconds cache

// Helper function to normalize URL
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`;
  return trimmed;
};

// Helper function to convert to API format
const convertToAPIFormat = (doc: any, docId: string, storeData?: any) => {
  const data = doc.data();
  
  let couponUrl = data['Coupon Deep Link'] || data.url || null;
  if (!couponUrl && storeData) {
    couponUrl = storeData['Tracking Url'] || storeData['Store Display Url'] || storeData.websiteUrl || null;
  }
  couponUrl = normalizeUrl(couponUrl);
  
  let storeIdsArray: string[] = [];
  if (data['Store  Id']) storeIdsArray = [data['Store  Id']];
  else if (data.store_ids && Array.isArray(data.store_ids)) storeIdsArray = data.store_ids;
  else if (data.storeIds && Array.isArray(data.storeIds)) storeIdsArray = data.storeIds;
  
  return {
    id: docId || data['Coupon Id'] || data.id || '',
    code: data['Coupon Code'] || data.code || '',
    storeName: data['Store Name'] || data.store_name || data.storeName || storeData?.['Store Name'] || '',
    storeIds: storeIdsArray,
    discount: data.discount ? parseFloat(String(data.discount)) : 0,
    discountType: data.discount_type || data.discountType || 'percentage',
    description: data['Coupon Desc'] || data.description || '',
    title: data['Coupon Title'] || data['Coupon Desc'] || data.description || data.title || null,
    isActive: data.is_active !== false && data.isActive !== false,
    maxUses: data.max_uses || data.maxUses || 1000,
    currentUses: data.current_uses || data.currentUses || 0,
    expiryDate: data['Coupon Expiry'] || data.expiry_date || data.expiryDate || null,
    logoUrl: data.logo_url || data.logoUrl || null,
    url: couponUrl,
    affiliateLink: data.affiliate_link || data.affiliateLink || null,
    couponType: data['Coupon Type'] || data.coupon_type || data.couponType || 'code',
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const storeId = searchParams.get('storeId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Create cache key from params
    const cacheKey = `${id || ''}-${categoryId || ''}-${storeId || ''}-${activeOnly}`;
    const now = Date.now();

    // Check cache for list queries (not single item)
    if (!id && couponsCache.data && couponsCache.key === cacheKey && (now - couponsCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        { success: true, coupons: couponsCache.data },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
      );
    }

    const tableName = 'coupons';
    const storesTableName = 'stores';

    // Get coupon by ID (no cache)
    if (id) {
      const { data: couponData, error: couponError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (couponError || !couponData) {
        return NextResponse.json({ success: true, coupon: null });
      }
      
      let storeData = null; 
      const storeIdToFetch = couponData['Store  Id'] || couponData.storeIds?.[0];
      if (storeIdToFetch) {
        const { data: store } = await supabaseAdmin
          .from(storesTableName)
          .select('*')
          .eq('id', storeIdToFetch)
          .single();
        if (store) storeData = store;
      }
      
      return NextResponse.json({
        success: true,
        coupon: convertToAPIFormat({ data: () => couponData }, id, storeData),
      });
    }

    // Get all coupons with filters
    let query = supabaseAdmin.from(tableName).select('*');
    
    if (storeId) query = query.eq('Store  Id', storeId);
    if (categoryId) query = query.or(`category_id.eq.${categoryId},categoryId.eq.${categoryId}`);
    
    const { data: coupons, error: couponsError } = await query;
    if (couponsError) throw couponsError;

    // Get unique store IDs for batch fetch
    const storeIds = new Set<string>();
    coupons?.forEach((coupon: any) => {
      if (coupon['Store  Id']) storeIds.add(coupon['Store  Id']);
      if (coupon.storeIds && Array.isArray(coupon.storeIds)) {
        coupon.storeIds.forEach((id: string) => storeIds.add(id));
      }
    });
    
    // Fetch store data
    const storeDataMap = new Map();
    if (storeIds.size > 0) {
      const { data: stores } = await supabaseAdmin
        .from(storesTableName)
        .select('*')
        .in('Store Id', Array.from(storeIds));
      
      stores?.forEach(store => {
        const storeIdKey = store['Store Id'] || store.store_id;
        if (storeIdKey) storeDataMap.set(storeIdKey, store);
      });
    }

    // Convert coupons
    let convertedCoupons = (coupons || []).map((coupon: any) => {
      const couponStoreId = coupon['Store  Id'] || coupon.storeIds?.[0];
      const storeData = couponStoreId ? storeDataMap.get(couponStoreId) : null;
      return convertToAPIFormat({ data: () => coupon }, coupon.id, storeData);
    });

    // Apply activeOnly filtering
    if (activeOnly) {
      convertedCoupons = convertedCoupons.filter((coupon: any) => coupon.isActive !== false);
    }

    // Filter out expired coupons
    const nowDate = new Date();
    convertedCoupons = convertedCoupons.filter((coupon: any) => {
      if (!coupon.expiryDate) return true;
      
      let expiryDate: Date | null = null;
      if (coupon.expiryDate instanceof Date) {
        expiryDate = coupon.expiryDate;
      } else if (typeof coupon.expiryDate === 'string') {
        const dateStr = coupon.expiryDate.trim();
        if (!dateStr || dateStr === '0000-00-00' || dateStr === 'null' || dateStr === 'NULL') return true;
        expiryDate = new Date(dateStr);
        if (isNaN(expiryDate.getTime())) return true;
        if (expiryDate.getFullYear() < 2000) return false;
      } else if (coupon.expiryDate && typeof (coupon.expiryDate as any).toDate === 'function') {
        expiryDate = (coupon.expiryDate as any).toDate();
      }
      
      return !expiryDate || expiryDate >= nowDate;
    });

    // Update cache
    couponsCache = { data: convertedCoupons, timestamp: now, key: cacheKey };

    return NextResponse.json(
      { success: true, coupons: convertedCoupons },
      { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
    );
  } catch (error: any) {
    console.error('Supabase get coupons error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get coupons', coupons: [], coupon: null },
      { status: 500 }
    );
  }
}

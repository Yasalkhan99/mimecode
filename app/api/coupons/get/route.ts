// Server-side coupons read route
// Uses Supabase (migrated from Firebase)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to normalize URL - add https:// if missing
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // If it's a domain-like string, add https://
  if (trimmed.includes('.') && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }
  return trimmed;
};

// Helper function to convert Firestore document to API format
const convertToAPIFormat = (doc: any, docId: string, storeData?: any) => {
  const data = doc.data();
  
  // Get coupon URL with fallback to store's Tracking Url or Store Display Url
  let couponUrl = data['Coupon Deep Link'] || data.url || null;
  
  // If no coupon URL, try store's Tracking Url or Store Display Url
  if (!couponUrl && storeData) {
    couponUrl = storeData['Tracking Url'] || storeData['Store Display Url'] || storeData.websiteUrl || null;
  }
  
  // Normalize the URL (add https:// if missing)
  couponUrl = normalizeUrl(couponUrl);
  
  // Get store IDs - check Store  Id field (most common in our CSV import data)
  let storeIdsArray: string[] = [];
  if (data['Store  Id']) {
    storeIdsArray = [data['Store  Id']];
  } else if (data.store_ids && Array.isArray(data.store_ids)) {
    storeIdsArray = data.store_ids;
  } else if (data.storeIds && Array.isArray(data.storeIds)) {
    storeIdsArray = data.storeIds;
  }
  
  const result = {
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
    couponType: data['Coupon Type'] || data.coupon_type || data.couponType || 'code',
    isPopular: data.is_popular || data.isPopular || false,
    layoutPosition: data['Coupon Priority'] ? parseInt(String(data['Coupon Priority'])) : (data.layoutPosition || null),
    isLatest: data.is_latest || data.isLatest || false,
    latestLayoutPosition: data.latest_layout_position || data.latestLayoutPosition || null,
    categoryId: data.category_id || data.categoryId || null,
    createdAt: data.created_at || data.createdAt || data['Created Date'] || null,
    updatedAt: data.updated_at || data.updatedAt || data['Modify Date'] || null,
  };
  
  return result;
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const tableName = 'coupons';
    const storesTableName = 'stores';

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const storeId = searchParams.get('storeId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Get coupon by ID
    if (id) {
      const { data: couponData, error: couponError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (couponError || !couponData) {
        return NextResponse.json({
          success: true,
          coupon: null,
        });
      }
      
      // Get store data for fallback URL
      let storeData = null;
      const storeIdToFetch = couponData['Store  Id'] || couponData.storeIds?.[0];
      if (storeIdToFetch) {
        const { data: store } = await supabaseAdmin
          .from(storesTableName)
          .select('*')
          .eq('id', storeIdToFetch)
          .single();
        if (store) {
          storeData = store;
        }
      }
      
      return NextResponse.json({
        success: true,
        coupon: convertToAPIFormat({ data: () => couponData }, id, storeData),
      });
    }

    // Get all coupons with filters
    let query = supabaseAdmin.from(tableName).select('*');
    
    // Apply storeId filter at database level (much faster!)
    if (storeId) {
      console.log(`🔍 Filtering at DB level for storeId: ${storeId}`);
      // Filter by Store  Id column (with two spaces)
      query = query.eq('Store  Id', storeId);
    }
    
    // Apply category filter
    if (categoryId) {
      query = query.or(`category_id.eq.${categoryId},categoryId.eq.${categoryId}`);
    }
    
    // Fetch coupons
    const { data: coupons, error: couponsError } = await query;
    
    if (couponsError) {
      throw couponsError;
    }

    console.log(`📊 Fetched ${coupons?.length || 0} coupons from Supabase`);

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
        .in('Store Id', Array.from(storeIds));
      
      stores?.forEach(store => {
        // Use Store Id as the map key (not UUID id which doesn't exist)
        const storeIdKey = store['Store Id'] || store.store_id;
        if (storeIdKey) {
          storeDataMap.set(storeIdKey, store);
        }
      });
    }

    // Convert coupons with store data fallback
    let convertedCoupons = (coupons || []).map((coupon: any) => {
      const couponStoreId = coupon['Store  Id'] || coupon.storeIds?.[0];
      const storeData = couponStoreId ? storeDataMap.get(couponStoreId) : null;
      return convertToAPIFormat({ data: () => coupon }, coupon.id, storeData);
    });

    // StoreId filtering is now done at database level (see query above)
    console.log(`📊 Total coupons after conversion: ${convertedCoupons.length}`);

    // Apply activeOnly filtering
    if (activeOnly) {
      const beforeFilter = convertedCoupons.length;
      convertedCoupons = convertedCoupons.filter((coupon: any) => {
        return coupon.isActive !== false;
      });
      console.log(`📊 After activeOnly filter: ${convertedCoupons.length} coupons (filtered out ${beforeFilter - convertedCoupons.length})`);
    }

    // Filter out expired coupons
    const beforeExpiryFilter = convertedCoupons.length;
    const now = new Date();
    convertedCoupons = convertedCoupons.filter((coupon: any) => {
      if (!coupon.expiryDate) return true; // No expiry date = valid
      
      let expiryDate: Date | null = null;
      
      // Handle different expiry date formats
      if (coupon.expiryDate instanceof Date) {
        expiryDate = coupon.expiryDate;
      } else if (typeof coupon.expiryDate === 'string') {
        const dateStr = coupon.expiryDate.trim();
        
        // Skip invalid dates
        if (!dateStr || dateStr === '0000-00-00' || dateStr === 'null' || dateStr === 'NULL' || dateStr.toLowerCase() === 'invalid') {
          return true; // Invalid date format = treat as no expiry
        }
        
        expiryDate = new Date(dateStr);
        if (isNaN(expiryDate.getTime())) {
          return true; // Invalid date = treat as no expiry
        }
        
        if (expiryDate.getFullYear() < 2000) {
          return false; // Old/invalid year = filter out
        }
      } else if (coupon.expiryDate && typeof (coupon.expiryDate as any).toDate === 'function') {
        expiryDate = (coupon.expiryDate as any).toDate();
      }
      
      // Filter out expired coupons
      if (expiryDate && expiryDate < now) {
        return false;
      }
      
      return true;
    });

    console.log(`📊 After expiry filter: ${convertedCoupons.length} coupons (filtered out ${beforeExpiryFilter - convertedCoupons.length} expired)`);
    console.log(`✅ Returning ${convertedCoupons.length} coupons to client`);

    return NextResponse.json({
      success: true,
      coupons: convertedCoupons,
    });
  } catch (error: any) {
    console.error('Supabase get coupons error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get coupons',
        coupons: [],
        coupon: null,
      },
      { status: 500 }
    );
  }
}

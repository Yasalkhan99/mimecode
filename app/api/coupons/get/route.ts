// Server-side coupons read route
// Uses Supabase (migrated from MongoDB)

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

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any, storeData?: any) => {
  // Get coupon URL with fallback to store's Tracking Url or Store Display Url
  let couponUrl = row['Coupon Deep Link'] || row.url || null;
  
  // If no coupon URL, try store's Tracking Url or Store Display Url
  if (!couponUrl && storeData) {
    couponUrl = storeData['Tracking Url'] || storeData['Store Display Url'] || null;
  }
  
  // Normalize the URL (add https:// if missing)
  couponUrl = normalizeUrl(couponUrl);
  
  return {
    id: row.id || row['Coupon Id'] || '',
    code: row['Coupon Code'] || row.code || '',
    storeName: row['Store Name'] || row.store_name || storeData?.['Store Name'] || '',
    storeIds: row['Store  Id'] ? [row['Store  Id']] : row.store_ids || [],
    discount: row.discount ? parseFloat(row.discount) : 0,
    discountType: row.discount_type || 'percentage',
    description: row['Coupon Desc'] || row.description || '',
    // Add coupon title for popup display
    title: row['Coupon Title'] || row['Coupon Desc'] || row.description || null,
    // More lenient: only check is_active, ignore Status for now
    // Show coupon if is_active is true, null, or undefined (not explicitly false)
    isActive: row.is_active !== false,
    maxUses: row.max_uses || 1000,
    currentUses: row.current_uses || 0,
    expiryDate: row['Coupon Expiry'] || row.expiry_date || null,
    logoUrl: row.logo_url || null,
    url: couponUrl,
    couponType: row['Coupon Type'] || row.coupon_type || 'code',
    isPopular: row.is_popular || false,
    layoutPosition: row['Coupon Priority'] ? parseInt(row['Coupon Priority']) : row.layout_position || null,
    categoryId: row.category_id || null,
    createdAt: row.created_at || row['Created Date'] || null,
    updatedAt: row.updated_at || row['Modify Date'] || null,
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

    let query = supabaseAdmin.from('coupons').select('*');

    // Get coupon by ID
    if (id) {
      const { data, error } = await query.eq('id', id).single();
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      
      // Get store data for fallback URL
      let storeData = null;
      if (data && data['Store  Id']) {
        const { data: store } = await supabaseAdmin
          .from('stores')
          .select('"Store Id", "Store Name", "Tracking Url", "Store Display Url"')
          .eq('Store Id', data['Store  Id'])
          .single();
        storeData = store;
      }
      
      return NextResponse.json({
        success: true,
        coupon: data ? convertToAPIFormat(data, storeData) : null,
      });
    }

    // Build query filters
    // Note: We don't filter by is_active or Status in the query to avoid missing coupons
    // We'll filter in memory after conversion to be more lenient
    // This ensures we get all coupons and can apply more flexible filtering
    
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    
    if (storeId) {
      // Check if storeId is in Store  Id column or store_ids array
      query = query.or(`Store  Id.eq.${storeId},store_ids.cs.{${storeId}}`);
    }

    // Get coupons - fetch all without ordering first to avoid issues
    // Supabase default limit is 1000, but we need all coupons
    // Try without ordering first, then order in memory if needed
    let { data, error } = await query.limit(100000);
    
    // If ordering fails, try without it
    if (error && error.message?.includes('created_at')) {
      console.warn('Ordering by created_at failed, fetching without order:', error.message);
      query = supabaseAdmin.from('coupons').select('*');
      if (categoryId) query = query.eq('category_id', categoryId);
      if (storeId) query = query.or(`Store  Id.eq.${storeId},store_ids.cs.{${storeId}}`);
      const retryResult = await query.limit(100000);
      data = retryResult.data;
      error = retryResult.error;
    }
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    console.log(`📊 Fetched ${data?.length || 0} coupons from database`);

    // Get unique store IDs for batch fetch
    const storeIds = [...new Set((data || [])
      .map(c => c['Store  Id'])
      .filter(id => id !== null && id !== undefined))];
    
    // Fetch store data for all unique store IDs
    const storeDataMap = new Map();
    if (storeIds.length > 0) {
      const { data: stores, error: storesError } = await supabaseAdmin
        .from('stores')
        .select('"Store Id", "Store Name", "Tracking Url", "Store Display Url", website_url')
        .in('Store Id', storeIds);
      
      if (!storesError && stores) {
        stores.forEach(store => {
          storeDataMap.set(store['Store Id'], store);
        });
      }
    }

    // Convert coupons with store data fallback
    let convertedCoupons = (data || []).map(coupon => {
      const storeData = coupon['Store  Id'] ? storeDataMap.get(coupon['Store  Id']) : null;
      return convertToAPIFormat(coupon, storeData);
    });

    console.log(`📊 Converted ${convertedCoupons.length} coupons`);

    // Apply activeOnly filtering in memory (more lenient than query-level filtering)
    // TEMPORARILY DISABLED FOR DEBUGGING - showing all coupons regardless of active status
    if (activeOnly && false) { // Temporarily disabled
      const beforeFilter = convertedCoupons.length;
      convertedCoupons = convertedCoupons.filter(coupon => {
        // Show coupon if isActive is true or undefined/null (not explicitly false)
        // The convertToAPIFormat sets isActive based on is_active (ignores Status for now)
        return coupon.isActive !== false;
      });
      console.log(`📊 After activeOnly filter: ${convertedCoupons.length} coupons (filtered out ${beforeFilter - convertedCoupons.length})`);
    } else {
      console.log(`📊 Skipping activeOnly filter (debugging mode)`);
    }

    // Filter out expired coupons (always filter expired coupons)
    // TEMPORARILY DISABLED FOR DEBUGGING
    const beforeExpiryFilter = convertedCoupons.length;
    const now = new Date();
    convertedCoupons = convertedCoupons.filter(coupon => {
      // TEMPORARILY SHOW ALL COUPONS - DISABLED EXPIRY FILTERING
      return true; // TEMPORARY: Show all coupons
      
      /* ORIGINAL EXPIRY FILTERING - DISABLED FOR DEBUGGING
      if (!coupon.expiryDate) return true; // No expiry date = valid
      
      let expiryDate: Date | null = null;
      
      // Handle different expiry date formats
      if (coupon.expiryDate instanceof Date) {
        expiryDate = coupon.expiryDate;
      } else if (typeof coupon.expiryDate === 'string') {
        const dateStr = coupon.expiryDate.trim();
        
        // Skip invalid dates like "0000-00-00", "null", empty strings - treat as no expiry (show coupon)
        if (!dateStr || dateStr === '0000-00-00' || dateStr === 'null' || dateStr === 'NULL' || dateStr.toLowerCase() === 'invalid') {
          return true; // Invalid date format = treat as no expiry (show coupon)
        }
        
        // Try parsing date strings like "2099-12-31" or "31 Dec, 2025"
        expiryDate = new Date(dateStr);
        if (isNaN(expiryDate.getTime())) {
          return true; // Invalid date = treat as no expiry (show coupon)
        }
        
        // Check if date is way in the past (like year 1900 or earlier) - filter out
        if (expiryDate.getFullYear() < 2000) {
          return false; // Old/invalid year = filter out (expired)
        }
      } else if (coupon.expiryDate && typeof coupon.expiryDate.toDate === 'function') {
        expiryDate = coupon.expiryDate.toDate();
      }
      
      // Filter out expired coupons (only if we have a valid expiry date)
      if (expiryDate && expiryDate < now) {
        return false;
      }
      
      return true;
      */
    });

    console.log(`📊 After expiry filter: ${convertedCoupons.length} coupons (would have filtered out ${beforeExpiryFilter - convertedCoupons.length} expired)`);
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


// Server-side coupons read route
// Uses Supabase with caching

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

import { getCouponsCache, setCouponsCache } from '@/lib/cache/couponsCache';

// Simple in-memory cache (now shared via couponsCache module)
const CACHE_TTL = 30 * 1000; // 30 seconds cache

// Helper function to normalize URL
const normalizeUrl = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes('.') && !trimmed.includes(' ')) return `https://${trimmed}`;
  return trimmed;
};

// Minimal HTML entity decoder (handles common cases like &pound;)
const decodeHtmlEntities = (value: any): any => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/&pound;/gi, '£')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
};

// Helper function to convert to API format
// Excel headers: Store Name, Title, Description, Code, Type, Expiry, Deeplink
// Supabase columns: Store Name, Coupon Title, Coupon Desc, Coupon Code, Coupon Type, Coupon Expiry, Coupon URL
const convertToAPIFormat = (couponData: any, docId: string, storeData?: any) => {
  // Handle both Supabase format (plain object) and Firestore format (doc.data())
  const data = typeof couponData.data === 'function' ? couponData.data() : couponData;
  
  // Coupon URL - primary field for coupon URL
  // CRITICAL: Only use coupon's own URL, don't fallback to store URL here
  // Fallback to store URL should happen in frontend handleGetDeal function, not here
  // Priority: Coupon URL (new) > Coupon Deep Link (old/fallback) > Deeplink > url
  // CRITICAL: Check Coupon URL first, and only use it if it's not null/empty
  let couponUrl = null;
  
  // Try different ways to access the column (Supabase might return it differently)
  const couponUrlValue = data['Coupon URL'] || data['coupon_url'] || data.couponUrl || data['CouponUrl'];
  const couponDeepLinkValue = data['Coupon Deep Link'] || data['Coupon Deep Link'] || data['coupon_deep_link'] || data.couponDeepLink;
  
  // Debug: Log all URL-related fields to see what we have (ALWAYS log for debugging)
  console.log('[GET Route] All URL fields in data for coupon:', {
    couponId: docId || data['Coupon Id'] || data.id,
    'Coupon URL': data['Coupon URL'],
    'coupon_url': data['coupon_url'],
    'couponUrl': data.couponUrl,
    'CouponUrl': data['CouponUrl'],
    'Coupon Deep Link': data['Coupon Deep Link'],
    'coupon_deep_link': data['coupon_deep_link'],
    'Deeplink': data['Deeplink'],
    'url': data.url,
    'All URL/Link keys': Object.keys(data).filter(k => k.toLowerCase().includes('url') || k.toLowerCase().includes('link') || k.toLowerCase().includes('deep'))
  });
  
  if (couponUrlValue && couponUrlValue !== null && String(couponUrlValue).trim() !== '') {
    couponUrl = couponUrlValue;
    console.log('[GET Route] ✅ Using Coupon URL:', couponUrl);
  } else if (couponDeepLinkValue && couponDeepLinkValue !== null && String(couponDeepLinkValue).trim() !== '') {
    couponUrl = couponDeepLinkValue;
    console.log('[GET Route] ⚠️ Using Coupon Deep Link (fallback):', couponUrl, 'Coupon URL was:', couponUrlValue);
  } else if (data['Deeplink'] && data['Deeplink'] !== null && String(data['Deeplink']).trim() !== '') {
    couponUrl = data['Deeplink'];
  } else if (data.url && data.url !== null && String(data.url).trim() !== '') {
    couponUrl = data.url;
  }
  // Only normalize if we have a URL - don't add store fallback here
  couponUrl = couponUrl ? normalizeUrl(couponUrl) : null;
  
  // Store IDs
  let storeIdsArray: string[] = [];
  if (data['Store  Id']) storeIdsArray = [data['Store  Id']];
  else if (data.store_ids && Array.isArray(data.store_ids)) storeIdsArray = data.store_ids;
  else if (data.storeIds && Array.isArray(data.storeIds)) storeIdsArray = data.storeIds;

  // Description - Excel column name, Supabase: Coupon Desc
  const rawDescription = data['Coupon Desc'] || data['Description'] || data.description || '';
  
  // Title - Excel column name, Supabase: Coupon Title
  // Only get from Title/Coupon Title fields, don't fallback to description
  const rawTitle = data['Coupon Title'] || data['Title'] || data.title || null;
  
  // Code - Excel column name, Supabase: Coupon Code
  const couponCode = data['Coupon Code'] || data['Code'] || data.code || '';
  
  // Type - Excel column name, Supabase: Coupon Type
  const couponType = data['Coupon Type'] || data['Type'] || data.coupon_type || data.couponType || 'code';
  
  // Expiry - Excel column name, Supabase: Coupon Expiry
  const expiryDate = data['Coupon Expiry'] || data['Expiry'] || data.expiry_date || data.expiryDate || null;
  
  // Store Name - ALWAYS get from storeData first (most accurate from database)
  // Only fallback to coupon data if storeData is completely unavailable
  // This ensures we always show the actual store name from database, not what's saved in coupon
  let storeName = '';
  if (storeData && storeData['Store Name']) {
    storeName = storeData['Store Name'];
  } else if (!storeData) {
    // Only use coupon's Store Name field as last resort if we couldn't fetch store data
    storeName = data['Store Name'] || data.store_name || data.storeName || '';
  }
  // If storeData exists but doesn't have Store Name, keep storeName as empty string
  
  // Debug logging for URL priority
  if (process.env.NODE_ENV === 'development' && docId) {
    console.log(`[GET Route] Coupon ${docId} URL resolution:`, {
      'Coupon URL': data['Coupon URL'],
      'Coupon Deep Link': data['Coupon Deep Link'],
      'Deeplink': data['Deeplink'],
      'url': data.url,
      'Final couponUrl': couponUrl
    });
  }
  
  return {
    id: docId || data['Coupon Id'] || data.id || '',
    code: couponCode,
    storeName: storeName,
    storeIds: storeIdsArray,
    discount: data.discount ? parseFloat(String(data.discount)) : 0,
    discountType: data.discount_type || data.discountType || 'percentage',
    description: decodeHtmlEntities(rawDescription) || '',
    title: decodeHtmlEntities(rawTitle) || null,
    isActive: data.is_active !== false && data.isActive !== false,
    maxUses: data.max_uses || data.maxUses || 1000,
    currentUses: data.current_uses || data.currentUses || 0,
    expiryDate: expiryDate,
    logoUrl: data.logo_url || data.logoUrl || null,
    url: couponUrl, // This should be from "Coupon URL" column if set
    affiliateLink: data.affiliate_link || data.affiliateLink || null,
    couponType: couponType,
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

    // Check for cache bypass parameter
    const bypassCache = searchParams.get('_t') !== null; // If _t parameter exists, bypass cache

    // Create cache key from params
    const cacheKey = `${id || ''}-${categoryId || ''}-${storeId || ''}-${activeOnly}`;
    const now = Date.now();

    // Check cache for list queries (not single item) - skip if bypassCache is true
    const couponsCache = getCouponsCache();
    if (!id && !bypassCache && couponsCache.data && couponsCache.key === cacheKey && (now - couponsCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        { success: true, coupons: couponsCache.data },
        { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
      );
    }

    const tableName = 'coupons';
    const storesTableName = 'stores';

    // Get coupon by ID (no cache)
    if (id) {
      // Try by Supabase row ID first, then by Coupon Id field
      // Explicitly select Coupon URL column to ensure it's included
      let { data: couponData, error: couponError } = await supabaseAdmin
        .from(tableName)
        .select('*, "Coupon URL", "Coupon Deep Link"')
        .eq('id', id)
        .single();
      
      // If not found by row ID, try by Coupon Id field
      if (couponError || !couponData) {
        const { data: couponByCustomId, error: errorByCustomId } = await supabaseAdmin
          .from(tableName)
          .select('*, "Coupon URL", "Coupon Deep Link"')
          .eq('Coupon Id', id)
          .single();
        if (!errorByCustomId && couponByCustomId) {
          couponData = couponByCustomId;
          couponError = null;
        }
      }
      
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
        coupon: convertToAPIFormat(couponData, id, storeData),
      });
    }

    // Get all coupons with filters - explicitly include Coupon URL column
    let query = supabaseAdmin.from(tableName).select('*, "Coupon URL", "Coupon Deep Link"');
    
    let numericStoreId: string | null = null;
    let isUuid = false;
    
    if (storeId) {
      // Handle both UUID and numeric Store Id
      // First, try to get the numeric Store Id if storeId is a UUID
      numericStoreId = storeId;
      
      // Check if storeId looks like a UUID (contains hyphens)
      if (storeId.includes('-')) {
        isUuid = true;
        // It's likely a UUID, fetch the store to get its numeric Store Id
        const { data: storeData, error: storeError } = await supabaseAdmin
          .from(storesTableName)
          .select('"Store Id"')
          .eq('id', storeId)
          .single();
        
        if (storeError) {
          console.warn('⚠️ Could not fetch store to get numeric Store Id:', storeError);
        }
        
        if (storeData && storeData['Store Id']) {
          numericStoreId = String(storeData['Store Id']);
          console.log(`✅ Converted UUID ${storeId} to numeric Store Id: ${numericStoreId}`);
        } else {
          console.warn(`⚠️ Store with UUID ${storeId} not found or has no numeric Store Id`);
        }
      }
      
      console.log(`🔍 Querying coupons with Store Id: ${numericStoreId} (original: ${storeId}, isUuid: ${isUuid})`);
      
      // Query by numeric Store Id (with two spaces) - primary query
      // Also check store_ids array for UUID matches if original was UUID
      if (isUuid && numericStoreId) {
        // Try multiple approaches: numeric Store Id, UUID in Store Id field, or UUID in store_ids array
        // Use OR to check all possibilities
        query = query.or(`Store  Id.eq.${numericStoreId},Store  Id.eq.${storeId},store_ids.cs.{${storeId}}`);
      } else if (numericStoreId) {
        // Try both numeric Store Id and original storeId (in case it's already numeric)
        query = query.or(`Store  Id.eq.${numericStoreId},Store  Id.eq.${storeId}`);
      }
    }
    if (categoryId) query = query.or(`category_id.eq.${categoryId},categoryId.eq.${categoryId}`);
    
    console.log('📊 Fetching coupons from Supabase...');
    let { data: coupons, error: couponsError } = await query;
    
    // If no coupons found, try fallback: fetch all and filter manually (better matching)
    if (storeId && (!coupons || coupons.length === 0)) {
      console.log(`⚠️ No coupons found with primary query for storeId: ${storeId}, trying fallback: fetch all and filter manually...`);
      // Explicitly include Coupon URL column
      let fallbackQuery = supabaseAdmin.from(tableName).select('*, "Coupon URL", "Coupon Deep Link"');
      if (categoryId) fallbackQuery = fallbackQuery.or(`category_id.eq.${categoryId},categoryId.eq.${categoryId}`);
      
      const { data: allCoupons, error: fallbackError } = await fallbackQuery;
      if (!fallbackError && allCoupons) {
        console.log(`📊 Fetched ${allCoupons.length} total coupons for manual filtering`);
        
        // Also get store name from storeId for name-based matching
        let storeNameFromDb: string | null = null;
        if (isUuid && storeId) {
          const { data: storeInfo } = await supabaseAdmin
            .from(storesTableName)
            .select('"Store Name"')
            .eq('id', storeId)
            .single();
          if (storeInfo && storeInfo['Store Name']) {
            storeNameFromDb = storeInfo['Store Name'];
            console.log(`📋 Store name from database: "${storeNameFromDb}"`);
          }
        }
        
        // Filter manually by checking multiple possibilities
        const filteredCoupons = allCoupons.filter((coupon: any) => {
          const couponStoreIds = coupon.store_ids || coupon.storeIds || [];
          const couponStoreId = coupon['Store  Id'];
          const couponStoreName = coupon['Store Name'];
          
          // Check multiple conditions:
          // 1. UUID in store_ids array
          const hasUuidInArray = Array.isArray(couponStoreIds) && couponStoreIds.includes(storeId);
          
          // 2. Numeric Store Id matches
          const numericIdMatches = numericStoreId && couponStoreId && String(couponStoreId) === String(numericStoreId);
          
          // 3. UUID matches Store Id field (in case UUID was saved directly)
          const uuidMatches = storeId.includes('-') && couponStoreId && String(couponStoreId) === String(storeId);
          
          // 4. Store name match (if we have store name from DB)
          const storeNameMatches = storeNameFromDb && couponStoreName && 
                                   couponStoreName.toLowerCase().trim() === storeNameFromDb.toLowerCase().trim();
          
          const matches = hasUuidInArray || numericIdMatches || uuidMatches || storeNameMatches;
          
          if (matches) {
            console.log(`✅ Coupon matched:`, {
              couponId: coupon.id || coupon['Coupon Id'],
              couponStoreId: couponStoreId,
              couponStoreIds: couponStoreIds,
              couponStoreName: couponStoreName,
              storeId: storeId,
              numericStoreId: numericStoreId,
              storeNameFromDb: storeNameFromDb,
              matchType: hasUuidInArray ? 'UUID in array' : 
                        numericIdMatches ? 'Numeric ID' : 
                        uuidMatches ? 'UUID in Store Id' : 
                        'Store Name'
            });
          }
          
          return matches;
        });
        
        if (filteredCoupons.length > 0) {
          console.log(`✅ Found ${filteredCoupons.length} coupons using fallback query (manual filtering)`);
          // Replace coupons array with filtered results - need to reassign
          coupons = filteredCoupons;
        } else {
          console.log(`❌ Still no coupons found after fallback filtering. Sample coupon Store Ids:`, 
            allCoupons.slice(0, 5).map((c: any) => ({ 
              storeId: c['Store  Id'], 
              storeIds: c.store_ids,
              storeName: c['Store Name']
            }))
          );
        }
      } else if (fallbackError) {
        console.error('❌ Fallback query error:', fallbackError);
      }
    }
    if (couponsError) {
      console.error('❌ Error fetching coupons:', couponsError);
      console.error('❌ Error details:', JSON.stringify(couponsError, null, 2));
      throw couponsError;
    }
    
    console.log(`📊 Found ${coupons?.length || 0} coupons in Supabase`);
    if (coupons && coupons.length > 0) {
      console.log('📋 Raw Supabase data sample (first coupon):', JSON.stringify(coupons[0], null, 2));
    }

    // Get unique store IDs for batch fetch (both numeric and UUID)
    const numericStoreIds = new Set<string>();
    const uuidStoreIds = new Set<string>();
    
    coupons?.forEach((coupon: any) => {
      if (coupon['Store  Id']) {
        // Check if it's numeric or UUID
        if (coupon['Store  Id'].includes('-')) {
          uuidStoreIds.add(coupon['Store  Id']);
        } else {
          numericStoreIds.add(coupon['Store  Id']);
        }
      }
      if (coupon.store_ids && Array.isArray(coupon.store_ids)) {
        coupon.store_ids.forEach((id: string) => {
          if (id.includes('-')) {
            uuidStoreIds.add(id);
          } else {
            numericStoreIds.add(id);
          }
        });
      }
    });
    
    // Fetch store data - try both numeric IDs and UUIDs
    const storeDataMap = new Map();
    
    // Fetch by numeric Store Id
    if (numericStoreIds.size > 0) {
      const { data: storesByNumericId } = await supabaseAdmin
        .from(storesTableName)
        .select('*')
        .in('Store Id', Array.from(numericStoreIds));
      
      storesByNumericId?.forEach(store => {
        const storeIdKey = store['Store Id'];
        if (storeIdKey) {
          storeDataMap.set(storeIdKey, store);
          // Also map by UUID if available
          if (store.id) {
            storeDataMap.set(store.id, store);
          }
        }
      });
    }
    
    // Fetch by UUID (row id)
    if (uuidStoreIds.size > 0) {
      const { data: storesByUuid } = await supabaseAdmin
        .from(storesTableName)
        .select('*')
        .in('id', Array.from(uuidStoreIds));
      
      storesByUuid?.forEach(store => {
        if (store.id) {
          storeDataMap.set(store.id, store);
          // Also map by numeric Store Id if available
          if (store['Store Id']) {
            storeDataMap.set(store['Store Id'], store);
          }
        }
      });
    }
    
    console.log(`📊 Fetched ${storeDataMap.size} unique stores for coupon mapping`);

    // Convert coupons
    console.log(`📊 Converting ${coupons?.length || 0} coupons...`);
    if (coupons && coupons.length > 0) {
      console.log('📋 Sample coupon data (first row):', {
        id: coupons[0].id,
        couponId: coupons[0]['Coupon Id'],
        storeName: coupons[0]['Store Name'],
        couponTitle: coupons[0]['Coupon Title'],
        couponDesc: coupons[0]['Coupon Desc'],
        couponCode: coupons[0]['Coupon Code'],
        couponType: coupons[0]['Coupon Type'],
        couponExpiry: coupons[0]['Coupon Expiry'],
        couponDeepLink: coupons[0]['Coupon URL'] || coupons[0]['Coupon Deep Link'],
        storeId: coupons[0]['Store  Id'],
        is_active: coupons[0].is_active
      });
    }
    
    let convertedCoupons = (coupons || []).map((coupon: any) => {
      const couponStoreId = coupon['Store  Id'] || coupon.storeIds?.[0];
      const storeData = couponStoreId ? storeDataMap.get(couponStoreId) : null;
      // Use Supabase row id or Coupon Id field
      const couponId = coupon.id || coupon['Coupon Id'] || '';
      const converted = convertToAPIFormat(coupon, couponId, storeData);
      return converted;
    });

    console.log(`📊 Total coupons after conversion: ${convertedCoupons.length}`);
    if (convertedCoupons.length > 0) {
      console.log('📋 Sample converted coupon (first):', {
        id: convertedCoupons[0].id,
        storeName: convertedCoupons[0].storeName,
        code: convertedCoupons[0].code,
        title: convertedCoupons[0].title,
        description: convertedCoupons[0].description,
        couponType: convertedCoupons[0].couponType,
        url: convertedCoupons[0].url
      });
    }

    // Apply activeOnly filtering
    const beforeActiveFilter = convertedCoupons.length;
    if (activeOnly) {
      convertedCoupons = convertedCoupons.filter((coupon: any) => coupon.isActive !== false);
      console.log(`📊 After activeOnly filter: ${convertedCoupons.length} (removed ${beforeActiveFilter - convertedCoupons.length})`);
    }

    // Filter out expired coupons - but be lenient for Excel imports
    const beforeExpiryFilter = convertedCoupons.length;
    const nowDate = new Date();
    convertedCoupons = convertedCoupons.filter((coupon: any) => {
      // If no expiry date, include it
      if (!coupon.expiryDate) return true;
      
      let expiryDate: Date | null = null;
      if (coupon.expiryDate instanceof Date) {
        expiryDate = coupon.expiryDate;
      } else if (typeof coupon.expiryDate === 'string') {
        const dateStr = coupon.expiryDate.trim();
        // Allow empty/null dates
        if (!dateStr || dateStr === '0000-00-00' || dateStr === 'null' || dateStr === 'NULL' || dateStr === '') return true;
        expiryDate = new Date(dateStr);
        // If date parsing fails, include the coupon (be lenient)
        if (isNaN(expiryDate.getTime())) {
          console.warn('⚠️ Invalid expiry date format, including coupon:', dateStr);
          return true;
        }
        // Filter out invalid dates (like 1970 epoch time errors) - treat as no expiry
        if (expiryDate.getFullYear() < 2000) {
          console.warn('⚠️ Invalid expiry date (before 2000), treating as no expiry:', dateStr);
          return true; // Include coupon if date is invalid/too old
        }
      } else if (coupon.expiryDate && typeof (coupon.expiryDate as any).toDate === 'function') {
        expiryDate = (coupon.expiryDate as any).toDate();
      }
      
      // Only filter out if we have a valid future date that's actually expired
      if (expiryDate && expiryDate.getFullYear() >= 2000) {
        return expiryDate >= nowDate;
      }
      
      // Include coupon if no valid expiry date
      return true;
    });
    
    console.log(`📊 After expiry filter: ${convertedCoupons.length} (removed ${beforeExpiryFilter - convertedCoupons.length})`);

    // Update cache
    setCouponsCache(convertedCoupons, now, cacheKey);

    console.log(`✅ Returning ${convertedCoupons.length} coupons to client (out of ${coupons?.length || 0} raw coupons from DB)`);
    
    // Debug: Log why coupons might be missing
    if (convertedCoupons.length === 0 && coupons && coupons.length > 0) {
      console.warn('⚠️ WARNING: Raw coupons exist but convertedCoupons is empty!');
      console.warn('⚠️ This might indicate a conversion or filtering issue');
    }
    
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

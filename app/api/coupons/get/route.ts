// Server-side coupons read route
// Uses Firebase Firestore (migrated from Supabase)

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

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
  
  return {
    id: docId || data['Coupon Id'] || '',
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
    const firestore = getAdminFirestore();
    const collectionName = process.env.NEXT_PUBLIC_COUPONS_COLLECTION || 'coupons-mimecode';

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const categoryId = searchParams.get('categoryId');
    const storeId = searchParams.get('storeId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Get coupon by ID
    if (id) {
      const docRef = firestore.collection(collectionName).doc(id);
      const docSnap = await docRef.get();
      
      if (!docSnap.exists) {
        return NextResponse.json({
          success: true,
          coupon: null,
        });
      }
      
      // Get store data for fallback URL
      let storeData = null;
      const couponData = docSnap.data();
      if (couponData && (couponData['Store  Id'] || couponData.storeIds?.[0])) {
        const storeIdToFetch = couponData['Store  Id'] || couponData.storeIds?.[0];
        const storesCollection = process.env.NEXT_PUBLIC_STORES_COLLECTION || 'stores-mimecode';
        const storeDoc = await firestore.collection(storesCollection).doc(storeIdToFetch).get();
        if (storeDoc.exists) {
          storeData = storeDoc.data();
        }
      }
      
      return NextResponse.json({
        success: true,
        coupon: convertToAPIFormat(docSnap, id, storeData),
      });
    }

    // Get all coupons
    let query: any = firestore.collection(collectionName);
    
    // Apply filters
    if (categoryId) {
      query = query.where('category_id', '==', categoryId).where('categoryId', '==', categoryId);
    }
    
    if (storeId) {
      // Firestore doesn't support OR queries easily, so we'll filter in memory
      // For now, check both 'Store  Id' and storeIds array
    }

    const snapshot = await query.get();
    console.log(`📊 Fetched ${snapshot.size} coupons from Firestore`);

    // Get unique store IDs for batch fetch
    const storeIds = new Set<string>();
    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      if (data['Store  Id']) storeIds.add(data['Store  Id']);
      if (data.storeIds && Array.isArray(data.storeIds)) {
        data.storeIds.forEach((id: string) => storeIds.add(id));
      }
    });
    
    // Fetch store data for all unique store IDs
    const storeDataMap = new Map();
    if (storeIds.size > 0) {
      const storesCollection = process.env.NEXT_PUBLIC_STORES_COLLECTION || 'stores-mimecode';
      const storePromises = Array.from(storeIds).map(async (storeId) => {
        try {
          const storeDoc = await firestore.collection(storesCollection).doc(storeId).get();
          if (storeDoc.exists) {
            return { id: storeId, data: storeDoc.data() };
          }
        } catch (error) {
          console.warn(`Failed to fetch store ${storeId}:`, error);
        }
        return null;
      });
      
      const storeResults = await Promise.all(storePromises);
      storeResults.forEach(result => {
        if (result) {
          storeDataMap.set(result.id, result.data);
        }
      });
    }

    // Convert coupons with store data fallback
    let convertedCoupons = snapshot.docs.map((doc: any) => {
      const data = doc.data();
      const storeId = data['Store  Id'] || data.storeIds?.[0];
      const storeData = storeId ? storeDataMap.get(storeId) : null;
      return convertToAPIFormat(doc, doc.id, storeData);
    });

    // Apply storeId filter if provided
    if (storeId) {
      convertedCoupons = convertedCoupons.filter((coupon: any) => {
        return coupon.storeIds?.includes(storeId) || 
               coupon.storeIds?.some((id: string) => id === storeId);
      });
    }

    console.log(`📊 Converted ${convertedCoupons.length} coupons`);

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
    console.error('Firebase get coupons error:', error);
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

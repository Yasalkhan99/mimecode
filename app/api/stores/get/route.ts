// Server-side stores read route
// Uses Supabase with caching

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Simple in-memory cache
let storesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 60 seconds cache

// Export function to clear cache (used by update route)
export function clearStoresCache() {
  storesCache = { data: null, timestamp: 0 };
}

// Helper function to extract domain from URL
const extractDomain = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  let cleanUrl = url.trim();
  
  // Remove protocol if present
  cleanUrl = cleanUrl.replace(/^https?:\/\//, '');
  
  // Remove www. if present
  cleanUrl = cleanUrl.replace(/^www\./, '');
  
  // Remove trailing slashes and paths
  cleanUrl = cleanUrl.split('/')[0];
  
  // Remove trailing dots
  cleanUrl = cleanUrl.replace(/\.+$/, '');
  
  return cleanUrl || null;
};

// Helper function to get favicon/logo from website URL
const getLogoFromWebsite = (websiteUrl: string | null | undefined): string | null => {
  const domain = extractDomain(websiteUrl);
  if (!domain) return null;
  
  // Use Google's favicon service as fallback (reliable and fast)
  // Size 128 gives good quality logo
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
};

// Helper function to convert logo filename to full URL
const getLogoUrl = (logo: string | null | undefined, websiteUrl?: string | null): string => {
  // If logo is provided and not empty
  if (logo && logo.trim()) {
    // If it's already a full URL (starts with http:// or https://), return as is
    if (logo.startsWith('http://') || logo.startsWith('https://')) {
      return logo;
    }
    
    // If it's a Cloudinary URL, return as is
    if (logo.includes('cloudinary.com')) {
      return logo;
    }
    
    // Otherwise, it's a filename - try to construct full URL
    // First, try environment variable base URL (highest priority)
    const envBaseUrl = process.env.NEXT_PUBLIC_STORE_LOGO_BASE_URL;
    if (envBaseUrl) {
      return `${envBaseUrl.replace(/\/$/, '')}/${logo}`;
    }
    
    // Try Cloudinary URL if configured (before common paths)
    const cloudinaryCloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    if (cloudinaryCloudName) {
      // Try different Cloudinary folder structures (store_logos is most common)
      const cloudinaryFolders = ['store_logos', 'stores', 'logos/stores', 'images/stores'];
      // Return first Cloudinary URL attempt - browser will handle 404 gracefully
      return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${cloudinaryFolders[0]}/${logo}`;
    }
    
    // Try common base paths (for public folder in Next.js)
    const commonPaths = [
      '/images/stores/',
      '/stores/logos/',
      '/logos/stores/',
      '/images/',
    ];
    
    // Return the first common path as default
    return `${commonPaths[0]}${logo}`;
  }
  
  // If logo is missing/empty, try to extract from website URL
  if (websiteUrl) {
    const logoFromWebsite = getLogoFromWebsite(websiteUrl);
    if (logoFromWebsite) {
      return logoFromWebsite;
    }
  }
  
  // Return empty string if nothing found
  return '';
};

// Helper to normalize category id from various legacy columns
const normalizeCategoryId = (row: any): string | null => {
  const raw =
    row.category_id ??
    row['category_id'] ??
    row['Parent Category Id'] ??
    row['Cate Ids'] ??
    row.categoryId ??
    null;

  if (!raw) return null;

  if (Array.isArray(raw)) {
    const first = raw.find(Boolean);
    return first ? String(first).trim() : null;
  }

  const str = String(raw).trim();
  if (!str) return null;

  // Handle comma/pipe/semicolon separated lists, prefer the first entry
  const firstToken = str.split(/[|,;]/)[0].trim();
  return firstToken || null;
};

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any) => {
  // Use Store Id as primary id if UUID id doesn't exist
  const storeIdValue = row['Store Id'] || row.store_id || '';
  const uuidId = row.id || null;
  
  const rawLogo = row['Store Logo'] || row.logo_url || '';
  // Get Tracking Url separately
  const trackingUrl = row['Tracking Url'] || row['Tracking Url'] || row.tracking_url || '';
  // Get Tracking Link separately - try multiple column name variations
  const trackingLink = row['Tracking Link'] || row['TrackingLink'] || row.tracking_link || row.trackingLink || '';
  // Get website URL separately (prefer Store Display Url, then website_url)
  const websiteUrl = row['Store Display Url'] || row.website_url || '';
  // Use trackingUrl for logo extraction if available, otherwise use websiteUrl
  const rawWebsiteUrl = trackingUrl || websiteUrl;
  
  // Determine logo URL strategy:
  // 1. If logo is a full URL (http/https/cloudinary), use it directly
  // 2. If logo is just a filename, prefer website favicon (since file might not exist)
  // 3. If no logo at all, use website favicon
  
  let logoUrl = '';
  
  if (rawLogo && (rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.includes('cloudinary.com'))) {
    // Logo is a full URL - use it directly
    logoUrl = rawLogo;
  } else if (rawLogo && rawLogo.trim()) {
    // Logo is a filename - try file first, but also prepare website fallback
    const fileBasedLogo = getLogoUrl(rawLogo, null); // Don't pass websiteUrl here to avoid recursion
    // If we have website URL, prefer favicon since file might not exist
    if (rawWebsiteUrl) {
      const websiteFavicon = getLogoFromWebsite(rawWebsiteUrl);
      // Use website favicon directly (more reliable than guessing file paths)
      logoUrl = websiteFavicon || fileBasedLogo || '';
    } else {
      logoUrl = fileBasedLogo;
    }
  } else if (rawWebsiteUrl) {
    // No logo at all - use website favicon
    logoUrl = getLogoFromWebsite(rawWebsiteUrl) || '';
  }

  // Normalize category id (handles legacy formats and lists)
  const mainCategoryId = normalizeCategoryId(row);

  return {
    id: uuidId || storeIdValue, // Use UUID if exists, otherwise use Store Id
    name: row['Store Name'] || row.name || '',
    slug: row.Slug || row.slug || '',
    networkId: (row['Network ID'] || row['Network Id'] || row.network_id || '').toString().trim(),
    logoUrl: logoUrl, // Logo URL with smart fallback to website favicon
    description: row.description || row['Store Description'] || row['Store Summary'] || '',
    websiteUrl: websiteUrl,
    trackingUrl: trackingUrl || null, // Separate tracking URL
    trackingLink: trackingLink && trackingLink.trim() ? trackingLink.trim() : null, // Separate tracking Link
    countryCodes: Array.isArray(row['country_codes']) 
      ? row['country_codes'].join(',') // Convert array to comma-separated string
      : (row['country_codes'] || row.countryCodes || '').toString().trim() || null, // Country codes
    // Expose both normalized mainCategoryId and backward-compatible categoryId
    mainCategoryId,
    categoryId: mainCategoryId,
    storeId: storeIdValue,
    merchantId: row['Merchant Id'] || row.merchant_id || '',
    whyTrustUs: row.why_trust_us || null, // Dynamic "Why Trust Us" content
    moreInformation: row.more_information || null, // Dynamic "More Information" content
    rating: row.rating ? parseFloat(row.rating) : 4.5, // Store rating
    reviewCount: row.review_count || 0, // Number of reviews
    seoTitle: row.seo_title || null, // SEO page title
    seoDescription: row.seo_description || null, // SEO meta description
    createdAt: row['Created Date'] || row.created_at || null,
    updatedAt: row['Modify Date'] || row.updated_at || null,
  };
};

// Helper to enrich stores with mainCategoryId and categoryName
const enrichStoresWithCategory = async (stores: any[]) => {
  if (!stores || stores.length === 0) return stores;

  // If Supabase admin client is not initialized, still return stores with basic category info
  const admin = supabaseAdmin;
  if (!admin) {
    return stores.map((store) => ({
      ...store,
      mainCategoryId: store.mainCategoryId || store.categoryId || null,
      categoryName: null,
    }));
  }

  // Collect unique, truthy categoryIds from the already converted stores
  const categoryIds = Array.from(
    new Set(
      stores
        .map((s) => s.mainCategoryId || s.categoryId)
        .filter((id: any): id is string => !!id && typeof id === 'string')
    )
  );

  if (categoryIds.length === 0) {
    // No category information available; still add the fields with nulls
    return stores.map((store) => ({
      ...store,
      mainCategoryId: store.mainCategoryId || store.categoryId || null,
      categoryName: null,
    }));
  }

  try {
    const { data: categories, error } = await admin
      .from('categories')
      .select('id, name')
      .in('id', categoryIds);

    if (error) {
      // console.error('Error fetching categories for stores:', error);
      return stores.map((store) => ({
        ...store,
        mainCategoryId: store.categoryId || null,
        categoryName: null,
      }));
    }

    const categoryMap: Record<string, string> = {};
    (categories || []).forEach((cat: any) => {
      if (cat.id) {
        categoryMap[cat.id] = cat.name || '';
      }
    });

    return stores.map((store) => {
      const catId = store.mainCategoryId || store.categoryId || null;
      const name = catId ? categoryMap[catId] || null : null;
      return {
        ...store,
        mainCategoryId: catId,
        categoryName: name,
      };
    });
  } catch (err) {
    console.error('Unexpected error enriching stores with category info:', err);
    return stores.map((store) => ({
      ...store,
      mainCategoryId: store.mainCategoryId || store.categoryId || null,
      categoryName: null,
    }));
  }
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const networkId = searchParams.get('networkId');
    const countryCode = searchParams.get('countryCode'); // Filter by country code

    let query = supabaseAdmin.from('stores').select('*');

    // Get store by ID
    if (id) {
      // Stores table doesn't have UUID 'id' column, only 'Store Id'
      const { data, error } = await supabaseAdmin
        .from('stores')
        .select('*')
        .eq('Store Id', id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const converted = data ? convertToAPIFormat(data) : null;
      const [enriched] = await enrichStoresWithCategory(converted ? [converted] : []);
      
      return NextResponse.json({
        success: true,
        store: enriched || null,
      });
    }

    // Get store by slug
    if (slug) {
      const { data, error } = await query.eq('Slug', slug).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const converted = data ? convertToAPIFormat(data) : null;
      const [enriched] = await enrichStoresWithCategory(converted ? [converted] : []);

      return NextResponse.json({
        success: true,
        store: enriched || null,
      });
    }

    // Get store(s) by network ID
    if (networkId) {
      const { data, error } = await query.eq('Network ID', networkId);
      if (error) throw error;
      
      let convertedStores = (data || []).map(convertToAPIFormat);
      convertedStores = await enrichStoresWithCategory(convertedStores);
      
      if (convertedStores.length === 1) {
        return NextResponse.json({
          success: true,
          store: convertedStores[0],
          stores: convertedStores,
        });
      }
      return NextResponse.json({
        success: true,
        stores: convertedStores,
      });
    }

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Filter by country code if provided
    // country_codes is a TEXT[] array in Supabase, so we use cs (contains) operator
    if (countryCode) {
      query = query.contains('country_codes', [countryCode.toUpperCase()]);
    }

    // Check for cache-busting parameter
    const bypassCache = searchParams.get('_t') !== null;
    
    // Check cache for full list (no filters) - skip if bypassCache is true or countryCode filter is applied
    const now = Date.now();
    if (!bypassCache && !categoryId && !countryCode && storesCache.data && (now - storesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        { success: true, stores: storesCache.data },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
      );
    }

    // Get all stores
    const { data, error } = await query;
    if (error) throw error;

    let convertedStores = (data || []).map(convertToAPIFormat);
    convertedStores = await enrichStoresWithCategory(convertedStores);
    
    // Sort by Store Id numerically
    convertedStores.sort((a, b) => {
      const idA = parseInt(a.storeId || '0') || 0;
      const idB = parseInt(b.storeId || '0') || 0;
      return idB - idA;
    });

    // Update cache for full list (only if no filters applied)
    if (!categoryId && !countryCode) {
      storesCache = { data: convertedStores, timestamp: now };
    }

    return NextResponse.json(
      { success: true, stores: convertedStores },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
    );
  } catch (error: any) {
    console.error('Supabase get stores error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get stores',
        stores: [],
        store: null,
      },
      { status: 500 }
    );
  }
}


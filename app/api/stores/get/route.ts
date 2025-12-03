// Server-side stores read route
// Uses Supabase with caching

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Simple in-memory cache
let storesCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 60 seconds cache

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

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any) => {
  // Use Store Id as primary id if UUID id doesn't exist
  const storeIdValue = row['Store Id'] || row.store_id || '';
  const uuidId = row.id || null;
  
  const rawLogo = row['Store Logo'] || row.logo_url || '';
  // Try Tracking Url first (most reliable), then Store Display Url, then website_url
  const rawWebsiteUrl = row['Tracking Url'] || row['Store Display Url'] || row.website_url || '';
  
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
  
  return {
    id: uuidId || storeIdValue, // Use UUID if exists, otherwise use Store Id
    name: row['Store Name'] || row.name || '',
    slug: row.Slug || row.slug || '',
    networkId: row['Network Id'] || row.network_id || '',
    logoUrl: logoUrl, // Logo URL with smart fallback to website favicon
    description: row.description || row['Store Description'] || row['Store Summary'] || '',
    websiteUrl: rawWebsiteUrl,
    categoryId: row['Parent Category Id'] || row.category_id || row['Cate Ids'] || '',
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
      
      return NextResponse.json({
        success: true,
        store: data ? convertToAPIFormat(data) : null,
      });
    }

    // Get store by slug
    if (slug) {
      const { data, error } = await query.eq('Slug', slug).single();
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return NextResponse.json({
        success: true,
        store: data ? convertToAPIFormat(data) : null,
      });
    }

    // Get store(s) by network ID
    if (networkId) {
      const { data, error } = await query.eq('Network Id', networkId);
      if (error) throw error;
      
      const convertedStores = (data || []).map(convertToAPIFormat);
      
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

    // Check cache for full list (no filters)
    const now = Date.now();
    if (!categoryId && storesCache.data && (now - storesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        { success: true, stores: storesCache.data },
        { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } }
      );
    }

    // Get all stores
    const { data, error } = await query;
    if (error) throw error;

    const convertedStores = (data || []).map(convertToAPIFormat);
    
    // Sort by Store Id numerically
    convertedStores.sort((a, b) => {
      const idA = parseInt(a.storeId || '0') || 0;
      const idB = parseInt(b.storeId || '0') || 0;
      return idB - idA;
    });

    // Update cache for full list
    if (!categoryId) {
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


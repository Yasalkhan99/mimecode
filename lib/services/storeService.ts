import { Timestamp } from 'firebase/firestore';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export interface Store {
  id?: string;
  name: string;
  subStoreName?: string; // Sub store name displayed on store page
  slug?: string; // URL-friendly slug (e.g., "nike", "amazon")
  description: string;
  logoUrl?: string;
  voucherText?: string; // e.g., "Upto 58% Voucher"
  networkId?: string; // Network location ID to identify store location
  isTrending?: boolean;
  layoutPosition?: number | null; // Position in trending stores layout (1-8)
  categoryId?: string | null; // Category ID for this store
  // Detailed Store Info fields
  websiteUrl?: string; // Store's official website URL
  aboutText?: string; // Detailed about section for Store Info tab
  features?: string[]; // List of store features (e.g., ["Free Shipping", "24/7 Support"])
  shippingInfo?: string; // Shipping information
  returnPolicy?: string; // Return policy information
  contactInfo?: string; // Contact information
  trustScore?: number; // Trust score (0-100)
  establishedYear?: number; // Year store was established
  headquarters?: string; // Headquarters location
  whyTrustUs?: string; // Dynamic "Why Trust Us" content for store page
  moreInformation?: string; // Dynamic "More Information" content for store page
  rating?: number; // Store rating (0.0 to 5.0)
  reviewCount?: number; // Number of reviews
  seoTitle?: string; // SEO-optimized page title
  seoDescription?: string; // SEO-optimized meta description
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Use environment variable to separate collections between projects
// Default to 'stores-mimecode' for this new project
const stores = process.env.NEXT_PUBLIC_STORES_COLLECTION || 'stores-mimecode';

export async function getStores(): Promise<Store[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/stores/get?collection=${encodeURIComponent(stores)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stores) {
          return data.stores as Store[];
        }
      } else {
        // If API returns error, don't fallback to client-side (will cause permission errors)
        console.warn('Server API returned error, not falling back to client-side');
        return [];
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
      // Don't fallback to client-side to avoid permission errors
      return [];
    }

    // Removed client-side fallback to avoid permission errors
    // All store operations should go through server-side API routes
    return [];
  } catch (error) {
    console.error('Error getting stores:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

export async function getTrendingStores(): Promise<(Store | null)[]> {
  try {
    const allStores = await getStores();
    // Filter stores with layout positions (1-8) and isTrending
    const storesWithPositions = allStores
      .filter(store => store.isTrending && store.layoutPosition && store.layoutPosition >= 1 && store.layoutPosition <= 8)
      .sort((a, b) => (a.layoutPosition || 0) - (b.layoutPosition || 0));
    
    // Create array of 8 slots (positions 1-8)
    const layoutSlots: (Store | null)[] = Array(8).fill(null);
    
    // Fill slots with stores at their assigned positions
    storesWithPositions.forEach(store => {
      if (store.layoutPosition && store.layoutPosition >= 1 && store.layoutPosition <= 8) {
        layoutSlots[store.layoutPosition - 1] = store; // layoutPosition 1 = index 0
      }
    });
    
    return layoutSlots;
  } catch (error) {
    console.error('Error getting trending stores:', error);
    return Array(8).fill(null);
  }
}

export async function createStore(store: Omit<Store, 'id'>) {
  try {
    // Use server-side API route to create store (bypasses security rules)
    const res = await fetch('/api/stores/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        store,
        collection: stores,
      }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      // No fallback - API is required for Supabase
      return { success: false, error: json.error || json.text || 'Failed to create store' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating store:', error);
    return { success: false, error };
  }
}

export async function getStoreById(id: string): Promise<Store | null> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/stores/get?collection=${encodeURIComponent(stores)}&id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.store) {
          return data.store as Store;
        }
        return null;
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // No fallback - API is required for Supabase
    return null;
  } catch (error) {
    console.error('Error getting store:', error);
    return null;
  }
}

// Get store by slug
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/stores/get?collection=${encodeURIComponent(stores)}&slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.store) {
          return data.store as Store;
        }
        return null;
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // No fallback - API is required for Supabase
    return null;
  } catch (error) {
    console.error('Error getting store by slug:', error);
    return null;
  }
}

// Get store by network ID (location identifier)
export async function getStoreByNetworkId(networkId: string): Promise<Store | null> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/stores/get?collection=${encodeURIComponent(stores)}&networkId=${encodeURIComponent(networkId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.store) {
          return data.store as Store;
        }
        return null;
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // No fallback - API is required for Supabase
    return null;
  } catch (error) {
    console.error('Error getting store by network ID:', error);
    return null;
  }
}

// Get stores by network ID (in case multiple stores share same network ID)
export async function getStoresByNetworkId(networkId: string): Promise<Store[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/stores/get?collection=${encodeURIComponent(stores)}&networkId=${encodeURIComponent(networkId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // If single store returned, return as array
          if (data.store) {
            return [data.store as Store];
          }
          // If stores array returned
          if (data.stores && Array.isArray(data.stores)) {
            return data.stores as Store[];
          }
        }
        return [];
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // No fallback - API is required for Supabase
    return [];
  } catch (error) {
    console.error('Error getting stores by network ID:', error);
    return [];
  }
}

// Check if slug is unique (excluding current store ID if editing)
export async function isSlugUnique(slug: string, excludeStoreId?: string): Promise<boolean> {
  try {
    // Trim and validate slug
    const trimmedSlug = slug?.trim();
    if (!trimmedSlug) {
      console.warn('Empty slug provided');
      return false;
    }

    // Use server-side API route to check slug uniqueness (bypasses security rules)
    const res = await fetch('/api/stores/check-slug', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: trimmedSlug,
        excludeStoreId,
        collection: stores,
      }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    // Log for debugging
    console.log('Slug uniqueness check:', {
      slug: trimmedSlug,
      excludeStoreId,
      responseStatus: res.status,
      responseData: json
    });

    if (res.ok && json.success === true) {
      // Explicitly check isUnique property
      const isUnique = json.isUnique === true;
      console.log(`Slug "${trimmedSlug}" is ${isUnique ? 'unique' : 'already taken'}`);
      return isUnique;
    }

    // If API failed, log error
    console.warn('Server API failed:', {
      status: res.status,
      error: json.error || json.text || 'Unknown error'
    });

    // No fallback - API is required for Supabase
    // If API fails, return true to allow creation (better than blocking)
    console.warn('API check failed, allowing slug creation');
    return true;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    // If error occurs, return true to allow creation (better than blocking)
    // User can manually check if slug is duplicate
    console.warn('Error in slug check, allowing slug creation');
    return true;
  }
}

export async function updateStore(id: string, updates: Partial<Store>) {
  try {
    // Use server-side API route to update store (bypasses security rules)
    const res = await fetch('/api/stores/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates,
        collection: stores,
      }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      // No fallback - API is required for Supabase
      return { success: false, error: json.error || json.text || 'Failed to update store' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating store:', error);
    return { success: false, error };
  }
}

export async function deleteStore(id: string) {
  try {
    // Use server-side API route to delete store (bypasses security rules)
    const res = await fetch('/api/stores/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: stores,
      }),
    });

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      try {
        json = JSON.parse(resText || '{}');
      } catch (e) {
        json = { text: resText };
      }
    } catch (e) {
      console.error('Failed to read server response body', e);
    }

    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      // No fallback - API is required for Supabase
      return { success: false, error: json.error || json.text || 'Failed to delete store' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting store:', error);
    return { success: false, error };
  }
}

// Get stores by category ID
export async function getStoresByCategoryId(categoryId: string): Promise<Store[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/stores/get?collection=${encodeURIComponent(stores)}&categoryId=${encodeURIComponent(categoryId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.stores) {
          return data.stores as Store[];
        }
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // No fallback - API is required for Supabase
    return [];
  } catch (error) {
    console.error('Error getting stores by category:', error);
    return [];
  }
}


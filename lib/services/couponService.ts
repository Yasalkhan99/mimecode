import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export interface Coupon {
  id?: string;
  code: string;
  storeName?: string; // Name of the store/brand for this coupon
  storeIds?: string[]; // Array of store IDs this coupon is associated with
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
  title?: string; // Coupon title (e.g., "20% Off", "10% Off Sitewide")
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  expiryDate: Timestamp | null;
  logoUrl?: string;
  url?: string; // Coupon URL where user should be redirected
  affiliateLink?: string; // Fallback affiliate link when url is not available
  couponType?: 'code' | 'deal'; // Type of coupon: 'code' for coupon codes, 'deal' for deals
  isPopular?: boolean;
  layoutPosition?: number | null; // Position in popular coupons layout (1-8)
  isLatest?: boolean;
  latestLayoutPosition?: number | null; // Position in latest coupons layout (1-8)
  categoryId?: string | null; // Category ID for this coupon
  buttonText?: string; // Custom button text (e.g., "Get Code", "Get Deal", "Claim Now", etc.)
  dealScope?: 'sitewide' | 'online-only'; // Scope of the deal: 'sitewide' or 'online-only'
  userId?: string; // User ID of the coupon creator (for user-created coupons)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Use environment variable to separate collections between projects
// Default to 'coupons-mimecode' for this new project
const coupons = process.env.NEXT_PUBLIC_COUPONS_COLLECTION || 'coupons-mimecode';

// Create a new coupon (optionally upload a logoFile to Storage)
export async function createCoupon(coupon: Omit<Coupon, 'id'>, logoFile?: File) {
  try {
    let logoUrl: string | undefined;
    if (logoFile) {
      // Use server-side upload only (avoids CORS issues)
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(logoFile);
        });

        const uploadResponse = await fetch('/api/coupons/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: logoFile.name,
            contentType: logoFile.type || 'image/svg+xml',
            base64,
          }),
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.success && uploadData.logoUrl) {
            logoUrl = uploadData.logoUrl;
            console.log('✅ Logo uploaded successfully via server:', logoUrl);
          } else {
            console.warn('⚠️ Server upload returned success but no logoUrl:', uploadData);
          }
        } else {
          // Handle error response - try to parse JSON, fallback to status text
          let errorData: any = { error: `HTTP ${uploadResponse.status}` };
          let errorText = '';
          
          try {
            errorText = await uploadResponse.text();
            if (errorText) {
              try {
                errorData = JSON.parse(errorText);
              } catch (parseError) {
                // If not JSON, use the text as error message
                errorData = { error: errorText || `HTTP ${uploadResponse.status}` };
              }
            }
          } catch (e) {
            errorData = { error: `HTTP ${uploadResponse.status}: ${uploadResponse.statusText || 'Unknown error'}` };
          }
          
          const errorMessage = errorData.error || errorData.message || `HTTP ${uploadResponse.status}`;
          
          console.error('❌ Server-side upload failed:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorMessage,
            rawResponse: errorText.substring(0, 200) // First 200 chars for debugging
          });
          
          // Show user-friendly error message
          if (errorMessage.includes('FIREBASE_ADMIN_SA') || 
              errorMessage.includes('Admin SDK') || 
              errorMessage.includes('not configured') ||
              uploadResponse.status === 500) {
            console.warn('⚠️ Logo upload failed: Firebase Admin SDK not configured.');
            console.warn('💡 To enable logo uploads:');
            console.warn('   1. Go to Firebase Console → Project Settings → Service Accounts');
            console.warn('   2. Click "Generate New Private Key"');
            console.warn('   3. Copy the JSON and add to .env.local as:');
            console.warn('      FIREBASE_ADMIN_SA=\'{"type":"service_account",...}\'');
            console.warn('   4. Restart your dev server');
          } else {
            console.warn('⚠️ Logo upload failed:', errorMessage);
          }
          console.warn('✅ Coupon will be created without logo');
        }
      } catch (serverError) {
        console.error('Error during server-side upload:', serverError);
        // Continue without logo - coupon can still be created
        console.warn('Creating coupon without logo due to upload error');
      }
    }

    const couponData = {
      ...coupon,
      ...(logoUrl ? { logoUrl } : {}),
    };
    
    // Debug log to verify storeIds are included
    // if (coupon.storeIds) {
    //   console.log('✅ Saving coupon with storeIds:', coupon.storeIds);
    // } else {
    //   console.log('⚠️ Coupon created without storeIds');
    // }
    
    // Use server-side API route to create coupon (bypasses security rules)
    const res = await fetch('/api/coupons/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon: couponData,
        collection: coupons,
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
      // Don't fallback to client-side to avoid permission errors
      return { success: false, error: json.error || json.text || 'Failed to create coupon' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error };
  }
}

// Get all coupons
export async function getCoupons(): Promise<Coupon[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/coupons/get?collection=${encodeURIComponent(coupons)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.coupons) {
          return data.coupons as Coupon[];
        }
      } else {
        console.warn('Server API returned error, not falling back to client-side');
        return [];
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
      return [];
    }

    // Removed client-side fallback to avoid permission errors
    return [];
  } catch (error) {
    console.error('Error getting coupons:', error);
    return [];
  }
}

// Get active coupons
export async function getActiveCoupons(): Promise<Coupon[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/coupons/get?activeOnly=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.coupons) {
          return data.coupons as Coupon[];
        }
      } else {
        console.warn('Server API returned error, not falling back to client-side');
        return [];
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
      return [];
    }

    // Removed client-side fallback to avoid permission errors
    return [];
  } catch (error) {
    console.error('Error getting active coupons:', error);
    return [];
  }
}

// Get coupon by ID
export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/coupons/get?collection=${encodeURIComponent(coupons)}&id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.coupon) {
          return data.coupon as Coupon;
        }
        return null;
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // Removed client-side fallback to avoid permission errors
    return null;
  } catch (error) {
    console.error('Error getting coupon:', error);
    return null;
  }
}

// Update a coupon
export async function updateCoupon(id: string, updates: Partial<Coupon>) {
  try {
    console.log('🔄 Updating coupon:', { id, updates });
    
    // Use server-side API route to update coupon (bypasses security rules)
    const res = await fetch('/api/coupons/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates,
        collection: coupons,
      }),
    });

    console.log('📡 Server response status:', res.status, res.statusText);

    let json: any = {};
    let resText = '';
    try {
      resText = await res.text();
      console.log('📄 Raw response text:', resText);
      try {
        json = JSON.parse(resText || '{}');
        console.log('📦 Parsed JSON:', json);
      } catch (e) {
        console.error('❌ Failed to parse JSON:', e);
        json = { text: resText };
      }
    } catch (e) {
      console.error('❌ Failed to read server response body:', e);
    }

    if (!res.ok) {
      console.error('❌ Server update failed', { 
        status: res.status, 
        statusText: res.statusText,
        body: json,
        rawText: resText 
      });
      // Don't fallback to client-side to avoid permission errors
      return { success: false, error: json.error || json.text || `Server error: ${res.status} ${res.statusText}` };
    }

    console.log('✅ Coupon updated successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating coupon:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

// Delete a coupon
export async function deleteCoupon(id: string) {
  try {
    // Use server-side API route to delete coupon (bypasses security rules)
    const res = await fetch('/api/coupons/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: coupons,
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
      // Don't fallback to client-side to avoid permission errors
      return { success: false, error: json.error || json.text || 'Failed to delete coupon' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error };
  }
}

// Get coupons by category ID
export async function getCouponsByCategoryId(categoryId: string): Promise<Coupon[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/coupons/get?collection=${encodeURIComponent(coupons)}&categoryId=${encodeURIComponent(categoryId)}&activeOnly=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.coupons) {
          return data.coupons as Coupon[];
        }
      } else {
        console.warn('Server API returned error, not falling back to client-side');
        return [];
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
      return [];
    }

    // Removed client-side fallback to avoid permission errors
    return [];
  } catch (error) {
    console.error('Error getting coupons by category:', error);
    return [];
  }
}

// Get coupons by store name
export async function getCouponsByStoreName(storeName: string): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, coupons),
      where('storeName', '==', storeName),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Coupon));
  } catch (error) {
    console.error('Error getting coupons by store name:', error);
    return [];
  }
}

// Get coupons by store ID
export async function getCouponsByStoreId(storeId: string): Promise<Coupon[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/coupons/get?collection=${encodeURIComponent(coupons)}&storeId=${encodeURIComponent(storeId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.coupons) {
          return data.coupons as Coupon[];
        }
      } else {
        console.warn('Server API returned error, not falling back to client-side');
        return [];
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
      return [];
    }

    // Removed client-side fallback to avoid permission errors
    return [];
  } catch (error) {
    console.error('Error getting coupons by store ID:', error);
    return [];
  }
}

// Validate and apply coupon
export async function applyCoupon(code: string) {
  try {
    const q = query(
      collection(db, coupons),
      where('code', '==', code.toUpperCase()),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { valid: false, message: 'Coupon not found' };
    }

    const coupon = querySnapshot.docs[0].data() as Coupon;

    if (coupon.currentUses >= coupon.maxUses) {
      return { valid: false, message: 'Coupon usage limit reached' };
    }

    if (coupon.expiryDate) {
      const now = new Date();
      // Handle expiryDate - can be string, Date, or Firestore Timestamp
      let expiryTime: Date;
      if (coupon.expiryDate instanceof Date) {
        expiryTime = coupon.expiryDate;
      } else if (coupon.expiryDate instanceof Timestamp || (coupon.expiryDate && typeof (coupon.expiryDate as any).toDate === 'function')) {
        expiryTime = (coupon.expiryDate as Timestamp).toDate();
      } else if (typeof coupon.expiryDate === 'string') {
        expiryTime = new Date(coupon.expiryDate);
      } else if (typeof coupon.expiryDate === 'number') {
        expiryTime = new Date(coupon.expiryDate);
      } else {
        // Fallback: try to convert to string first, then to Date
        expiryTime = new Date(String(coupon.expiryDate));
      }
      if (now > expiryTime) {
        return { valid: false, message: 'Coupon has expired' };
      }
    }

    return { valid: true, coupon, id: querySnapshot.docs[0].id };
  } catch (error) {
    console.error('Error validating coupon:', error);
    return { valid: false, message: 'Error validating coupon' };
  }
}

/**
 * Create a coupon from a logo URL (e.g., Cloudinary URL)
 * Automatically extracts the original image URL if it's a Cloudinary URL
 */
export async function createCouponFromUrl(coupon: Omit<Coupon, 'id'>, logoUrl?: string) {
  try {
    let finalLogoUrl: string | undefined;
    if (logoUrl && logoUrl.trim() !== '') {
      // For Cloudinary URLs, use them directly (they're already optimized)
      // Only extract if the URL seems malformed
      if (logoUrl.includes('res.cloudinary.com')) {
        // Check if URL is malformed (has /image/image/upload/)
        if (logoUrl.includes('/image/image/upload/') || logoUrl.match(/res\.cloudinary\.com\/image\//)) {
          // Extract to fix malformed URL
          finalLogoUrl = extractOriginalCloudinaryUrl(logoUrl);
          // console.log('🔧 Fixed malformed Cloudinary URL:', { original: logoUrl, fixed: finalLogoUrl });
        } else {
          // Use Cloudinary URL directly (it's already correct)
          finalLogoUrl = logoUrl;
          // console.log('✅ Using Cloudinary URL directly:', finalLogoUrl);
        }
      } else {
        // For non-Cloudinary URLs, use as-is
        finalLogoUrl = logoUrl;
      }
    }

    const couponData = {
      ...coupon,
      ...(finalLogoUrl ? { logoUrl: finalLogoUrl } : {}),
    };
    
    // Debug log to verify storeIds and logoUrl are included
    // console.log('📝 Creating coupon from URL:', {
    //   storeIds: coupon.storeIds,
    //   logoUrl: finalLogoUrl,
    //   hasLogoUrl: !!finalLogoUrl,
    //   couponDataLogoUrl: couponData.logoUrl,
    //   fullCouponData: JSON.stringify(couponData, null, 2)
    // });
    
    // Use server-side API route to create coupon (bypasses security rules)
    const res = await fetch('/api/coupons/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon: couponData,
        collection: coupons,
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
      // Don't fallback to client-side to avoid permission errors
      return { success: false, error: json.error || json.text || 'Failed to create coupon from URL' };
    }

    // console.log('✅ Coupon created successfully with ID:', json.id);
    // console.log('📋 Saved coupon data (logoUrl):', couponData.logoUrl);
    
    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating coupon from URL:', error);
    return { success: false, error };
  }
}

// Get popular coupons with layout positions
export async function getPopularCoupons(): Promise<(Coupon | null)[]> {
  try {
    const allCoupons = await getCoupons();
    // Filter coupons with layout positions (1-8) and isPopular
    const couponsWithPositions = allCoupons
      .filter(coupon => coupon.isPopular && coupon.layoutPosition && coupon.layoutPosition >= 1 && coupon.layoutPosition <= 8)
      .sort((a, b) => (a.layoutPosition || 0) - (b.layoutPosition || 0));
    
    // Create array of 8 slots (positions 1-8)
    const layoutSlots: (Coupon | null)[] = Array(8).fill(null);
    
    // Fill slots with coupons at their assigned positions
    couponsWithPositions.forEach(coupon => {
      if (coupon.layoutPosition && coupon.layoutPosition >= 1 && coupon.layoutPosition <= 8) {
        layoutSlots[coupon.layoutPosition - 1] = coupon; // layoutPosition 1 = index 0
      }
    });
    
    return layoutSlots;
  } catch (error) {
    console.error('Error getting popular coupons:', error);
    return Array(8).fill(null);
  }
}

// Get latest coupons - prioritizes coupons with isLatest=true and latestLayoutPosition
// Falls back to most recently uploaded coupons if positions not assigned
export async function getLatestCoupons(): Promise<(Coupon | null)[]> {
  try {
    // Get active coupons (already filtered for active and not expired)
    const allCoupons = await getActiveCoupons();
    
    // Filter to only code type coupons
    const codeCoupons = allCoupons.filter(coupon => 
      coupon.couponType === 'code' || !coupon.couponType
    );
    
    // Separate coupons with assigned layout positions
    const couponsWithPosition = codeCoupons.filter(c => 
      c.isLatest && c.latestLayoutPosition !== null && c.latestLayoutPosition !== undefined
    );
    
    // Create array with 8 slots (1-8)
    const result: (Coupon | null)[] = Array(8).fill(null);
    
    // Fill assigned positions first
    couponsWithPosition.forEach(coupon => {
      const position = coupon.latestLayoutPosition;
      if (position !== null && position !== undefined && position >= 1 && position <= 8) {
        const index = position - 1; // Convert to 0-based index
        result[index] = coupon;
      }
    });
    
    // Fill remaining empty slots with most recent coupons (sorted by created_at)
    const emptySlots = result.map((coupon, index) => coupon === null ? index : -1)
      .filter(index => index !== -1);
    
    if (emptySlots.length > 0) {
      // Get coupons without assigned positions, sorted by created_at
      const unassignedCoupons = codeCoupons
        .filter(c => !c.isLatest || !c.latestLayoutPosition)
        .sort((a, b) => {
          const getDate = (coupon: Coupon): number => {
            if (!coupon.createdAt) return 0;
            
            if (typeof coupon.createdAt === 'number') {
              return coupon.createdAt;
            }
            
            if (coupon.createdAt instanceof Date) {
              return coupon.createdAt.getTime();
            }
            
            if (coupon.createdAt && typeof (coupon.createdAt as any).toDate === 'function') {
              return (coupon.createdAt as any).toDate().getTime();
            }
            
            if (typeof coupon.createdAt === 'string') {
              const parsed = new Date(coupon.createdAt).getTime();
              return isNaN(parsed) ? 0 : parsed;
            }
            
            return 0;
          };
          
          const dateA = getDate(a);
          const dateB = getDate(b);
          
          return dateB - dateA; // Sort descending (newest first)
        });
      
      // Fill empty slots with most recent coupons
      let unassignedIndex = 0;
      emptySlots.forEach(slotIndex => {
        if (unassignedIndex < unassignedCoupons.length) {
          result[slotIndex] = unassignedCoupons[unassignedIndex];
          unassignedIndex++;
        }
      });
    }
    
    const assignedCount = couponsWithPosition.length;
    const filledCount = result.filter(c => c !== null).length;
    
    // console.log(`📊 Latest coupons: ${assignedCount} with assigned positions, ${filledCount} total filled slots`);
    // if (couponsWithPosition.length > 0) {
    //   console.log(`📋 Assigned positions:`, couponsWithPosition.map(c => ({
    //     code: c.code,
    //     position: c.latestLayoutPosition
    //   })));
    // }
    
    return result;
  } catch (error) {
    console.error('Error getting latest coupons:', error);
    return Array(8).fill(null);
  }
}

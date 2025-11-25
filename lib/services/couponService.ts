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

export interface Coupon {
  id?: string;
  code: string;
  storeName?: string; // Name of the store/brand for this coupon
  storeIds?: string[]; // Array of store IDs this coupon is associated with
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  expiryDate: Timestamp | null;
  logoUrl?: string;
  url?: string; // Coupon URL where user should be redirected
  couponType?: 'code' | 'deal'; // Type of coupon: 'code' for coupon codes, 'deal' for deals
  isPopular?: boolean;
  layoutPosition?: number | null; // Position in popular coupons layout (1-8)
  isLatest?: boolean;
  latestLayoutPosition?: number | null; // Position in latest coupons layout (1-8)
  categoryId?: string | null; // Category ID for this coupon
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const coupons = 'coupons';

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
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Debug log to verify storeIds are included
    if (coupon.storeIds) {
      console.log('✅ Saving coupon with storeIds:', coupon.storeIds);
    } else {
      console.log('⚠️ Coupon created without storeIds');
    }
    
    const docRef = await addDoc(collection(db, coupons), couponData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating coupon:', error);
    return { success: false, error };
  }
}

// Get all coupons
export async function getCoupons(): Promise<Coupon[]> {
  try {
    const querySnapshot = await getDocs(collection(db, coupons));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Coupon));
  } catch (error) {
    console.error('Error getting coupons:', error);
    return [];
  }
}

// Get active coupons
export async function getActiveCoupons(): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, coupons),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Coupon));
  } catch (error) {
    console.error('Error getting active coupons:', error);
    return [];
  }
}

// Get coupon by ID
export async function getCouponById(id: string): Promise<Coupon | null> {
  try {
    const docRef = doc(db, coupons, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Coupon;
    }
    return null;
  } catch (error) {
    console.error('Error getting coupon:', error);
    return null;
  }
}

// Update a coupon
export async function updateCoupon(id: string, updates: Partial<Coupon>) {
  try {
    const docRef = doc(db, coupons, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating coupon:', error);
    return { success: false, error };
  }
}

// Delete a coupon
export async function deleteCoupon(id: string) {
  try {
    const docRef = doc(db, coupons, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting coupon:', error);
    return { success: false, error };
  }
}

// Get coupons by category ID
export async function getCouponsByCategoryId(categoryId: string): Promise<Coupon[]> {
  try {
    const q = query(
      collection(db, coupons),
      where('categoryId', '==', categoryId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Coupon));
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
    const allCoupons = await getCoupons();
    // Filter coupons that have this storeId in their storeIds array
    return allCoupons.filter(
      coupon => coupon.storeIds && coupon.storeIds.includes(storeId)
    );
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
      const expiryTime = coupon.expiryDate.toDate();
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
          console.log('🔧 Fixed malformed Cloudinary URL:', { original: logoUrl, fixed: finalLogoUrl });
        } else {
          // Use Cloudinary URL directly (it's already correct)
          finalLogoUrl = logoUrl;
          console.log('✅ Using Cloudinary URL directly:', finalLogoUrl);
        }
      } else {
        // For non-Cloudinary URLs, use as-is
        finalLogoUrl = logoUrl;
      }
    }

    const couponData = {
      ...coupon,
      ...(finalLogoUrl ? { logoUrl: finalLogoUrl } : {}),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    // Debug log to verify storeIds and logoUrl are included
    console.log('📝 Creating coupon from URL:', {
      storeIds: coupon.storeIds,
      logoUrl: finalLogoUrl,
      hasLogoUrl: !!finalLogoUrl,
      couponDataLogoUrl: couponData.logoUrl,
      fullCouponData: JSON.stringify(couponData, null, 2)
    });
    
    const docRef = await addDoc(collection(db, coupons), couponData);
    console.log('✅ Coupon created successfully with ID:', docRef.id);
    console.log('📋 Saved coupon data (logoUrl):', couponData.logoUrl);
    
    // Verify the saved document
    const savedDoc = await getDoc(docRef);
    const savedData = savedDoc.data();
    console.log('🔍 Verification - Saved document logoUrl:', savedData?.logoUrl);
    
    return { success: true, id: docRef.id };
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

// Get latest coupons with layout positions
export async function getLatestCoupons(): Promise<(Coupon | null)[]> {
  try {
    const allCoupons = await getCoupons();
    // Filter coupons with latest layout positions (1-8) and isLatest
    const couponsWithPositions = allCoupons
      .filter(coupon => coupon.isLatest && coupon.latestLayoutPosition && coupon.latestLayoutPosition >= 1 && coupon.latestLayoutPosition <= 8)
      .sort((a, b) => (a.latestLayoutPosition || 0) - (b.latestLayoutPosition || 0));
    
    // Create array of 8 slots (positions 1-8)
    const layoutSlots: (Coupon | null)[] = Array(8).fill(null);
    
    // Fill slots with coupons at their assigned positions
    couponsWithPositions.forEach(coupon => {
      if (coupon.latestLayoutPosition && coupon.latestLayoutPosition >= 1 && coupon.latestLayoutPosition <= 8) {
        layoutSlots[coupon.latestLayoutPosition - 1] = coupon; // latestLayoutPosition 1 = index 0
      }
    });
    
    return layoutSlots;
  } catch (error) {
    console.error('Error getting latest coupons:', error);
    return Array(8).fill(null);
  }
}

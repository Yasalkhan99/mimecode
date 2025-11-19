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
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export interface Coupon {
  id?: string;
  code: string;
  storeName?: string; // Name of the store/brand for this coupon
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
  isActive: boolean;
  maxUses: number;
  currentUses: number;
  expiryDate: Timestamp | null;
  logoUrl?: string;
  url?: string; // Coupon URL where user should be redirected
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
      const ref = storageRef(storage, `coupon_logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(ref, logoFile);
      logoUrl = await getDownloadURL(ref);
    }

    const docRef = await addDoc(collection(db, coupons), {
      ...coupon,
      ...(logoUrl ? { logoUrl } : {}),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
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
    let extractedLogoUrl: string | undefined;
    if (logoUrl) {
      // Extract original URL if it's a Cloudinary URL
      extractedLogoUrl = extractOriginalCloudinaryUrl(logoUrl);
    }

    const docRef = await addDoc(collection(db, coupons), {
      ...coupon,
      ...(extractedLogoUrl ? { logoUrl: extractedLogoUrl } : {}),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
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

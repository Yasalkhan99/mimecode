import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export interface Logo {
  id?: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string; // Original website URL if extracted from URL
  layoutPosition?: number | null; // Position in logo grid layout (1-18)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const logos = 'logos';

// Create a new logo from URL (extracts logo automatically)
export async function createLogoFromUrl(name: string, logoUrl: string, layoutPosition?: number | null, websiteUrl?: string) {
  try {
    // Extract original URL if it's a Cloudinary URL
    const extractedLogoUrl = extractOriginalCloudinaryUrl(logoUrl);
    
    const docRef = await addDoc(collection(db, logos), {
      name: name || '',
      logoUrl: extractedLogoUrl || logoUrl,
      websiteUrl: websiteUrl || logoUrl, // Use websiteUrl if provided, otherwise use logoUrl
      layoutPosition: layoutPosition !== undefined ? layoutPosition : null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating logo from URL:', error);
    return { success: false, error };
  }
}

// Get all logos
export async function getLogos(): Promise<Logo[]> {
  try {
    const querySnapshot = await getDocs(collection(db, logos));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Logo));
  } catch (error) {
    console.error('Error getting logos:', error);
    return [];
  }
}

// Get logo by ID
export async function getLogoById(id: string): Promise<Logo | null> {
  try {
    const docRef = doc(db, logos, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Logo;
    }
    return null;
  } catch (error) {
    console.error('Error getting logo:', error);
    return null;
  }
}

// Get logos with layout positions (1-18)
export async function getLogosWithLayout(): Promise<(Logo | null)[]> {
  try {
    const allLogos = await getLogos();
    // Filter logos with layout positions (1-18)
    const logosWithPositions = allLogos
      .filter(logo => logo.layoutPosition && logo.layoutPosition >= 1 && logo.layoutPosition <= 18)
      .sort((a, b) => (a.layoutPosition || 0) - (b.layoutPosition || 0));
    
    // Create array of 18 slots (positions 1-18)
    const layoutSlots: (Logo | null)[] = Array(18).fill(null);
    
    // Fill slots with logos at their assigned positions
    logosWithPositions.forEach(logo => {
      if (logo.layoutPosition && logo.layoutPosition >= 1 && logo.layoutPosition <= 18) {
        layoutSlots[logo.layoutPosition - 1] = logo; // layoutPosition 1 = index 0
      }
    });
    
    return layoutSlots;
  } catch (error) {
    console.error('Error getting logos with layout:', error);
    return Array(18).fill(null);
  }
}

// Update a logo
export async function updateLogo(id: string, updates: Partial<Logo>) {
  try {
    const docRef = doc(db, logos, id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating logo:', error);
    return { success: false, error };
  }
}

// Delete a logo
export async function deleteLogo(id: string) {
  try {
    const docRef = doc(db, logos, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting logo:', error);
    return { success: false, error };
  }
}


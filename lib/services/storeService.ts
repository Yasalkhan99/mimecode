import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp, addDoc, updateDoc, getDoc, query, where } from 'firebase/firestore';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export interface Store {
  id?: string;
  name: string;
  description: string;
  logoUrl?: string;
  voucherText?: string; // e.g., "Upto 58% Voucher"
  isTrending?: boolean;
  layoutPosition?: number | null; // Position in trending stores layout (1-8)
  categoryId?: string | null; // Category ID for this store
  createdAt?: Timestamp;
}

const stores = 'stores';

export async function getStores(): Promise<Store[]> {
  try {
    const querySnapshot = await getDocs(collection(db, stores));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Store));
  } catch (error) {
    console.error('Error getting stores:', error);
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
    const docRef = await addDoc(collection(db, stores), {
      ...store,
      createdAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating store:', error);
    return { success: false, error };
  }
}

export async function getStoreById(id: string): Promise<Store | null> {
  try {
    const docRef = doc(db, stores, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Store;
    }
    return null;
  } catch (error) {
    console.error('Error getting store:', error);
    return null;
  }
}

export async function updateStore(id: string, updates: Partial<Store>) {
  try {
    const docRef = doc(db, stores, id);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating store:', error);
    return { success: false, error };
  }
}

export async function deleteStore(id: string) {
  try {
    const docRef = doc(db, stores, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting store:', error);
    return { success: false, error };
  }
}

// Get stores by category ID
export async function getStoresByCategoryId(categoryId: string): Promise<Store[]> {
  try {
    const q = query(
      collection(db, stores),
      where('categoryId', '==', categoryId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Store));
  } catch (error) {
    console.error('Error getting stores by category:', error);
    return [];
  }
}


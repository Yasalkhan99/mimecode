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
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface Category {
  id?: string;
  name: string;
  logoUrl?: string;
  backgroundColor: string; // Hex color for the circle background
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

const categories = 'categories';

// Helper function to convert data URI to Blob
function dataURItoBlob(dataURI: string): Blob {
  const parts = dataURI.split(',');
  if (parts.length < 2) {
    throw new Error('Invalid data URI format');
  }
  
  const header = parts[0];
  const data = parts[1];
  const mimeString = header.split(':')[1].split(';')[0];
  
  // Check if it's base64 encoded or URL encoded
  if (header.includes('base64')) {
    // Base64 encoded
    try {
      const byteString = atob(data);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      return new Blob([ab], { type: mimeString });
    } catch (error) {
      console.error('Error decoding base64 data URI:', error);
      throw error;
    }
  } else {
    // URL encoded (like our SVG data URIs)
    try {
      const decodedData = decodeURIComponent(data);
      return new Blob([decodedData], { type: mimeString });
    } catch (error) {
      console.error('Error decoding URL-encoded data URI:', error);
      // Fallback: use data as-is
      return new Blob([data], { type: mimeString });
    }
  }
}

// Create a new category (with logo URL or file)
export async function createCategory(
  name: string,
  backgroundColor: string,
  logoFile?: File,
  logoUrl?: string
) {
  try {
    let finalLogoUrl = logoUrl;
    
    // If logo file is provided, upload it to Firebase Storage
    if (logoFile) {
      const ref = storageRef(storage, `category_logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(ref, logoFile);
      finalLogoUrl = await getDownloadURL(ref);
    } 
    // If logoUrl is a data URI (auto-extracted SVG), convert and upload to Firebase Storage
    else if (logoUrl && logoUrl.startsWith('data:image')) {
      try {
        const blob = dataURItoBlob(logoUrl);
        const fileName = `category_${Date.now()}_${name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
        const ref = storageRef(storage, `category_logos/${fileName}`);
        await uploadBytes(ref, blob, { contentType: 'image/svg+xml' });
        finalLogoUrl = await getDownloadURL(ref);
        console.log('Uploaded data URI logo to Firebase Storage:', finalLogoUrl);
      } catch (uploadError) {
        console.error('Error uploading data URI logo to Firebase Storage:', uploadError);
        // Fallback: use data URI directly if upload fails
        finalLogoUrl = logoUrl;
      }
    }

    const docRef = await addDoc(collection(db, categories), {
      name,
      ...(finalLogoUrl ? { logoUrl: finalLogoUrl } : {}),
      backgroundColor,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error };
  }
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    const querySnapshot = await getDocs(collection(db, categories));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Category));
  } catch (error) {
    console.error('Error getting categories:', error);
    return [];
  }
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const docRef = doc(db, categories, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Category;
    }
    return null;
  } catch (error) {
    console.error('Error getting category:', error);
    return null;
  }
}

// Update category
export async function updateCategory(
  id: string,
  updates: Partial<Category>,
  logoFile?: File
) {
  try {
    let logoUrl = updates.logoUrl;
    
    // If new logo file is provided, upload it
    if (logoFile) {
      const ref = storageRef(storage, `category_logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(ref, logoFile);
      logoUrl = await getDownloadURL(ref);
    }
    // If logoUrl is a data URI (auto-extracted SVG), convert and upload to Firebase Storage
    else if (logoUrl && logoUrl.startsWith('data:image')) {
      try {
        const blob = dataURItoBlob(logoUrl);
        const categoryName = updates.name || 'category';
        const fileName = `category_${Date.now()}_${categoryName.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
        const ref = storageRef(storage, `category_logos/${fileName}`);
        await uploadBytes(ref, blob, { contentType: 'image/svg+xml' });
        logoUrl = await getDownloadURL(ref);
        console.log('Uploaded data URI logo to Firebase Storage:', logoUrl);
      } catch (uploadError) {
        console.error('Error uploading data URI logo to Firebase Storage:', uploadError);
        // Fallback: use data URI directly if upload fails
      }
    }

    const docRef = doc(db, categories, id);
    await updateDoc(docRef, {
      ...updates,
      ...(logoUrl ? { logoUrl } : {}),
      updatedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error };
  }
}

// Delete category
export async function deleteCategory(id: string) {
  try {
    const docRef = doc(db, categories, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error };
  }
}


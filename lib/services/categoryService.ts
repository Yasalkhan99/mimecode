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

// Use environment variable to separate collections between projects
// Default to 'categories-mimecode' for this new project
const categories = process.env.NEXT_PUBLIC_CATEGORIES_COLLECTION || 'categories-mimecode';

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
    
    // If logo file is provided, upload it to Firebase Storage (client-side)
    if (logoFile) {
      const ref = storageRef(storage, `category_logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(ref, logoFile);
      finalLogoUrl = await getDownloadURL(ref);
    } 
    // If logoUrl is a data URI (auto-extracted SVG), convert and upload to Firebase Storage (client-side)
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

    // Use server-side API route to create category (bypasses security rules)
    const res = await fetch('/api/categories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        backgroundColor,
        logoUrl: finalLogoUrl,
        collection: categories,
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
      return { success: false, error: json.error || json.text || 'Failed to create category' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error };
  }
}

// Get all categories
export async function getCategories(): Promise<Category[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/categories/get?collection=${encodeURIComponent(categories)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.categories) {
          return data.categories as Category[];
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
    // All category operations should go through server-side API routes
    return [];
  } catch (error) {
    console.error('Error getting categories:', error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
}

// Get category by ID
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/categories/get?collection=${encodeURIComponent(categories)}&id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.category) {
          return data.category as Category;
        }
        return null;
      }
    } catch (apiError) {
      console.warn('Server API failed, trying client-side:', apiError);
    }

    // Removed client-side fallback to avoid permission errors
    // All category operations should go through server-side API routes
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
    
    // If new logo file is provided, upload it (client-side)
    if (logoFile) {
      const ref = storageRef(storage, `category_logos/${Date.now()}_${logoFile.name}`);
      await uploadBytes(ref, logoFile);
      logoUrl = await getDownloadURL(ref);
    }
    // If logoUrl is a data URI (auto-extracted SVG), convert and upload to Firebase Storage (client-side)
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

    // Use server-side API route to update category (bypasses security rules)
    const res = await fetch('/api/categories/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates: {
          ...updates,
          ...(logoUrl ? { logoUrl } : {}),
        },
        collection: categories,
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
      // Don't fallback to client-side to avoid permission errors
      return { success: false, error: json.error || json.text || 'Failed to update category' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error };
  }
}

// Delete category
export async function deleteCategory(id: string) {
  try {
    // Use server-side API route to delete category (bypasses security rules)
    const res = await fetch('/api/categories/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: categories,
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
      return { success: false, error: json.error || json.text || 'Failed to delete category' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error };
  }
}


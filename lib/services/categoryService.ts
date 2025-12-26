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


export interface Category {
  id?: string;
  name: string;
  slug?: string;
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

    // If logo file is provided, upload it to Supabase Storage via server API
    if (logoFile) {
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            // strip data:<mime>;base64,
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const base64 = await toBase64(logoFile);
      const uploadRes = await fetch('/api/categories/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: logoFile.name,
          contentType: logoFile.type,
          base64,
        }),
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.imageUrl;
        console.log('Uploaded category logo to Supabase Storage:', finalLogoUrl);
      } else {
        const errorText = await uploadRes.text();
        console.error('Failed to upload category logo:', errorText);
        throw new Error('Failed to upload category logo');
      }
    }
    // If logoUrl is a data URI (auto-extracted SVG), convert and upload to Supabase Storage via server API
    else if (logoUrl && logoUrl.startsWith('data:image')) {
      const parts = logoUrl.split(',');
      const header = parts[0];
      const data = parts[1];
      const mimeString = header.split(':')[1].split(';')[0];
      const base64 = header.includes('base64') ? data : btoa(decodeURIComponent(data));
      const extension = mimeString.includes('svg') ? 'svg' : 'png';
      const fileName = `category_${Date.now()}.${extension}`;

      const uploadRes = await fetch('/api/categories/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          contentType: mimeString,
          base64,
        }),
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        finalLogoUrl = uploadData.imageUrl;
        console.log('Uploaded data URI logo to Supabase Storage:', finalLogoUrl);
      } else {
        // Fallback: use data URI directly if upload fails
        console.warn('Failed to upload data URI logo, using directly');
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

    // If new logo file is provided, upload it to Supabase Storage via server API
    if (logoFile) {
      const toBase64 = (file: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

      const base64 = await toBase64(logoFile);
      const uploadRes = await fetch('/api/categories/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: logoFile.name,
          contentType: logoFile.type,
          base64,
        }),
      });

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json();
        logoUrl = uploadData.imageUrl;
      }
    }
    // If logoUrl is a data URI (auto-extracted SVG), convert and upload to Supabase Storage via server API
    else if (logoUrl && logoUrl.startsWith('data:image')) {
      try {
        const parts = logoUrl.split(',');
        const header = parts[0];
        const data = parts[1];
        const mimeString = header.split(':')[1].split(';')[0];
        const base64 = header.includes('base64') ? data : btoa(decodeURIComponent(data));
        const extension = mimeString.includes('svg') ? 'svg' : 'png';
        const fileName = `category_${Date.now()}.${extension}`;

        const uploadRes = await fetch('/api/categories/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName,
            contentType: mimeString,
            base64,
          }),
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          logoUrl = uploadData.imageUrl;
        }
      } catch (uploadError) {
        console.error('Error uploading data URI logo to Supabase Storage:', uploadError);
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


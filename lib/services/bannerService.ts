import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp, addDoc } from 'firebase/firestore';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export interface Banner {
  id?: string;
  title: string;
  imageUrl: string;
  layoutPosition?: number | null; // Position in banner layout (1-5)
  createdAt?: Timestamp;
}

const banners = 'banners';

export async function createBanner(title: string, imageFile: File, layoutPosition?: number | null) {
  // Client-side: convert file to base64 and POST to server API for upload
  try {
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

    const base64 = await toBase64(imageFile);
    const res = await fetch('/api/banners/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        fileName: imageFile.name,
        contentType: imageFile.type,
        base64,
        collection: 'banners',
        layoutPosition,
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
      console.error('Server upload failed', { status: res.status, body: json });
      // Attempt client-side fallback: write document directly into Firestore `coupons` (or requested collection)
      try {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (apiKey && projectId) {
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent('banners')}?key=${apiKey}`;
          const now = new Date().toISOString();
          const fields: any = {
            title: { stringValue: title || '' },
            imageData: { stringValue: base64 },
            imageContentType: { stringValue: imageFile.type || '' },
            createdAt: { timestampValue: now },
          };
          if (layoutPosition !== undefined && layoutPosition !== null) {
            fields.layoutPosition = { integerValue: layoutPosition };
          }
          const docRes = await fetch(firestoreUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
          });

          let docText = '';
          let docJson: any = {};
          try {
            docText = await docRes.text();
            try {
              docJson = JSON.parse(docText || '{}');
            } catch (e) {
              docJson = { text: docText };
            }
          } catch (e) {
            console.error('Failed to read fallback response body', e);
          }

          if (docRes.ok) {
            return { success: true, id: docJson.name?.split('/').pop() };
          }

          console.error('Client-side Firestore fallback failed', { status: docRes.status, body: docJson });
          return { success: false, error: { server: json, fallback: docJson, serverStatus: res.status, fallbackStatus: docRes.status } };
        }

        return { success: false, error: { server: json, message: 'Missing API key/project for fallback' } };
      } catch (fallbackErr) {
        console.error('Fallback upload error', fallbackErr);
        return { success: false, error: { server: json, fallbackError: String(fallbackErr) } };
      }
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating banner (client->server):', error);
    return { success: false, error };
  }
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const querySnapshot = await getDocs(collection(db, banners));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Banner));
  } catch (error) {
    console.error('Error getting banners:', error);
    return [];
  }
}

// Get banners with layout positions (1-4) for hero section
export async function getBannersWithLayout(): Promise<(Banner | null)[]> {
  try {
    const allBanners = await getBanners();
    // Filter banners with layout positions (1-4)
    const bannersWithPositions = allBanners
      .filter(banner => banner.layoutPosition && banner.layoutPosition >= 1 && banner.layoutPosition <= 4)
      .sort((a, b) => (a.layoutPosition || 0) - (b.layoutPosition || 0));
    
    // Create array of 4 slots (positions 1-4)
    const layoutSlots: (Banner | null)[] = Array(4).fill(null);
    
    // Fill slots with banners at their assigned positions
    bannersWithPositions.forEach(banner => {
      if (banner.layoutPosition && banner.layoutPosition >= 1 && banner.layoutPosition <= 4) {
        layoutSlots[banner.layoutPosition - 1] = banner; // layoutPosition 1 = index 0
      }
    });
    
    return layoutSlots;
  } catch (error) {
    console.error('Error getting banners with layout:', error);
    return Array(4).fill(null);
  }
}

// Get banner by specific layout position
export async function getBannerByLayoutPosition(position: number): Promise<Banner | null> {
  try {
    const allBanners = await getBanners();
    const banner = allBanners.find(b => b.layoutPosition === position);
    return banner || null;
  } catch (error) {
    console.error('Error getting banner by layout position:', error);
    return null;
  }
}

export async function deleteBanner(id: string) {
  try {
    const docRef = doc(db, banners, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting banner:', error);
    return { success: false, error };
  }
}

/**
 * Create a banner from a URL (e.g., Cloudinary URL)
 * Automatically extracts the original image URL if it's a Cloudinary URL
 */
export async function createBannerFromUrl(title: string, imageUrl: string, layoutPosition?: number | null) {
  try {
    // Extract original URL if it's a Cloudinary URL
    const originalUrl = extractOriginalCloudinaryUrl(imageUrl);
    
    const docRef = await addDoc(collection(db, 'banners'), {
      title: title || '',
      imageUrl: originalUrl,
      layoutPosition: layoutPosition !== undefined ? layoutPosition : null,
      createdAt: Timestamp.now(),
    });
    
    return { success: true, id: docRef.id, imageUrl: originalUrl };
  } catch (error) {
    console.error('Error creating banner from URL:', error);
    return { success: false, error };
  }
}

// Update banner layout position
export async function updateBanner(id: string, updates: Partial<Banner>) {
  try {
    const { updateDoc } = await import('firebase/firestore');
    const docRef = doc(db, 'banners', id);
    await updateDoc(docRef, updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating banner:', error);
    return { success: false, error };
  }
}

import { Timestamp } from 'firebase/firestore';

export interface Logo {
  id?: string;
  name: string;
  logoUrl: string;
  websiteUrl?: string; // Original website URL if extracted from URL
  layoutPosition?: number | null; // Position in logo grid layout (1-18)
  createdAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
  updatedAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
}

// Use environment variable to separate collections between projects
// Default to 'logos-mimecode' for this new project
const logos = process.env.NEXT_PUBLIC_LOGOS_COLLECTION || 'logos-mimecode';

// Create a new logo from URL (extracts logo automatically)
export async function createLogoFromUrl(name: string, logoUrl: string, layoutPosition?: number | null, websiteUrl?: string) {
  try {
    const res = await fetch('/api/logos/create-from-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        logoUrl,
        layoutPosition,
        websiteUrl,
        collection: logos,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to create logo from URL' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating logo from URL:', error);
    return { success: false, error };
  }
}

// Get all logos
export async function getLogos(): Promise<Logo[]> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/logos/get?collection=${encodeURIComponent(logos)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logos) {
          return data.logos as Logo[];
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
    console.error('Error getting logos:', error);
    return [];
  }
}

// Get logo by ID
export async function getLogoById(id: string): Promise<Logo | null> {
  try {
    // Try server-side API first (bypasses security rules)
    try {
      const res = await fetch(`/api/logos/get?collection=${encodeURIComponent(logos)}&id=${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.logo) {
          return data.logo as Logo;
        }
        return null;
      }
    } catch (apiError) {
      console.warn('Server API failed:', apiError);
    }

    // Removed client-side fallback to avoid permission errors
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
    const res = await fetch('/api/logos/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates,
        collection: logos,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to update logo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating logo:', error);
    return { success: false, error };
  }
}

// Delete a logo
export async function deleteLogo(id: string) {
  try {
    const res = await fetch('/api/logos/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: logos,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to delete logo' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting logo:', error);
    return { success: false, error };
  }
}


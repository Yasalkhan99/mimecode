import { Timestamp } from 'firebase/firestore';

export interface Region {
  id?: string;
  name: string; // Region name (e.g., "North America", "Europe", "Asia Pacific")
  networkId: string; // Unique network ID for this region (e.g., "NET-001", "NET-EU-001")
  description?: string; // Optional description
  isActive: boolean; // Whether this region is active
  createdAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
  updatedAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
}

// Use environment variable to separate collections between projects
// Default to 'regions-mimecode' for this new project
const regions = process.env.NEXT_PUBLIC_REGIONS_COLLECTION || 'regions-mimecode';

// Get all regions
export async function getRegions(): Promise<Region[]> {
  try {
    const res = await fetch(`/api/regions/get?collection=${encodeURIComponent(regions)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting regions:', json.error);
      return [];
    }

    return json.regions || [];
  } catch (error) {
    console.error('Error getting regions:', error);
    return [];
  }
}

// Get active regions only
export async function getActiveRegions(): Promise<Region[]> {
  try {
    const res = await fetch(`/api/regions/get?collection=${encodeURIComponent(regions)}&activeOnly=true`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting active regions:', json.error);
      return [];
    }

    return json.regions || [];
  } catch (error) {
    console.error('Error getting active regions:', error);
    return [];
  }
}

// Get region by ID
export async function getRegionById(id: string): Promise<Region | null> {
  try {
    const res = await fetch(`/api/regions/get?collection=${encodeURIComponent(regions)}&id=${encodeURIComponent(id)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting region:', json.error);
      return null;
    }

    return json.region || null;
  } catch (error) {
    console.error('Error getting region:', error);
    return null;
  }
}

// Get region by network ID
export async function getRegionByNetworkId(networkId: string): Promise<Region | null> {
  try {
    const res = await fetch(`/api/regions/get?collection=${encodeURIComponent(regions)}&networkId=${encodeURIComponent(networkId)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting region by network ID:', json.error);
      return null;
    }

    return json.region || null;
  } catch (error) {
    console.error('Error getting region by network ID:', error);
    return null;
  }
}

// Create a new region
export async function createRegion(region: Omit<Region, 'id'>) {
  try {
    const res = await fetch('/api/regions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        region,
        collection: regions,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to create region' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating region:', error);
    return { success: false, error };
  }
}

// Update a region
export async function updateRegion(id: string, updates: Partial<Omit<Region, 'id'>>) {
  try {
    const res = await fetch('/api/regions/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates,
        collection: regions,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to update region' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating region:', error);
    return { success: false, error };
  }
}

// Delete a region
export async function deleteRegion(id: string) {
  try {
    const res = await fetch('/api/regions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: regions,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to delete region' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting region:', error);
    return { success: false, error };
  }
}


import { Timestamp } from 'firebase/firestore';

export interface StoreFAQ {
  id?: string;
  storeId: string; // Store ID this FAQ belongs to
  question: string;
  answer: string;
  order?: number; // For ordering FAQs
  isActive: boolean;
  createdAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
  updatedAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
}

// Use environment variable to separate collections between projects
// Default to 'storeFaqs-mimecode' for this new project
const storeFaqs = process.env.NEXT_PUBLIC_STORE_FAQS_COLLECTION || 'storeFaqs-mimecode';

// Create a new Store FAQ
export async function createStoreFAQ(storeFaq: Omit<StoreFAQ, 'id'>) {
  try {
    const res = await fetch('/api/store-faqs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        storeFaq,
        collection: storeFaqs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to create store FAQ' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating store FAQ:', error);
    return { success: false, error };
  }
}

// Get all Store FAQs for a specific store
export async function getStoreFAQs(storeId: string): Promise<StoreFAQ[]> {
  try {
    const res = await fetch(`/api/store-faqs/get?collection=${encodeURIComponent(storeFaqs)}&storeId=${encodeURIComponent(storeId)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting store FAQs:', json.error);
      return [];
    }

    return json.storeFaqs || [];
  } catch (error) {
    console.error('Error getting store FAQs:', error);
    return [];
  }
}

// Get active Store FAQs only for a specific store
export async function getActiveStoreFAQs(storeId: string): Promise<StoreFAQ[]> {
  try {
    const res = await fetch(`/api/store-faqs/get?collection=${encodeURIComponent(storeFaqs)}&storeId=${encodeURIComponent(storeId)}&activeOnly=true`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting active store FAQs:', json.error);
      return [];
    }

    return json.storeFaqs || [];
  } catch (error) {
    console.error('Error getting active store FAQs:', error);
    return [];
  }
}

// Get a single Store FAQ by ID
export async function getStoreFAQById(id: string): Promise<StoreFAQ | null> {
  try {
    const res = await fetch(`/api/store-faqs/get?collection=${encodeURIComponent(storeFaqs)}&id=${encodeURIComponent(id)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting store FAQ:', json.error);
      return null;
    }

    return json.storeFaq || null;
  } catch (error) {
    console.error('Error getting store FAQ:', error);
    return null;
  }
}

// Update a Store FAQ
export async function updateStoreFAQ(id: string, storeFaq: Partial<Omit<StoreFAQ, 'id'>>) {
  try {
    const res = await fetch('/api/store-faqs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        storeFaq,
        collection: storeFaqs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to update store FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating store FAQ:', error);
    return { success: false, error };
  }
}

// Delete a Store FAQ
export async function deleteStoreFAQ(id: string) {
  try {
    const res = await fetch('/api/store-faqs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: storeFaqs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to delete store FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting store FAQ:', error);
    return { success: false, error };
  }
}


import { Timestamp } from 'firebase/firestore';

export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order?: number; // For ordering FAQs
  isActive: boolean;
  createdAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
  updatedAt?: Timestamp | number; // Can be Timestamp or number (milliseconds)
}

// Use environment variable to separate collections between projects
// Default to 'faqs-mimecode' for this new project
const faqs = process.env.NEXT_PUBLIC_FAQS_COLLECTION || 'faqs-mimecode';

// Create a new FAQ
export async function createFAQ(faq: Omit<FAQ, 'id'>) {
  try {
    const res = await fetch('/api/faqs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        faq,
        collection: faqs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server create failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to create FAQ' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return { success: false, error };
  }
}

// Get all FAQs (ordered by order field, then by createdAt)
export async function getFAQs(): Promise<FAQ[]> {
  try {
    const res = await fetch(`/api/faqs/get?collection=${encodeURIComponent(faqs)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting FAQs:', json.error);
      return [];
    }

    return json.faqs || [];
  } catch (error) {
    console.error('Error getting FAQs:', error);
    return [];
  }
}

// Get active FAQs only
export async function getActiveFAQs(): Promise<FAQ[]> {
  try {
    const res = await fetch(`/api/faqs/get?collection=${encodeURIComponent(faqs)}&activeOnly=true`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting active FAQs:', json.error);
      return [];
    }

    return json.faqs || [];
  } catch (error) {
    console.error('Error getting active FAQs:', error);
    return [];
  }
}

// Get a single FAQ by ID
export async function getFAQById(id: string): Promise<FAQ | null> {
  try {
    const res = await fetch(`/api/faqs/get?collection=${encodeURIComponent(faqs)}&id=${encodeURIComponent(id)}`);
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting FAQ:', json.error);
      return null;
    }

    return json.faq || null;
  } catch (error) {
    console.error('Error getting FAQ:', error);
    return null;
  }
}

// Update an FAQ
export async function updateFAQ(id: string, faq: Partial<Omit<FAQ, 'id'>>) {
  try {
    const res = await fetch('/api/faqs/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        updates: faq,
        collection: faqs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to update FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return { success: false, error };
  }
}

// Delete an FAQ
export async function deleteFAQ(id: string) {
  try {
    const res = await fetch('/api/faqs/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        collection: faqs,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server delete failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to delete FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { success: false, error };
  }
}


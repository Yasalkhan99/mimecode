export interface FAQ {
  id?: string;
  question: string;
  answer: string;
  order?: number; // For ordering FAQs
  isActive: boolean;
  createdAt?: Date | number; // Can be Date or number (milliseconds)
  updatedAt?: Date | number; // Can be Date or number (milliseconds)
}

// Create a new FAQ
export async function createFAQ(faq: Omit<FAQ, 'id'>) {
  try {
    const res = await fetch('/api/faqs/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ faq }),
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
      return { success: false, error: json.error || json.text || 'Failed to create FAQ' };
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
    const res = await fetch('/api/faqs/get');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.faqs) {
        return data.faqs as FAQ[];
      }
    }
    return [];
  } catch (error) {
    console.error('Error getting FAQs:', error);
    return [];
  }
}

// Get active FAQs only
export async function getActiveFAQs(): Promise<FAQ[]> {
  try {
    const res = await fetch('/api/faqs/get?activeOnly=true');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.faqs) {
        return data.faqs as FAQ[];
      }
    }
    return [];
  } catch (error) {
    console.error('Error getting active FAQs:', error);
    return [];
  }
}

// Get a single FAQ by ID
export async function getFAQById(id: string): Promise<FAQ | null> {
  try {
    const res = await fetch(`/api/faqs/get?id=${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.faq) {
        return data.faq as FAQ;
      }
    }
    return null;
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
      body: JSON.stringify({ id, updates: faq }),
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
      return { success: false, error: json.error || json.text || 'Failed to update FAQ' };
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
      body: JSON.stringify({ id }),
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
      return { success: false, error: json.error || json.text || 'Failed to delete FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { success: false, error };
  }
}


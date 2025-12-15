import { Timestamp } from 'firebase/firestore';

export interface TermsAndConditions {
  id?: string;
  title: string;
  content: string;
  contactEmail: string;
  contactWebsite: string;
  languageCode?: string; // ISO 639-1 language code (e.g., 'en', 'es', 'fr')
  lastUpdated?: Date | string | Timestamp;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Get terms and conditions
export async function getTermsAndConditions(languageCode?: string): Promise<TermsAndConditions | null> {
  try {
    const lang = languageCode || (typeof window !== 'undefined' ? localStorage.getItem('preferredLanguage') || 'en' : 'en');
    const res = await fetch(`/api/pages/terms/get?lang=${lang}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.terms) {
        return data.terms as TermsAndConditions;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting terms and conditions:', error);
    return null;
  }
}

// Create terms and conditions
export async function createTermsAndConditions(terms: Omit<TermsAndConditions, 'id'>) {
  try {
    const res = await fetch('/api/pages/terms/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ terms }),
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
      return { success: false, error: json.error || json.text || 'Failed to create terms and conditions' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating terms and conditions:', error);
    return { success: false, error };
  }
}

// Update terms and conditions
export async function updateTermsAndConditions(id: string, updates: Partial<TermsAndConditions>) {
  try {
    const res = await fetch('/api/pages/terms/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, updates }),
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
      return { success: false, error: json.error || json.text || 'Failed to update terms and conditions' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating terms and conditions:', error);
    return { success: false, error };
  }
}

// Delete terms and conditions
export async function deleteTermsAndConditions(id: string) {
  try {
    const res = await fetch('/api/pages/terms/delete', {
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
      return { success: false, error: json.error || json.text || 'Failed to delete terms and conditions' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting terms and conditions:', error);
    return { success: false, error };
  }
}


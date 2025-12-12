import { Timestamp } from 'firebase/firestore';

export interface PrivacyPolicy {
  id?: string;
  title: string;
  content: string;
  contactEmail: string;
  contactWebsite: string;
  lastUpdated?: Date | string | Timestamp;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

// Get privacy policy
export async function getPrivacyPolicy(): Promise<PrivacyPolicy | null> {
  try {
    const res = await fetch('/api/pages/privacy-policy/get');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.privacyPolicy) {
        return data.privacyPolicy as PrivacyPolicy;
      }
    }
    return null;
  } catch (error) {
    console.error('Error getting privacy policy:', error);
    return null;
  }
}

// Create privacy policy
export async function createPrivacyPolicy(policy: Omit<PrivacyPolicy, 'id'>) {
  try {
    const res = await fetch('/api/pages/privacy-policy/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policy }),
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
      return { success: false, error: json.error || json.text || 'Failed to create privacy policy' };
    }

    return { success: true, id: json.id };
  } catch (error) {
    console.error('Error creating privacy policy:', error);
    return { success: false, error };
  }
}

// Update privacy policy
export async function updatePrivacyPolicy(id: string, updates: Partial<PrivacyPolicy>) {
  try {
    const res = await fetch('/api/pages/privacy-policy/update', {
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
      return { success: false, error: json.error || json.text || 'Failed to update privacy policy' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating privacy policy:', error);
    return { success: false, error };
  }
}

// Delete privacy policy
export async function deletePrivacyPolicy(id: string) {
  try {
    const res = await fetch('/api/pages/privacy-policy/delete', {
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
      return { success: false, error: json.error || json.text || 'Failed to delete privacy policy' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting privacy policy:', error);
    return { success: false, error };
  }
}


export interface EmailSettings {
  id?: string;
  email1: string; // First email address
  email2: string; // Second email address
  email3: string; // Third email address
  email4: string; // Fourth email address
  email5: string; // Fifth email address
  email6: string; // Sixth email address
  updatedAt?: number; // Timestamp in milliseconds
}

// Get email settings (client-side - uses API route)
export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const res = await fetch('/api/email-settings/get');
    const json = await res.json();
    
    if (!res.ok) {
      console.error('Error getting email settings:', json.error);
      // Return default on error
      return {
        id: 'default',
        email1: 'admin@mimecode.com',
        email2: '',
        email3: '',
        email4: '',
        email5: '',
        email6: '',
      };
    }

    return json.settings || {
      id: 'default',
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
  } catch (error) {
    console.error('Error getting email settings:', error);
    return {
      id: 'default',
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
  }
}


// Update email settings (client-side - uses API route)
export async function updateEmailSettings(
  email1: string, 
  email2: string, 
  email3: string, 
  email4: string, 
  email5: string, 
  email6: string
): Promise<{ success: boolean; error?: any }> {
  try {
    const res = await fetch('/api/email-settings/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email1,
        email2,
        email3,
        email4,
        email5,
        email6,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Server update failed', { status: res.status, body: json });
      return { success: false, error: json.error || 'Failed to update email settings' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating email settings:', error);
    return { success: false, error };
  }
}


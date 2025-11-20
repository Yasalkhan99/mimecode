import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export interface EmailSettings {
  id?: string;
  newsletterEmail: string; // Email address where newsletter subscriptions should be sent
  updatedAt?: Timestamp;
}

const emailSettingsCollection = 'emailSettings';
const emailSettingsDocId = 'main'; // Single document for email settings

// Get email settings
export async function getEmailSettings(): Promise<EmailSettings | null> {
  try {
    const docRef = doc(db, emailSettingsCollection, emailSettingsDocId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as EmailSettings;
    }
    
    // Return default if no settings exist
    return {
      id: emailSettingsDocId,
      newsletterEmail: 'admin@availcoupon.com',
    };
  } catch (error) {
    console.error('Error getting email settings:', error);
    return {
      id: emailSettingsDocId,
      newsletterEmail: 'admin@availcoupon.com',
    };
  }
}

// Update email settings
export async function updateEmailSettings(newsletterEmail: string): Promise<{ success: boolean; error?: any }> {
  try {
    const docRef = doc(db, emailSettingsCollection, emailSettingsDocId);
    
    await setDoc(docRef, {
      newsletterEmail: newsletterEmail.trim(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating email settings:', error);
    return { success: false, error };
  }
}


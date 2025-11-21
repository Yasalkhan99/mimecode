import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export interface EmailSettings {
  id?: string;
  email1: string; // First email address
  email2: string; // Second email address
  email3: string; // Third email address
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
      email1: 'admin@availcoupon.com',
      email2: '',
      email3: '',
    };
  } catch (error) {
    console.error('Error getting email settings:', error);
    return {
      id: emailSettingsDocId,
      email1: 'admin@availcoupon.com',
      email2: '',
      email3: '',
    };
  }
}

// Update email settings
export async function updateEmailSettings(email1: string, email2: string, email3: string): Promise<{ success: boolean; error?: any }> {
  try {
    const docRef = doc(db, emailSettingsCollection, emailSettingsDocId);
    
    await setDoc(docRef, {
      email1: email1.trim(),
      email2: email2.trim(),
      email3: email3.trim(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating email settings:', error);
    return { success: false, error };
  }
}


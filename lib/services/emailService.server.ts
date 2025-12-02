// Server-side only email service functions
// This file should NEVER be imported in client components

import { getAdminFirestore } from '@/lib/firebase-admin';
import { EmailSettings } from './emailService';

// Use environment variable to separate collections between projects
// Default to 'emailSettings-mimecode' for this new project
const emailSettingsCollection = process.env.NEXT_PUBLIC_EMAIL_SETTINGS_COLLECTION || 'emailSettings-mimecode';
const emailSettingsDocId = 'main'; // Single document for email settings

// Get email settings (server-side - uses Admin SDK directly)
// This function should be used in server-side API routes only
export async function getEmailSettingsServer(): Promise<EmailSettings | null> {
  try {
    if (process.env.FIREBASE_ADMIN_SA || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const firestore = getAdminFirestore();
      const docSnap = await firestore.collection(emailSettingsCollection).doc(emailSettingsDocId).get();
      
      if (docSnap.exists) {
        const data = docSnap.data();
        // Convert Firestore Timestamp to milliseconds if needed
        let updatedAt: number | undefined;
        if (data?.updatedAt) {
          if (data.updatedAt.toMillis && typeof data.updatedAt.toMillis === 'function') {
            updatedAt = data.updatedAt.toMillis();
          } else if (data.updatedAt.seconds) {
            updatedAt = data.updatedAt.seconds * 1000 + Math.floor((data.updatedAt.nanoseconds || 0) / 1000000);
          }
        }
        
        return {
          id: docSnap.id,
          email1: data?.email1 || 'admin@mimecode.com',
          email2: data?.email2 || '',
          email3: data?.email3 || '',
          email4: data?.email4 || '',
          email5: data?.email5 || '',
          email6: data?.email6 || '',
          updatedAt,
        };
      }
    }
    
    // Return default if no settings exist or Admin SDK not configured
    return {
      id: emailSettingsDocId,
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
  } catch (error) {
    console.error('Error getting email settings (server):', error);
    return {
      id: emailSettingsDocId,
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
  }
}


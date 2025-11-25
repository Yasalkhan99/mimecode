import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Initialize Firebase Admin SDK
// Supports both JSON file path and environment variable configuration

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Method 1: Try service account file path first (easier for local development)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      console.log('🔧 Attempting to initialize Firebase Admin from file:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      // Resolve the file path (handle both relative and absolute paths)
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.startsWith('.')
        ? resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      console.log('📁 Resolved file path:', filePath);
      
      // Read and parse the JSON file
      const fileContent = readFileSync(filePath, 'utf8');
      const serviceAccount = JSON.parse(fileContent);
      
      console.log('✅ Service account JSON loaded successfully');
      console.log('📋 Project ID:', serviceAccount.project_id);
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin SDK initialized from service account file');
    } catch (error) {
      console.error('❌ Failed to initialize from service account file:', error);
      console.error('Error details:', error instanceof Error ? error.stack : String(error));
      if (error instanceof Error) {
        if (error.message.includes('ENOENT')) {
          console.error('💡 File not found. Please check the file path in FIREBASE_SERVICE_ACCOUNT_PATH');
        } else if (error.message.includes('Unexpected token')) {
          console.error('💡 Invalid JSON format in service account file');
        }
      }
    }
  }
  
  // Method 2: Try environment variable (if file path method didn't work)
  if (!admin.apps.length && process.env.FIREBASE_ADMIN_SA) {
    try {
      console.log('🔧 Attempting to initialize Firebase Admin from FIREBASE_ADMIN_SA...');
      const serviceAccountString = process.env.FIREBASE_ADMIN_SA;
      
      if (!serviceAccountString || serviceAccountString.trim() === '') {
        throw new Error('FIREBASE_ADMIN_SA is empty');
      }
      
      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountString);
      } catch (parseError) {
        console.error('❌ Failed to parse FIREBASE_ADMIN_SA as JSON:', parseError);
        throw new Error(`Invalid JSON in FIREBASE_ADMIN_SA: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      // Validate required fields
      if (!serviceAccount.project_id) {
        throw new Error('Service account JSON missing project_id');
      }
      if (!serviceAccount.private_key) {
        throw new Error('Service account JSON missing private_key');
      }
      if (!serviceAccount.client_email) {
        throw new Error('Service account JSON missing client_email');
      }
      
      // Fix private key formatting if needed
      if (serviceAccount.private_key && typeof serviceAccount.private_key === 'string') {
        // Replace escaped newlines with actual newlines for Firebase Admin SDK
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      
      console.log('✅ Firebase Admin SDK initialized from FIREBASE_ADMIN_SA');
    } catch (error) {
      console.error('❌ Failed to initialize from FIREBASE_ADMIN_SA:', error);
      console.error('Error details:', error instanceof Error ? error.stack : String(error));
      // Don't throw here, try file path method instead
    }
  }
  
  // If still not initialized, log detailed warning
  if (!admin.apps.length) {
    const hasEnvVar = !!process.env.FIREBASE_ADMIN_SA;
    const hasFilePath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const envVarLength = process.env.FIREBASE_ADMIN_SA?.length || 0;
    
    console.error('❌ Firebase Admin SDK not initialized!');
    console.error('Configuration check:');
    console.error(`  - FIREBASE_ADMIN_SA: ${hasEnvVar ? `✅ Set (${envVarLength} chars)` : '❌ Not set'}`);
    console.error(`  - FIREBASE_SERVICE_ACCOUNT_PATH: ${hasFilePath ? `✅ Set (${process.env.FIREBASE_SERVICE_ACCOUNT_PATH})` : '❌ Not set'}`);
    console.error('Please configure one of the above in your .env.local file');
  }
}

// Export convenience functions
export function getAdminStorage() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized. Please configure FIREBASE_ADMIN_SA or FIREBASE_SERVICE_ACCOUNT_PATH');
  }
  return admin.storage();
}

export function getAdminFirestore() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized. Please configure FIREBASE_ADMIN_SA or FIREBASE_SERVICE_ACCOUNT_PATH');
  }
  return admin.firestore();
}

export function getAdminAuth() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin SDK not initialized. Please configure FIREBASE_ADMIN_SA or FIREBASE_SERVICE_ACCOUNT_PATH');
  }
  return admin.auth();
}

// Export the admin instance
export default admin;


import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

// Create require function for ES modules (Next.js compatible)
// Use process.cwd() as base for require resolution
const require = createRequire(process.cwd() + '/');

// Initialize Firebase Admin SDK
// Supports both JSON file path and environment variable configuration

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // Check if we're in a serverless/production environment (Vercel, etc.)
  const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
  
  // Priority: On serverless (Vercel), skip file path and use FIREBASE_ADMIN_SA only
  // On local, try file path first, then FIREBASE_ADMIN_SA as fallback
  if (!isServerless && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    // Local development: Try file path first
    try {
      console.log('🔧 Attempting to initialize Firebase Admin from file:', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      // Resolve the file path (handle both relative and absolute paths)
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH.startsWith('.')
        ? resolve(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
        : resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      
      console.log('📁 Resolved file path:', filePath);
      
      // Use require() to load JSON file directly (standard Firebase pattern)
      // Fallback to readFileSync if require() fails (for compatibility)
      let serviceAccount;
      try {
        serviceAccount = require(filePath);
      } catch (requireError) {
        // Fallback to readFileSync if require() doesn't work
        console.log('⚠️ require() failed, trying readFileSync...');
        const fileContent = readFileSync(filePath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
      }
      
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
        if (error.message.includes('ENOENT') || error.message.includes('Cannot find module')) {
          console.error('💡 File not found. Falling back to FIREBASE_ADMIN_SA...');
        } else if (error.message.includes('Unexpected token')) {
          console.error('💡 Invalid JSON format in service account file. Falling back to FIREBASE_ADMIN_SA...');
        }
      }
    }
  }
  
  // Method 2: Try environment variable (priority on serverless/production)
  if (!admin.apps.length && process.env.FIREBASE_ADMIN_SA) {
    try {
      console.log('🔧 Attempting to initialize Firebase Admin from FIREBASE_ADMIN_SA...');
      let serviceAccountString = process.env.FIREBASE_ADMIN_SA;
      
      if (!serviceAccountString || serviceAccountString.trim() === '') {
        throw new Error('FIREBASE_ADMIN_SA is empty');
      }
      
      // Remove surrounding quotes if present (common issue with .env files)
      serviceAccountString = serviceAccountString.trim();
      
      // Remove outer quotes (single or double)
      if ((serviceAccountString.startsWith('"') && serviceAccountString.endsWith('"')) ||
          (serviceAccountString.startsWith("'") && serviceAccountString.endsWith("'"))) {
        serviceAccountString = serviceAccountString.slice(1, -1);
      }
      
      // Try to parse - handle various escaping scenarios
      let serviceAccount;
      let parseAttempts = [];
      
      // Attempt 1: Try parsing as-is
      try {
        serviceAccount = JSON.parse(serviceAccountString);
      } catch (parseError1) {
        parseAttempts.push({ attempt: 1, error: parseError1, string: serviceAccountString });
        
        // Attempt 2: Unescape quotes (handle {\"type\" -> {"type")
        try {
          let attempt2 = serviceAccountString.replace(/\\"/g, '"').replace(/\\'/g, "'");
          serviceAccount = JSON.parse(attempt2);
        } catch (parseError2) {
          parseAttempts.push({ attempt: 2, error: parseError2 });
          
          // Attempt 3: Handle double-encoded JSON (if stored as string)
          try {
            const decoded = JSON.parse(serviceAccountString);
            if (typeof decoded === 'string') {
              serviceAccount = JSON.parse(decoded);
            } else {
              serviceAccount = decoded;
            }
          } catch (parseError3) {
            parseAttempts.push({ attempt: 3, error: parseError3 });
            
            // Attempt 4: Try unescaping then parsing as string
            try {
              let attempt4 = serviceAccountString.replace(/\\"/g, '"').replace(/\\'/g, "'");
              const decoded4 = JSON.parse(attempt4);
              if (typeof decoded4 === 'string') {
                serviceAccount = JSON.parse(decoded4);
              } else {
                serviceAccount = decoded4;
              }
            } catch (parseError4) {
              // All attempts failed - log details
              console.error('❌ Failed to parse FIREBASE_ADMIN_SA as JSON after multiple attempts');
              parseAttempts.forEach((attempt, idx) => {
                console.error(`Attempt ${attempt.attempt} error:`, attempt.error instanceof Error ? attempt.error.message : String(attempt.error));
              });
              console.error('💡 First 200 chars of original string:', serviceAccountString.substring(0, 200));
              console.error('💡 String starts with:', serviceAccountString.substring(0, 10));
              throw new Error(`Invalid JSON in FIREBASE_ADMIN_SA: ${parseError1 instanceof Error ? parseError1.message : String(parseError1)}`);
            }
          }
        }
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
      console.log('📋 Project ID:', serviceAccount.project_id);
    } catch (error) {
      console.error('❌ Failed to initialize from FIREBASE_ADMIN_SA:', error);
      console.error('Error details:', error instanceof Error ? error.stack : String(error));
      if (error instanceof Error) {
        if (error.message.includes('Unexpected token') || error.message.includes('JSON')) {
          console.error('💡 JSON parsing error. Make sure FIREBASE_ADMIN_SA is a valid JSON string.');
          console.error('💡 First 100 chars of FIREBASE_ADMIN_SA:', process.env.FIREBASE_ADMIN_SA?.substring(0, 100));
        }
      }
      // On serverless, don't try file path (it won't work)
      // On local, file path was already tried first, so no need to try again
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
    if (isServerless) {
      console.error('💡 On Vercel/serverless: Use FIREBASE_ADMIN_SA (file paths don\'t work)');
      console.error('💡 Make sure FIREBASE_ADMIN_SA is a valid JSON string without extra quotes');
    } else {
      console.error('Please configure one of the above in your .env.local file');
    }
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


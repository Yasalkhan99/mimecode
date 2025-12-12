// Server-side coupon logo upload route
// Uses Admin SDK when FIREBASE_ADMIN_SA is set, otherwise returns error

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, contentType, base64 } = body || {};

    // Debug: Check all environment variables
    const envCheck = {
      hasFileName: !!fileName,
      hasBase64: !!base64,
      contentType: contentType || 'not provided',
      hasAdminSA: !!process.env.FIREBASE_ADMIN_SA,
      adminSALength: process.env.FIREBASE_ADMIN_SA?.length || 0,
      hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'not set',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', ')
    };
    console.log('📤 Coupon logo upload request received:', envCheck);

    if (!base64 || !fileName) {
      const error = { success: false, error: 'Missing file data' };
      console.error('❌ Missing file data');
      return new Response(JSON.stringify(error), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if Firebase Admin is configured
    const hasEnvVar = !!process.env.FIREBASE_ADMIN_SA;
    const hasFilePath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const envVarLength = process.env.FIREBASE_ADMIN_SA?.length || 0;
    
    console.log('🔍 Firebase Admin Configuration Check:');
    console.log(`  - FIREBASE_ADMIN_SA: ${hasEnvVar ? `✅ Set (${envVarLength} chars)` : '❌ Not set'}`);
    console.log(`  - FIREBASE_SERVICE_ACCOUNT_PATH: ${hasFilePath ? `✅ Set (${process.env.FIREBASE_SERVICE_ACCOUNT_PATH})` : '❌ Not set'}`);
    console.log(`  - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '❌ Not set'}`);
    
    // If service account is provided, try Admin SDK (recommended)
    if (hasEnvVar || hasFilePath) {
      console.log('✅ Firebase Admin SA found, attempting Admin SDK upload...');
      
      try {
        // Import and initialize Firebase Admin
        const adminModule = await import('@/lib/firebase-admin');
        const admin = adminModule.default;
        
        // Check if admin is initialized
        if (!admin.apps.length) {
          console.error('❌ Firebase Admin SDK not initialized after import');
          console.error('This usually means:');
          console.error('  1. FIREBASE_ADMIN_SA has invalid JSON');
          console.error('  2. Service account file path is incorrect');
          console.error('  3. Private key format is incorrect');
          console.error('Check server console logs above for detailed error messages');
          console.log('🔄 Firebase Admin SDK not initialized, trying Cloudinary fallback...');
          
          // Throw error to fall through to Cloudinary fallback
          throw new Error('Firebase Admin SDK not initialized');
        }
        
        console.log('✅ Firebase Admin SDK is initialized');
        
        let storage;
        try {
          storage = admin.storage();
          console.log('✅ Admin storage initialized');
        } catch (initError) {
          console.error('❌ Failed to get Admin storage:', initError);
          console.log('🔄 Failed to get Firebase Admin storage, trying Cloudinary fallback...');
          // Throw error to fall through to Cloudinary fallback
          throw initError;
        }

        const buffer = Buffer.from(base64, 'base64');
        const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const dest = `coupon_logos/${Date.now()}_${safeName}`;
        console.log('📤 Uploading file to:', dest);
        
        let bucket;
        try {
          // Get bucket name from environment or use default
          const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
          console.log('📦 Attempting to use bucket:', bucketName);
          
          if (!bucketName) {
            throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set');
          }
          
          // Try to get the bucket (with or without .appspot.com)
          bucket = storage.bucket(bucketName);
          console.log('✅ Bucket object created:', bucket.name);
          
          // Test if bucket exists by trying to get its metadata
          try {
            await bucket.getMetadata();
            console.log('✅ Bucket exists and is accessible');
          } catch (metadataError) {
            console.warn('⚠️ Could not verify bucket metadata:', metadataError);
            // Continue anyway - bucket might still work
          }
        } catch (bucketError) {
          console.error('❌ Failed to get bucket:', bucketError);
          throw bucketError; // Throw to outer catch to try Cloudinary
        }
        
        const file = bucket.file(dest);

        try {
          console.log('💾 Saving file to storage...');
          await file.save(buffer, { 
            metadata: { 
              contentType: contentType || 'image/svg+xml',
              cacheControl: 'public, max-age=31536000'
            }, 
            resumable: false 
          });
          console.log('✅ File saved successfully');

          try {
            console.log('🌐 Making file public...');
            await file.makePublic();
            console.log('✅ File made public');
          } catch (e) {
            console.warn('⚠️ makePublic failed (file may already be public or bucket has default permissions):', e);
            // Don't fail the upload if makePublic fails - file might already be public
          }

          const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
          console.log('✅ Upload successful! URL:', publicUrl);
          return new Response(JSON.stringify({ success: true, logoUrl: publicUrl, storage: 'firebase' }), { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } catch (saveError) {
          console.error('❌ Failed to save file to Firebase Storage:', saveError);
          throw saveError; // Throw to outer catch to try Cloudinary
        }
      } catch (err) {
        console.error('❌ Firebase Storage upload failed:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        
        // Always try Cloudinary fallback for any Firebase error
        console.log('🔄 Firebase Storage failed, trying Cloudinary fallback...');
        // Fall through to Cloudinary fallback below
      }
    }

    // Fallback to Cloudinary if Firebase Storage fails or is not configured
    console.log('🔄 Trying Cloudinary as fallback...');
    
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const dataUri = `data:${contentType || 'image/png'};base64,${base64}`;
        const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const publicId = `coupon_logos/${Date.now()}_${safeName}`;
        
        console.log('📤 Uploading to Cloudinary:', publicId);
        
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(
            dataUri,
            {
              public_id: publicId,
              folder: 'coupon_logos',
              resource_type: 'auto',
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
        });

        const result = uploadResult as any;
        const logoUrl = result.secure_url || result.url;

        console.log('✅ Cloudinary upload successful! URL:', logoUrl);

        return new Response(
          JSON.stringify({ success: true, logoUrl, storage: 'cloudinary' }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (cloudinaryError) {
        console.error('❌ Cloudinary upload also failed:', cloudinaryError);
        const cloudinaryErrorMessage = cloudinaryError instanceof Error ? cloudinaryError.message : String(cloudinaryError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Both Firebase Storage and Cloudinary upload failed. Cloudinary error: ${cloudinaryErrorMessage}. Please configure either Firebase Storage or Cloudinary.` 
          }),
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // If no service account and no Cloudinary, return helpful error message
    console.warn('⚠️ Neither Firebase Admin SDK nor Cloudinary is configured');
    const errorResponse = { 
      success: false, 
      error: 'No storage configured. Please either: 1) Enable Firebase Storage and configure FIREBASE_ADMIN_SA, or 2) Configure Cloudinary (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in .env.local. Cloudinary is FREE for students!' 
    };
    console.log('📤 Returning error response:', errorResponse);
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err) {
    console.error('Unexpected error in upload route:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Upload route error: ${errorMessage}` 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}


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

    // If service account is provided, try Admin SDK (recommended)
    if (process.env.FIREBASE_ADMIN_SA) {
      console.log('✅ FIREBASE_ADMIN_SA found, attempting Admin SDK upload...');
      console.log('📋 Service account length:', process.env.FIREBASE_ADMIN_SA.length);
      console.log('📋 Storage bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
      
      try {
        const adminModule = await import('firebase-admin');
        const admin = adminModule.default || adminModule;

        if (!admin.apps.length) {
          console.log('🔧 Initializing Firebase Admin SDK...');
          let serviceAccount;
          try {
            serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SA as string);
            console.log('✅ Service account JSON parsed successfully');
          } catch (parseError) {
            console.error('❌ Failed to parse FIREBASE_ADMIN_SA as JSON:', parseError);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Invalid FIREBASE_ADMIN_SA format. It must be a valid JSON string wrapped in single quotes. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}` 
              }), 
              { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
          
          try {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            });
            console.log('✅ Firebase Admin SDK initialized successfully');
          } catch (initError) {
            console.error('❌ Failed to initialize Firebase Admin SDK:', initError);
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: `Failed to initialize Firebase Admin SDK: ${initError instanceof Error ? initError.message : String(initError)}` 
              }), 
              { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        } else {
          console.log('✅ Firebase Admin SDK already initialized');
        }

        const buffer = Buffer.from(base64, 'base64');
        const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        const dest = `coupon_logos/${Date.now()}_${safeName}`;
        console.log('📤 Uploading file to:', dest);
        
        const bucket = admin.storage().bucket();
        const file = bucket.file(dest);

        console.log('💾 Saving file to storage...');
        await file.save(buffer, { metadata: { contentType: contentType || 'image/svg+xml' }, resumable: false });
        console.log('✅ File saved successfully');

        try {
          console.log('🌐 Making file public...');
          await file.makePublic();
          console.log('✅ File made public');
        } catch (e) {
          console.warn('⚠️ makePublic failed (file may already be public):', e);
        }

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
        console.log('✅ Upload successful! URL:', publicUrl);
        return new Response(JSON.stringify({ success: true, logoUrl: publicUrl }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('Admin SDK upload error:', err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Admin SDK upload failed: ${errorMessage}. Please check your FIREBASE_ADMIN_SA configuration.` 
          }), 
          { 
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // If no service account, return helpful error message
    console.warn('⚠️ FIREBASE_ADMIN_SA not configured');
    const errorResponse = { 
      success: false, 
      error: 'FIREBASE_ADMIN_SA not configured. Logo upload requires Firebase Admin SDK. Please add FIREBASE_ADMIN_SA to your .env.local file. The coupon will be created without a logo.' 
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


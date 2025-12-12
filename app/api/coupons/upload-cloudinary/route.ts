// Server-side coupon logo upload route using Cloudinary (Free alternative to Firebase Storage)

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, contentType, base64 } = body || {};

    console.log('📤 Cloudinary upload request received');

    if (!base64 || !fileName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing file data' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env.local file.' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64, 'base64');
      
      // Create a data URI for Cloudinary
      const dataUri = `data:${contentType || 'image/png'};base64,${base64}`;
      
      // Upload to Cloudinary
      const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const publicId = `coupon_logos/${Date.now()}_${safeName}`;
      
      console.log('📤 Uploading to Cloudinary:', publicId);
      
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          dataUri,
          {
            public_id: publicId,
            folder: 'coupon_logos',
            resource_type: 'auto', // Auto-detect image/video
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });

      const result = uploadResult as any;
      const logoUrl = result.secure_url || result.url;

      console.log('✅ Upload successful! URL:', logoUrl);

      return new Response(
        JSON.stringify({ success: true, logoUrl }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Cloudinary upload failed: ${errorMessage}` 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (err) {
    console.error('Unexpected error in Cloudinary upload route:', err);
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


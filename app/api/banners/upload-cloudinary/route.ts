import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, contentType, base64 } = body || {};

    console.log('📤 Cloudinary banner upload request received');

    if (!base64 || !fileName) {
      return NextResponse.json(
        { success: false, error: 'Missing file data' },
        { status: 400 }
      );
    }

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Cloudinary not configured. Please add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env.local file.',
        },
        { status: 500 }
      );
    }

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64, 'base64');

      // Create a data URI for Cloudinary
      const dataUri = `data:${contentType || 'image/png'};base64,${base64}`;

      // Upload to Cloudinary
      // Clean the file name
      const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      // Remove extension from name (Cloudinary will add it automatically)
      const nameWithoutExt = safeName.replace(/\.[^/.]+$/, '');
      // Create public_id with timestamp (folder will be added via folder parameter)
      const publicId = `${Date.now()}_${nameWithoutExt}`;

      console.log('📤 Uploading to Cloudinary:', publicId);
      console.log('📤 Content Type:', contentType);
      console.log('📤 Folder: banners');

      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          dataUri,
          {
            public_id: publicId,
            folder: 'banners', // Use folder parameter to organize files
            resource_type: 'auto', // Auto-detect image/video
            // Don't set format - let Cloudinary detect it from the data URI
          },
          (error, result) => {
            if (error) {
              console.error('❌ Cloudinary upload error details:', error);
              reject(error);
            } else {
              console.log('✅ Cloudinary upload result:', {
                public_id: result?.public_id,
                secure_url: result?.secure_url,
                url: result?.url,
                format: result?.format
              });
              resolve(result);
            }
          }
        );
      });

      const result = uploadResult as any;
      
      // Use the URL that Cloudinary returns - it should already have the correct path
      const imageUrl = result.secure_url || result.url || result.public_id;
      
      // Ensure we return a string URL
      let finalUrl = typeof imageUrl === 'string' ? imageUrl : String(imageUrl || '');
      
      // If URL doesn't have the full path, construct it manually
      if (finalUrl && !finalUrl.includes('res.cloudinary.com')) {
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const format = result.format || 'png';
        finalUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${result.public_id}.${format}`;
      }

      console.log('✅ Upload successful!');
      console.log('   Public ID:', result.public_id);
      console.log('   Format:', result.format);
      console.log('   Secure URL:', result.secure_url);
      console.log('   Final URL:', finalUrl);

      return NextResponse.json(
        { success: true, imageUrl: finalUrl },
        { status: 200 }
      );
    } catch (error) {
      console.error('❌ Cloudinary upload error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        {
          success: false,
          error: `Cloudinary upload failed: ${errorMessage}`,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('❌ Server error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}


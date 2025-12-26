import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, contentType, base64 } = body || {};

    if (!base64 || !fileName) {
      return NextResponse.json({ success: false, error: 'Missing file data' }, { status: 400 });
    }

    // Ensure Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ success: false, error: 'Supabase not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Bucket name from env or default
    const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || 'categories-mimecode';

    // Ensure bucket exists
    const { data: buckets, error: bucketsErr } = await supabase.storage.listBuckets();
    if (bucketsErr) {
      console.error('Error listing buckets:', bucketsErr);
    } else {
      const bucketExists = buckets.some(b => b.name === supabaseBucket);
      if (!bucketExists) {
        console.log(`Bucket "${supabaseBucket}" not found, attempting to create...`);
        const { error: createErr } = await supabase.storage.createBucket(supabaseBucket, {
          public: true,
          allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
          fileSizeLimit: 5242880 // 5MB
        });
        if (createErr) {
          console.error('Error creating bucket:', createErr);
          return NextResponse.json({ success: false, error: `Failed to create bucket: ${createErr.message}` }, { status: 500 });
        }
        console.log(`Bucket "${supabaseBucket}" created successfully`);
      }
    }

    // Prepare file content
    const buffer = Buffer.from(base64, 'base64');
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const filePath = `${Date.now()}_${safeName}`;

    // Upload to Supabase Storage
    const { error: upErr } = await supabase.storage
      .from(supabaseBucket)
      .upload(filePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      });

    if (upErr) {
      console.error('Supabase category logo upload error:', upErr);
      return NextResponse.json({ success: false, error: upErr.message }, { status: 500 });
    }

    // Get public URL
    const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ success: false, error: 'Failed to get public URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl
    }, { status: 200 });

  } catch (error: any) {
    console.error('Category logo upload API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

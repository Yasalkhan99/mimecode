import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, logoUrl, layoutPosition, websiteUrl, collection } = body || {};

  if (!logoUrl) {
    return NextResponse.json({ success: false, error: 'Missing logo URL' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_LOGOS_COLLECTION || 'logos-mimecode';

  try {
    const firestore = getAdminFirestore();
    const originalUrl = extractOriginalCloudinaryUrl(logoUrl);

    const logoData: any = {
      name: name || '',
      logoUrl: originalUrl || logoUrl,
      websiteUrl: websiteUrl || logoUrl, // Use websiteUrl if provided, otherwise use logoUrl
      layoutPosition: layoutPosition !== undefined ? layoutPosition : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await firestore.collection(targetCollection).add(logoData);
    return NextResponse.json({ success: true, id: docRef.id, logoUrl: originalUrl || logoUrl }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK create logo from URL error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


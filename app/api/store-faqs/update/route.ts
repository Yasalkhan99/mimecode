import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, storeFaq, collection } = body || {};

  if (!id || !storeFaq) {
    return NextResponse.json({ success: false, error: 'Missing Store FAQ ID or updates' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_STORE_FAQS_COLLECTION || 'storeFaqs-mimecode';

  try {
    const firestore = getAdminFirestore();
    const docRef = firestore.collection(targetCollection).doc(id);
    await docRef.update({
      ...storeFaq,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK update Store FAQ error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


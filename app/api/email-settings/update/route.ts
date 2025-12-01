import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email1, email2, email3, collection, docId } = body || {};

  if (!email1 && !email2 && !email3) {
    return NextResponse.json({ success: false, error: 'At least one email address is required' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_EMAIL_SETTINGS_COLLECTION || 'emailSettings-mimecode';
  const targetDocId = docId || 'main';

  try {
    const firestore = getAdminFirestore();
    const docRef = firestore.collection(targetCollection).doc(targetDocId);
    
    await docRef.set({
      email1: (email1 || '').trim(),
      email2: (email2 || '').trim(),
      email3: (email3 || '').trim(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK update email settings error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


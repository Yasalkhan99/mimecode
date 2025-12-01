import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, updates, collection } = body || {};

  if (!id || !updates) {
    return NextResponse.json({ success: false, error: 'Missing category ID or updates' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_CATEGORIES_COLLECTION || 'categories-mimecode';

  try {
    const firestore = getAdminFirestore();
    const docRef = firestore.collection(targetCollection).doc(id);
    
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    await docRef.update(updateData);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK update category error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


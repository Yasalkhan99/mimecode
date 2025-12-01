import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, backgroundColor, logoUrl, collection } = body || {};

  if (!name || !backgroundColor) {
    return NextResponse.json({ success: false, error: 'Missing category data (name or backgroundColor)' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_CATEGORIES_COLLECTION || 'categories-mimecode';

  try {
    const firestore = getAdminFirestore();
    const categoryData: any = {
      name: name,
      backgroundColor: backgroundColor,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    if (logoUrl) {
      categoryData.logoUrl = logoUrl;
    }
    
    const docRef = await firestore.collection(targetCollection).add(categoryData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK create category error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


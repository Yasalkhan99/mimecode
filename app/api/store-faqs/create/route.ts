import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { storeFaq, collection } = body || {};

  if (!storeFaq) {
    return NextResponse.json({ success: false, error: 'Missing Store FAQ data' }, { status: 400 });
  }

  if (!storeFaq.storeId || !storeFaq.question || !storeFaq.answer) {
    return NextResponse.json({ success: false, error: 'Store ID, question and answer are required' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_STORE_FAQS_COLLECTION || 'storeFaqs-mimecode';

  try {
    const firestore = getAdminFirestore();
    const storeFaqData: any = {
      storeId: storeFaq.storeId,
      question: storeFaq.question,
      answer: storeFaq.answer,
      order: storeFaq.order || 0,
      isActive: storeFaq.isActive !== false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await firestore.collection(targetCollection).add(storeFaqData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK create Store FAQ error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


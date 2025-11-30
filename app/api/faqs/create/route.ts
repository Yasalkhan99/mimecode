import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { faq, collection } = body || {};

  if (!faq) {
    return NextResponse.json({ success: false, error: 'Missing FAQ data' }, { status: 400 });
  }

  if (!faq.question || !faq.answer) {
    return NextResponse.json({ success: false, error: 'Question and answer are required' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_FAQS_COLLECTION || 'faqs-mimecode';

  try {
    const firestore = getAdminFirestore();
    const faqData: any = {
      question: faq.question,
      answer: faq.answer,
      order: faq.order || 0,
      isActive: faq.isActive !== false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await firestore.collection(targetCollection).add(faqData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK create FAQ error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


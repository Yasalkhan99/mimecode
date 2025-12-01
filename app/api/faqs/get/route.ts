import { getAdminFirestore } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

// Helper function to convert Firestore Timestamp to milliseconds
const convertTimestamp = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(convertTimestamp);
  }
  const converted: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
      converted[key] = value.toMillis();
    } else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      const timestampObj = value as { seconds: number; nanoseconds: number };
      converted[key] = timestampObj.seconds * 1000 + Math.floor(timestampObj.nanoseconds / 1000000);
    } else if (value && typeof value === 'object') {
      converted[key] = convertTimestamp(value);
    } else {
      converted[key] = value;
    }
  }
  return converted;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') || process.env.NEXT_PUBLIC_FAQS_COLLECTION || 'faqs-mimecode';
    const id = searchParams.get('id');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (process.env.FIREBASE_ADMIN_SA || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const firestore = getAdminFirestore();

        if (id) {
          const docSnap = await firestore.collection(collection).doc(id).get();
          if (docSnap.exists) {
            const faqData = convertTimestamp({ id: docSnap.id, ...docSnap.data() });
            return NextResponse.json({ success: true, faq: faqData }, { status: 200 });
          } else {
            return NextResponse.json({ success: true, faq: null }, { status: 200 });
          }
        }

        const snapshot = await firestore.collection(collection).get();
        let faqs = snapshot.docs.map((doc) => convertTimestamp({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter active FAQs if requested
        if (activeOnly) {
          faqs = faqs.filter((faq) => faq.isActive !== false);
        }

        // Sort in memory: first by order, then by createdAt
        faqs.sort((a, b) => {
          const orderA = a.order || 0;
          const orderB = b.order || 0;
          if (orderA !== orderB) {
            return orderA - orderB;
          }
          // If order is same, sort by createdAt
          const createdAtA = a.createdAt || 0;
          const createdAtB = b.createdAt || 0;
          return createdAtA - createdAtB;
        });

        return NextResponse.json({ success: true, faqs }, { status: 200 });
      } catch (err) {
        console.error('Admin SDK get FAQs error:', err);
        return NextResponse.json({ success: false, error: `Admin SDK error: ${err instanceof Error ? err.message : String(err)}`, faqs: [], faq: null }, { status: 500 });
      }
    }

    return NextResponse.json({ success: false, error: 'Firebase Admin SDK not configured', faqs: [], faq: null }, { status: 500 });
  } catch (err) {
    console.error('Server get FAQs error:', err);
    return NextResponse.json({ success: false, error: String(err), faqs: [], faq: null }, { status: 500 });
  }
}


import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coupon, collection } = body || {};

    console.log('📥 Received coupon create request:', {
      hasCoupon: !!coupon,
      couponType: coupon?.couponType,
      hasCode: !!coupon?.code,
      hasDescription: !!coupon?.description,
      hasStoreName: !!coupon?.storeName,
    });

    if (!coupon) {
      return NextResponse.json({ success: false, error: 'Missing coupon data' }, { status: 400 });
    }

    // Validate required fields based on coupon type
    // For 'code' type, code is required
    if (coupon.couponType === 'code' && (!coupon.code || (typeof coupon.code === 'string' && coupon.code.trim() === ''))) {
      return NextResponse.json({ success: false, error: 'Coupon code is required for code type coupons' }, { status: 400 });
    }

    // Description is optional, but if missing, use empty string
    if (!coupon.description) {
      coupon.description = '';
    }

    // Code is optional for 'deal' type, but if it exists and is empty string, remove it
    if (coupon.couponType === 'deal' && coupon.code === '') {
      delete coupon.code;
    }

    const targetCollection = collection || process.env.NEXT_PUBLIC_COUPONS_COLLECTION || 'coupons-mimecode';

    try {
      const firestore = getAdminFirestore();
      const couponData: any = {
        ...coupon,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await firestore.collection(targetCollection).add(couponData);
      return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
    } catch (error) {
      console.error('Admin SDK create coupon error:', error);
      return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


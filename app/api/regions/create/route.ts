import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { region, collection } = body || {};

  if (!region) {
    return NextResponse.json({ success: false, error: 'Missing region data' }, { status: 400 });
  }

  if (!region.name || !region.networkId) {
    return NextResponse.json({ success: false, error: 'Region name and network ID are required' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_REGIONS_COLLECTION || 'regions-mimecode';

  try {
    const firestore = getAdminFirestore();
    
    // Check if network ID already exists
    const existingSnapshot = await firestore.collection(targetCollection)
      .where('networkId', '==', region.networkId.trim())
      .get();
    
    if (!existingSnapshot.empty) {
      return NextResponse.json({ success: false, error: 'Network ID already exists' }, { status: 400 });
    }

    const regionData: any = {
      name: region.name.trim(),
      networkId: region.networkId.trim(),
      description: region.description?.trim() || '',
      isActive: region.isActive !== false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    const docRef = await firestore.collection(targetCollection).add(regionData);
    return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK create region error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


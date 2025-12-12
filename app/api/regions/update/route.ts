import { getAdminFirestore, default as admin } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, updates, collection } = body || {};

  if (!id || !updates) {
    return NextResponse.json({ success: false, error: 'Missing region ID or updates' }, { status: 400 });
  }

  const targetCollection = collection || process.env.NEXT_PUBLIC_REGIONS_COLLECTION || 'regions-mimecode';

  try {
    const firestore = getAdminFirestore();
    
    // If network ID is being updated, check if it already exists
    if (updates.networkId) {
      const existingSnapshot = await firestore.collection(targetCollection)
        .where('networkId', '==', updates.networkId.trim())
        .get();
      
      // Check if any document with this network ID exists and is not the current document
      const conflictingDoc = existingSnapshot.docs.find(doc => doc.id !== id);
      if (conflictingDoc) {
        return NextResponse.json({ success: false, error: 'Network ID already exists' }, { status: 400 });
      }
    }

    const docRef = firestore.collection(targetCollection).doc(id);
    const updateData: any = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    // Trim string fields if they exist
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.networkId) updateData.networkId = updateData.networkId.trim();
    if (updateData.description) updateData.description = updateData.description.trim();
    
    await docRef.update(updateData);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Admin SDK update region error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


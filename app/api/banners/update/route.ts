// Server-side banner update route
// Uses Firebase Firestore

import { getAdminFirestore } from '@/lib/firebase-admin';
import { clearBannersCache } from '../get/route';

// Collection name for banners
const BANNERS_COLLECTION = process.env.NEXT_PUBLIC_BANNERS_COLLECTION || 'banners-mimecode';

export async function POST(req: Request) {
  const body = await req.json();
  const { id, updates } = body || {};

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing banner ID' }), { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    // Prepare updates for Firebase
    const firebaseUpdates: any = {};
    if (updates.title !== undefined) firebaseUpdates.title = updates.title;
    if (updates.imageUrl !== undefined) firebaseUpdates.imageUrl = updates.imageUrl;
    if (updates.layoutPosition !== undefined) {
      firebaseUpdates.layoutPosition = updates.layoutPosition;
    }
    firebaseUpdates.updatedAt = new Date();

    await db.collection(BANNERS_COLLECTION).doc(id).update(firebaseUpdates);

    console.log(`✅ Banner updated successfully: ${id}`, firebaseUpdates);

    // Clear cache to show updated banner immediately
    clearBannersCache();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Firebase update banner error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}

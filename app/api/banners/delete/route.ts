// Server-side banner delete route
// Uses Firebase Firestore

import { getAdminFirestore } from '@/lib/firebase-admin';
import { clearBannersCache } from '../get/route';

// Collection name for banners
const BANNERS_COLLECTION = process.env.NEXT_PUBLIC_BANNERS_COLLECTION || 'banners-mimecode';

export async function POST(req: Request) {
  const body = await req.json();
  const { id } = body || {};

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing banner ID' }), { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    await db.collection(BANNERS_COLLECTION).doc(id).delete();

    console.log(`✅ Banner deleted successfully: ${id}`);

    // Clear cache to remove deleted banner immediately
    clearBannersCache();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Firebase delete banner error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}

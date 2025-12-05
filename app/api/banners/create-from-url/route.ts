// Server-side banner creation from URL route
// Uses Firebase Firestore

import { getAdminFirestore } from '@/lib/firebase-admin';
import { clearBannersCache } from '../get/route';

// Collection name for banners
const BANNERS_COLLECTION = process.env.NEXT_PUBLIC_BANNERS_COLLECTION || 'banners-mimecode';

export async function POST(req: Request) {
  const body = await req.json();
  const { title, imageUrl, layoutPosition } = body || {};

  if (!imageUrl || !imageUrl.trim()) {
    return new Response(JSON.stringify({ success: false, error: 'Missing image URL' }), { status: 400 });
  }

  try {
    const db = getAdminFirestore();

    const bannerData: any = {
      title: title || '',
      imageUrl: imageUrl.trim(),
      createdAt: new Date(),
    };
    
    if (layoutPosition !== undefined && layoutPosition !== null) {
      bannerData.layoutPosition = Number(layoutPosition); // Ensure it's a number
      console.log(`📝 Creating banner with layoutPosition: ${bannerData.layoutPosition} (type: ${typeof bannerData.layoutPosition})`);
    } else {
      console.log(`📝 Creating banner without layoutPosition`);
    }

    console.log(`📝 Banner data being inserted:`, bannerData);

    const docRef = await db.collection(BANNERS_COLLECTION).add(bannerData);

    console.log(`✅ Banner created successfully:`, { 
      id: docRef.id, 
      title: bannerData.title, 
      layoutPosition: bannerData.layoutPosition,
    });

    // Clear cache to show new banner immediately
    clearBannersCache();

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: docRef.id, 
        imageUrl: imageUrl.trim() 
      }), 
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Firebase create from URL error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}

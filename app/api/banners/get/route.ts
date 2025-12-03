// Server-side banner read route
// Uses Firebase Firestore

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

// Collection name for banners
const BANNERS_COLLECTION = process.env.NEXT_PUBLIC_BANNERS_COLLECTION || 'banners-mimecode';

// Helper function to convert Firebase doc to API format
const convertToAPIFormat = (doc: any) => {
  const data = doc.data();
  
  // Ensure layoutPosition is a number if it exists
  let layoutPosition = data.layoutPosition;
  if (layoutPosition !== null && layoutPosition !== undefined) {
    layoutPosition = Number(layoutPosition);
    // If conversion failed, set to null
    if (isNaN(layoutPosition)) {
      layoutPosition = null;
    }
  } else {
    layoutPosition = null;
  }
  
  // Handle createdAt - could be Firestore Timestamp or other formats
  let createdAt = null;
  if (data.createdAt) {
    if (data.createdAt.toDate) {
      createdAt = data.createdAt.toDate().toISOString();
    } else if (data.createdAt instanceof Date) {
      createdAt = data.createdAt.toISOString();
    } else {
      createdAt = data.createdAt;
    }
  }
  
  return {
    id: doc.id || '',
    title: data.title || '',
    imageUrl: data.imageUrl || '',
    layoutPosition: layoutPosition,
    createdAt: createdAt,
  };
};

export async function GET(req: NextRequest) {
  try {
    const db = getAdminFirestore();

    // Get all banners from Firebase collection
    const snapshot = await db.collection(BANNERS_COLLECTION).get();
    
    const banners: any[] = [];
    snapshot.forEach((doc) => {
      banners.push(convertToAPIFormat(doc));
    });

    // Sort by layoutPosition (ascending, nulls last), then by createdAt (descending)
    banners.sort((a, b) => {
      // First sort by layoutPosition
      if (a.layoutPosition === null && b.layoutPosition === null) {
        // Both null, sort by createdAt descending
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (a.layoutPosition === null) return 1; // nulls last
      if (b.layoutPosition === null) return -1; // nulls last
      if (a.layoutPosition !== b.layoutPosition) {
        return a.layoutPosition - b.layoutPosition;
      }
      // Same layoutPosition, sort by createdAt descending
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    console.log(`📊 Firebase banners API: Fetched ${banners.length} banners from collection '${BANNERS_COLLECTION}'`);
    if (banners.length > 0) {
      console.log(`📋 Banner layout positions:`, banners.map((b: any) => ({ 
        id: b.id, 
        title: b.title, 
        layoutPosition: b.layoutPosition,
      })));
    }

    return NextResponse.json({
      success: true,
      banners: banners,
    });
  } catch (error: any) {
    console.error('Firebase get banners error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get banners',
        banners: [],
      },
      { status: 500 }
    );
  }
}


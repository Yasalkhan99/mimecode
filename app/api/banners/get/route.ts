// Server-side banner read route
// Uses Firebase Firestore with caching

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';

// Collection name for banners
const BANNERS_COLLECTION = process.env.NEXT_PUBLIC_BANNERS_COLLECTION || 'banners-mimecode';

// Simple in-memory cache with shorter TTL for better real-time updates
let bannersCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 1000; // 5 seconds cache - faster real-time updates

// Export function to clear cache (called by create/update/delete routes)
export function clearBannersCache() {
  bannersCache = { data: null, timestamp: 0 };
  console.log('🗑️ Banners cache cleared');
}

// Helper function to convert Firebase doc to API format
const convertToAPIFormat = (doc: any) => {
  const data = doc.data();
  
  let layoutPosition = data.layoutPosition;
  if (layoutPosition !== null && layoutPosition !== undefined) {
    layoutPosition = Number(layoutPosition);
    if (isNaN(layoutPosition)) layoutPosition = null;
  } else {
    layoutPosition = null;
  }
  
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
    // Check cache first
    const now = Date.now();
    if (bannersCache.data && (now - bannersCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        { success: true, banners: bannersCache.data },
        { 
          headers: { 
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
            'CDN-Cache-Control': 'public, s-maxage=300',
            'Vary': 'Accept-Encoding'
          } 
        }
      );
    }

    const db = getAdminFirestore();
    const snapshot = await db.collection(BANNERS_COLLECTION).get();
    
    const banners: any[] = [];
    snapshot.forEach((doc) => {
      banners.push(convertToAPIFormat(doc));
    });

    // Sort by layoutPosition (ascending, nulls last), then by createdAt (descending)
    banners.sort((a, b) => {
      if (a.layoutPosition === null && b.layoutPosition === null) {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (a.layoutPosition === null) return 1;
      if (b.layoutPosition === null) return -1;
      if (a.layoutPosition !== b.layoutPosition) {
        return a.layoutPosition - b.layoutPosition;
      }
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    // Update cache
    bannersCache = { data: banners, timestamp: now };

    return NextResponse.json(
      { success: true, banners: banners },
      { 
        headers: { 
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600, max-age=60',
          'CDN-Cache-Control': 'public, s-maxage=300',
          'Vary': 'Accept-Encoding'
        } 
      }
    );
  } catch (error: any) {
    console.error('Firebase get banners error:', error);
    // Return 200 with empty array to prevent frontend errors
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get banners', banners: [] },
      { 
        status: 200,
        headers: { 
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120, max-age=30',
          'CDN-Cache-Control': 'public, s-maxage=60',
          'Vary': 'Accept-Encoding'
        }
      }
    );
  }
}


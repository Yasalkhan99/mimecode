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
    const collection = searchParams.get('collection') || process.env.NEXT_PUBLIC_REGIONS_COLLECTION || 'regions-mimecode';
    const id = searchParams.get('id');
    const networkId = searchParams.get('networkId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    if (process.env.FIREBASE_ADMIN_SA || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const firestore = getAdminFirestore();
        if (!firestore) {
          // Firebase Admin SDK not initialized, return empty array gracefully
          return NextResponse.json({ success: true, regions: [], region: null }, { status: 200 });
        }

        if (id) {
          const docSnap = await firestore.collection(collection).doc(id).get();
          if (docSnap.exists) {
            const regionData = convertTimestamp({ id: docSnap.id, ...docSnap.data() });
            return NextResponse.json({ success: true, region: regionData }, { status: 200 });
          } else {
            return NextResponse.json({ success: true, region: null }, { status: 200 });
          }
        }

        if (networkId) {
          const snapshot = await firestore.collection(collection).where('networkId', '==', networkId).get();
          if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            const regionData = convertTimestamp({ id: doc.id, ...doc.data() });
            return NextResponse.json({ success: true, region: regionData }, { status: 200 });
          } else {
            return NextResponse.json({ success: true, region: null }, { status: 200 });
          }
        }

        // Get all regions
        const snapshot = await firestore.collection(collection).get();
        let regions = snapshot.docs.map((doc) => convertTimestamp({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter active regions if requested
        if (activeOnly) {
          regions = regions.filter((region) => region.isActive !== false);
        }

        // Sort by name
        regions.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

        return NextResponse.json({ success: true, regions }, { status: 200 });
      } catch (err) {
        // Log error but return empty array gracefully (don't break the app)
        console.error('Admin SDK get regions error:', err);
        // Return success with empty array instead of error to prevent client-side errors
        return NextResponse.json({ success: true, regions: [], region: null }, { status: 200 });
      }
    }

    // Firebase Admin SDK not configured - return empty array gracefully
    return NextResponse.json({ success: true, regions: [], region: null }, { status: 200 });
  } catch (err) {
    console.error('Server get regions error:', err);
    return NextResponse.json({ success: false, error: String(err), regions: [], region: null }, { status: 500 });
  }
}


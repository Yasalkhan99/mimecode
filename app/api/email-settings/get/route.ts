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
    const collection = searchParams.get('collection') || process.env.NEXT_PUBLIC_EMAIL_SETTINGS_COLLECTION || 'emailSettings-mimecode';
    const docId = searchParams.get('docId') || 'main';

    if (process.env.FIREBASE_ADMIN_SA || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const firestore = getAdminFirestore();
        const docSnap = await firestore.collection(collection).doc(docId).get();
        
        if (docSnap.exists) {
          const settingsData = convertTimestamp({ id: docSnap.id, ...docSnap.data() });
          return NextResponse.json({ success: true, settings: settingsData }, { status: 200 });
        } else {
          // Return default if no settings exist
          const defaultSettings = {
            id: docId,
            email1: 'admin@mimecode.com',
            email2: '',
            email3: '',
            email4: '',
            email5: '',
            email6: '',
          };
          return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
        }
      } catch (err) {
        console.error('Admin SDK get email settings error:', err);
        // Return default on error
        const defaultSettings = {
          id: docId,
          email1: 'admin@availcoupon.com',
          email2: '',
          email3: '',
          email4: '',
          email5: '',
          email6: '',
        };
        return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
      }
    }

    // Return default if Admin SDK not configured
    const defaultSettings = {
      id: docId,
      email1: 'admin@availcoupon.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
    return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
  } catch (err) {
    console.error('Server get email settings error:', err);
    const defaultSettings = {
      id: 'main',
      email1: 'admin@availcoupon.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
    return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
  }
}


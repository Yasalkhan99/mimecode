// Server-side logos read route
// Uses Firebase Admin SDK to bypass security rules

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get('collection') || process.env.NEXT_PUBLIC_LOGOS_COLLECTION || 'logos-mimecode';
    const id = searchParams.get('id');

    // Helper function to convert Firestore Timestamp to milliseconds
    const convertTimestamp = (data: any): any => {
      if (!data || typeof data !== 'object') return data;
      if (Array.isArray(data)) {
        return data.map(convertTimestamp);
      }
      const converted: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Check if it's a Firestore Timestamp
        if (value && typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
          converted[key] = value.toMillis();
        } else if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
          // Handle Timestamp-like objects (from Firestore Admin SDK)
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

    // Try Firebase Admin SDK first (bypasses security rules)
    if (process.env.FIREBASE_ADMIN_SA || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      try {
        const { getAdminFirestore } = await import('@/lib/firebase-admin');
        const firestore = getAdminFirestore();

        // Get logo by ID
        if (id) {
          const docSnap = await firestore.collection(collection).doc(id).get();
          if (docSnap.exists) {
            const logoData = convertTimestamp({ id: docSnap.id, ...docSnap.data() });
            return new Response(
              JSON.stringify({ 
                success: true, 
                logo: logoData
              }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          } else {
            return new Response(
              JSON.stringify({ success: true, logo: null }),
              { 
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }
        }
        
        // Get all logos
        const snapshot = await firestore.collection(collection).get();
        const logos = snapshot.docs.map((doc) => convertTimestamp({
          id: doc.id,
          ...doc.data(),
        }));

        return new Response(
          JSON.stringify({ success: true, logos }),
          { 
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      } catch (err) {
        console.error('Admin SDK get logos error:', err);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `Admin SDK error: ${err instanceof Error ? err.message : String(err)}`,
            logos: [],
            logo: null
          }), 
          { status: 500 }
        );
      }
    }

    // Fallback: Return empty array if Admin SDK not configured
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Firebase Admin SDK not configured',
        logos: [],
        logo: null
      }), 
      { status: 500 }
    );
  } catch (err) {
    console.error('Server get logos error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: String(err),
        logos: [],
        logo: null
      }), 
      { status: 500 }
    );
  }
}


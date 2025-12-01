// Server-side slug uniqueness check route
// Uses Firebase Admin SDK to bypass security rules

export async function POST(req: Request) {
  const body = await req.json();
  const { slug, excludeStoreId, collection } = body || {};

  if (!slug || !slug.trim()) {
    return new Response(JSON.stringify({ success: false, isUnique: false, error: 'Missing slug' }), { status: 400 });
  }

  // Use environment variable to separate collections between projects
  const targetCollection = collection || process.env.NEXT_PUBLIC_STORES_COLLECTION || 'stores-mimecode';

  // Try Firebase Admin SDK first (bypasses security rules)
  if (process.env.FIREBASE_ADMIN_SA || process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const { getAdminFirestore } = await import('@/lib/firebase-admin');
      const firestore = getAdminFirestore();

      const trimmedSlug = slug.trim();
      console.log('Checking slug uniqueness:', {
        slug: trimmedSlug,
        excludeStoreId,
        collection: targetCollection
      });

      // Query for stores with the same slug
      const snapshot = await firestore
        .collection(targetCollection)
        .where('slug', '==', trimmedSlug)
        .get();

      console.log(`Found ${snapshot.size} stores with slug "${trimmedSlug}"`);

      if (snapshot.empty) {
        console.log(`Slug "${trimmedSlug}" is unique`);
        return new Response(
          JSON.stringify({ success: true, isUnique: true }),
          { status: 200 }
        );
      }

      // Log all found stores for debugging
      snapshot.docs.forEach(doc => {
        console.log(`Found store with same slug:`, {
          id: doc.id,
          name: doc.data().name,
          slug: doc.data().slug
        });
      });

      // If editing, check if the slug belongs to the current store
      if (excludeStoreId) {
        const existingStore = snapshot.docs.find(doc => doc.id === excludeStoreId);
        const isOwnSlug = !!existingStore;
        console.log(`Editing store ${excludeStoreId}: slug ${isOwnSlug ? 'belongs to this store' : 'belongs to another store'}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            isUnique: isOwnSlug // Return true if slug belongs to current store
          }),
          { status: 200 }
        );
      }

      // Slug already exists for another store
      console.log(`Slug "${trimmedSlug}" is already taken by another store`);
      return new Response(
        JSON.stringify({ success: true, isUnique: false }),
        { status: 200 }
      );
    } catch (err) {
      console.error('Admin SDK check slug error:', err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          isUnique: false,
          error: `Admin SDK error: ${err instanceof Error ? err.message : String(err)}` 
        }), 
        { status: 500 }
      );
    }
  }

  // Fallback: Return error if Admin SDK not configured
  return new Response(
    JSON.stringify({ 
      success: false, 
      isUnique: false,
      error: 'Firebase Admin SDK not configured'
    }), 
    { status: 500 }
  );
}


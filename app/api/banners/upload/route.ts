// Server-side banner upload route
// Tries Admin SDK upload when `FIREBASE_ADMIN_SA` is set, otherwise falls back to REST (may fail if bucket requires auth)

export async function POST(req: Request) {
  const body = await req.json();
  const { title, fileName, contentType, base64, collection, layoutPosition } = body || {};

  if (!base64 || !fileName) {
    return new Response(JSON.stringify({ success: false, error: 'Missing file data' }), { status: 400 });
  }

  // If service account is provided, try Admin SDK (recommended)
  if (process.env.FIREBASE_ADMIN_SA) {
    try {
      const adminModule = await import('firebase-admin');
      const admin = adminModule.default || adminModule;

      if (!admin.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SA as string);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      }

      const buffer = Buffer.from(base64, 'base64');
      const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const targetCollection = collection || 'banners';
      const dest = `${targetCollection}/${Date.now()}_${safeName}`;
      const bucket = admin.storage().bucket();
      const file = bucket.file(dest);

      await file.save(buffer, { metadata: { contentType }, resumable: false });

      try {
        await file.makePublic();
      } catch (e) {
        console.warn('makePublic failed:', e);
      }

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
      const bannerData: any = {
        title: title || '',
        imageUrl: publicUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      if (layoutPosition !== undefined && layoutPosition !== null) {
        bannerData.layoutPosition = layoutPosition;
      }
      const docRef = await admin.firestore().collection(targetCollection).add(bannerData);

      return new Response(JSON.stringify({ success: true, id: docRef.id, imageUrl: publicUrl }), { status: 200 });
    } catch (err) {
      console.error('Admin SDK upload error:', err);
      // fall through to REST fallback
    }
  }

  // If Supabase is configured, try uploading there
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        global: { headers: {} },
      });

      const buffer = Buffer.from(base64, 'base64');
      const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const targetCollection = collection || 'banners';
      const filePath = `${targetCollection}/${Date.now()}_${safeName}`;

      // Use the same name for Supabase bucket as the collection, or set SUPABASE_STORAGE_BUCKET
      const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || targetCollection;
      const { error: upErr } = await supabase.storage.from(supabaseBucket).upload(filePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false,
      });

      if (upErr) {
        console.error('Supabase upload error:', upErr);
        // fallthrough to REST fallback
      } else {
        const { data } = supabase.storage.from(supabaseBucket).getPublicUrl(filePath);
        const publicUrl = data?.publicUrl || `https://${process.env.SUPABASE_URL}/storage/v1/object/public/${supabaseBucket}/${filePath}`;

        // Save metadata to Firestore via REST (or Admin SDK if available)
        if (process.env.FIREBASE_ADMIN_SA) {
          try {
            const adminModule = await import('firebase-admin');
            const admin = adminModule.default || adminModule;
            if (!admin.apps.length) {
              const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SA as string);
              admin.initializeApp({ credential: admin.credential.cert(serviceAccount as any) });
            }
            const bannerDataSupabase: any = {
              title: title || '',
              imageUrl: publicUrl,
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (layoutPosition !== undefined && layoutPosition !== null) {
              bannerDataSupabase.layoutPosition = layoutPosition;
            }
            const docRef = await admin.firestore().collection(targetCollection).add(bannerDataSupabase);
            return new Response(JSON.stringify({ success: true, id: docRef.id, imageUrl: publicUrl, stored: 'supabase' }), { status: 200 });
          } catch (e) {
            console.error('Admin SDK Firestore write failed after Supabase upload', e);
          }
        }

        // Firestore REST fallback
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        if (apiKey && projectId) {
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(targetCollection)}`;
          const now = new Date().toISOString();
          const fields: any = {
            title: { stringValue: title || '' },
            imageUrl: { stringValue: publicUrl },
            createdAt: { timestampValue: now },
          };
          if (layoutPosition !== undefined && layoutPosition !== null) {
            fields.layoutPosition = { integerValue: layoutPosition };
          }
          const docRes = await fetch(`${firestoreUrl}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fields }),
          });
          if (docRes.ok) {
            const docJson = await docRes.json();
            const docId = docJson.name?.split('/').pop() || '';
            return new Response(JSON.stringify({ success: true, id: docId, imageUrl: publicUrl, stored: 'supabase' }), { status: 200 });
          }
        }
      }
    } catch (err) {
      console.error('Supabase branch error:', err);
      // continue to REST fallback
    }
  }

  // REST fallback (may fail if bucket requires authenticated requests)
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

    if (!apiKey || !projectId || !storageBucket) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing Firebase config. Provide API key/project/bucket or set FIREBASE_ADMIN_SA.' }),
        { status: 500 }
      );
    }

    const buffer = Buffer.from(base64, 'base64');
    const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const targetCollection = collection || 'banners';
    const filePath = `${targetCollection}/${Date.now()}_${safeName}`;

    const uploadUrl = `https://www.googleapis.com/upload/storage/v1/b/${storageBucket}/o?uploadType=media&name=${encodeURIComponent(
      filePath
    )}&key=${apiKey}`;

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': contentType || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      console.error('Storage upload failed:', uploadRes.status, error);

      // Fallback: store the image base64 directly in Firestore document (quick dev fallback)
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(targetCollection)}`;
        const now = new Date().toISOString();
        const fallbackFields: any = {
          title: { stringValue: title || '' },
          imageData: { stringValue: base64 },
          imageContentType: { stringValue: contentType || '' },
          createdAt: { timestampValue: now },
        };
        if (layoutPosition !== undefined && layoutPosition !== null) {
          fallbackFields.layoutPosition = { integerValue: layoutPosition };
        }
        const docRes = await fetch(`${firestoreUrl}?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: fallbackFields }),
        });

        if (!docRes.ok) {
          const docErr = await docRes.text();
          console.error('Fallback Firestore write failed:', docRes.status, docErr);
          return new Response(
            JSON.stringify({ success: false, error: `Storage upload failed (${uploadRes.status}) and fallback Firestore write failed: ${docRes.status} - ${docErr}` }),
            { status: 500 }
          );
        }

        const docData = await docRes.json();
        const docId = docData.name?.split('/').pop() || '';
        return new Response(JSON.stringify({ success: true, id: docId, stored: 'firestoreBase64' }), { status: 200 });
      } catch (fbErr) {
        console.error('Fallback write error:', fbErr);
        return new Response(
          JSON.stringify({ success: false, error: `Storage upload failed: ${uploadRes.status} - ${error}. Fallback attempt failed: ${String(fbErr)}` }),
          { status: 500 }
        );
      }
    }

    const publicUrl = `https://storage.googleapis.com/${storageBucket}/${filePath}`;

    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${encodeURIComponent(targetCollection)}`;
    const now = new Date().toISOString();
    const restFields: any = {
      title: { stringValue: title || '' },
      imageUrl: { stringValue: publicUrl },
      createdAt: { timestampValue: now },
    };
    if (layoutPosition !== undefined && layoutPosition !== null) {
      restFields.layoutPosition = { integerValue: layoutPosition };
    }

    const docRes = await fetch(`${firestoreUrl}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: restFields }),
    });

    if (!docRes.ok) {
      const error = await docRes.text();
      console.error('Firestore write failed:', docRes.status, error);
      return new Response(
        JSON.stringify({ success: false, error: `Firestore write failed: ${docRes.status} - ${error}` }),
        { status: 500 }
      );
    }

    const docData = (await docRes.json()) as { name?: string };
    const docId = docData.name?.split('/').pop() || '';

    return new Response(JSON.stringify({ success: true, id: docId, imageUrl: publicUrl }), { status: 200 });
  } catch (err) {
    console.error('Server upload error:', err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), { status: 500 });
  }
}

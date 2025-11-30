// Server-side banner update route
// Uses Supabase (migrated from Firebase)

import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { id, updates } = body || {};

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing banner ID' }), { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Convert updates to Supabase format
    const supabaseUpdates: any = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.imageUrl !== undefined) supabaseUpdates.image_url = updates.imageUrl;
    if (updates.layoutPosition !== undefined) {
      supabaseUpdates.layout_position = updates.layoutPosition;
    }

    const { error } = await supabaseAdmin
      .from('banners')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Supabase update banner error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}


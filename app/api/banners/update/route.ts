// Server-side banner update route
// Uses Supabase

import { supabaseAdmin } from '@/lib/supabase';
import { clearBannersCache } from '../get/route';

export async function POST(req: Request) {
  const body = await req.json();
  const { id, updates } = body || {};

  if (!id) {
    return new Response(JSON.stringify({ success: false, error: 'Missing banner ID' }), { status: 400 });
  }

  try {
    // Check if Supabase Admin is available
    if (!supabaseAdmin) {
      console.error('❌ Supabase Admin not initialized');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Supabase Admin not initialized' 
        }), 
        { status: 500 }
      );
    }

    // Prepare updates for Supabase (convert camelCase to snake_case)
    const supabaseUpdates: any = {};
    if (updates.title !== undefined) supabaseUpdates.title = updates.title;
    if (updates.imageUrl !== undefined) supabaseUpdates.image_url = updates.imageUrl;
    if (updates.layoutPosition !== undefined) {
      supabaseUpdates.layout_position = updates.layoutPosition !== null ? Number(updates.layoutPosition) : null;
    }

    console.log(`📝 Updating banner ${id} with:`, supabaseUpdates);

    // Update banner in Supabase
    const { error } = await supabaseAdmin
      .from('banners')
      .update(supabaseUpdates)
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase update banner error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Failed to update banner' 
        }), 
        { status: 500 }
      );
    }

    console.log(`✅ Banner updated successfully in Supabase: ${id}`, supabaseUpdates);

    // Clear cache to show updated banner immediately
    clearBannersCache();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ Update banner error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}

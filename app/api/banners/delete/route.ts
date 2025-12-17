// Server-side banner delete route
// Uses Supabase

import { supabaseAdmin } from '@/lib/supabase';
import { clearBannersCache } from '../get/route';

export async function POST(req: Request) {
  const body = await req.json();
  const { id } = body || {};

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

    // Delete banner from Supabase
    const { error } = await supabaseAdmin
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Supabase delete banner error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Failed to delete banner' 
        }), 
        { status: 500 }
      );
    }

    console.log(`✅ Banner deleted successfully from Supabase: ${id}`);

    // Clear cache to remove deleted banner immediately
    clearBannersCache();

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ Delete banner error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}

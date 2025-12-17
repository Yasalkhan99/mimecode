// Server-side banner creation from URL route
// Uses Supabase

import { supabaseAdmin } from '@/lib/supabase';
import { clearBannersCache } from '../get/route';

export async function POST(req: Request) {
  const body = await req.json();
  const { title, imageUrl, layoutPosition } = body || {};

  if (!imageUrl || !imageUrl.trim()) {
    return new Response(JSON.stringify({ success: false, error: 'Missing image URL' }), { status: 400 });
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

    // Prepare banner data for Supabase
    const bannerData: any = {
      title: title || '',
      image_url: imageUrl.trim(),
    };
    
    if (layoutPosition !== undefined && layoutPosition !== null) {
      bannerData.layout_position = Number(layoutPosition); // Ensure it's a number
      console.log(`📝 Creating banner with layoutPosition: ${bannerData.layout_position} (type: ${typeof bannerData.layout_position})`);
    } else {
      console.log(`📝 Creating banner without layoutPosition`);
    }

    console.log(`📝 Banner data being inserted:`, bannerData);

    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert(bannerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase create from URL error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error.message || 'Failed to create banner' 
        }), 
        { status: 500 }
      );
    }

    console.log(`✅ Banner created successfully in Supabase:`, { 
      id: data.id, 
      title: bannerData.title, 
      layoutPosition: bannerData.layout_position,
    });

    // Clear cache to show new banner immediately
    clearBannersCache();

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id, 
        imageUrl: imageUrl.trim() 
      }), 
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ Create banner error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}

// Server-side banner creation from URL route
// Uses Supabase (migrated from Firebase)

import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const { title, imageUrl, layoutPosition } = body || {};

  if (!imageUrl || !imageUrl.trim()) {
    return new Response(JSON.stringify({ success: false, error: 'Missing image URL' }), { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const bannerData: any = {
      title: title || '',
      image_url: imageUrl.trim(),
    };
    
    if (layoutPosition !== undefined && layoutPosition !== null) {
      bannerData.layout_position = Number(layoutPosition); // Ensure it's a number
      console.log(`📝 Creating banner with layout_position: ${bannerData.layout_position} (type: ${typeof bannerData.layout_position})`);
    } else {
      console.log(`📝 Creating banner without layout_position`);
    }

    console.log(`📝 Banner data being inserted:`, bannerData);

    const { data, error } = await supabaseAdmin
      .from('banners')
      .insert(bannerData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }

    console.log(`✅ Banner created successfully:`, { 
      id: data.id, 
      title: data.title, 
      layout_position: data.layout_position,
      layout_position_type: typeof data.layout_position 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        id: data.id, 
        imageUrl: imageUrl.trim() 
      }), 
      { status: 200 }
    );
  } catch (err: any) {
    console.error('Supabase create from URL error:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err?.message || String(err) 
      }), 
      { status: 500 }
    );
  }
}


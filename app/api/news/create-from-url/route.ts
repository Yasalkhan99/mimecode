// Server-side news creation from URL route
// Uses Supabase (migrated from Firebase)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { extractOriginalCloudinaryUrl } from '@/lib/utils/cloudinary';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, articleUrl, imageUrl, description, content, layoutPosition, date } = body || {};

  if (!title || !imageUrl) {
    return NextResponse.json({ success: false, error: 'Missing title or image URL' }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const extractedImageUrl = extractOriginalCloudinaryUrl(imageUrl);

    const newsData: any = {
      title: title || '',
      description: description || '',
      content: content || '',
      image_url: extractedImageUrl || imageUrl.trim(),
      article_url: articleUrl || '',
      date: date || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    
    if (layoutPosition !== undefined && layoutPosition !== null) {
      newsData.layout_position = Number(layoutPosition); // Ensure it's a number
      console.log(`📝 Creating news article with layout_position: ${newsData.layout_position}`);
    }

    console.log(`📝 News data being inserted:`, newsData);

    const { data, error } = await supabaseAdmin
      .from('news')
      .insert(newsData)
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
    }

    console.log(`✅ News article created successfully:`, { 
      id: data.id, 
      title: data.title, 
      layout_position: data.layout_position 
    });

    return NextResponse.json({ 
      success: true, 
      id: data.id, 
      imageUrl: extractedImageUrl || imageUrl.trim() 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase create news from URL error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || String(error) 
    }, { status: 500 });
  }
}

import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { eventsNavLabel, eventsSlug, blogsNavLabel, blogsSlug } = body || {};

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Generate slug from label if slug is empty
    const generateSlug = (text: string): string => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    const finalEventsSlug = eventsSlug?.trim() || generateSlug(eventsNavLabel || 'events');
    const finalBlogsSlug = blogsSlug?.trim() || generateSlug(blogsNavLabel || 'blogs');

    const updateData = {
      events_nav_label: (eventsNavLabel || 'Events').trim(),
      events_slug: finalEventsSlug,
      blogs_nav_label: (blogsNavLabel || 'Blogs').trim(),
      blogs_slug: finalBlogsSlug,
      updated_at: new Date().toISOString(),
    };

    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('page_settings')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existingData) {
      const { error: updateError } = await supabaseAdmin
        .from('page_settings')
        .update(updateData)
        .eq('id', existingData.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('page_settings')
        .insert([updateData]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error updating page settings:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


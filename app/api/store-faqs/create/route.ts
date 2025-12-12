import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { storeFaq } = body || {};

    if (!storeFaq) {
      return NextResponse.json({ success: false, error: 'Missing Store FAQ data' }, { status: 400 });
    }

    if (!storeFaq.storeId || !storeFaq.question || !storeFaq.answer) {
      return NextResponse.json({ success: false, error: 'Store ID, question and answer are required' }, { status: 400 });
    }

    const storeFaqData = {
      store_id: storeFaq.storeId,
      question: storeFaq.question,
      answer: storeFaq.answer,
      order: storeFaq.order || 0,
      is_active: storeFaq.isActive !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Creating store FAQ for store:', storeFaq.storeId);

    const { data, error } = await supabaseAdmin
      .from('store_faqs')
      .insert([storeFaqData])
      .select()
      .single();

    if (error) {
      console.error('Supabase create Store FAQ error:', error);
      throw error;
    }

    console.log('Store FAQ created successfully:', data.id);

    return NextResponse.json({ success: true, id: data.id }, { status: 200 });
  } catch (error: any) {
    console.error('Create Store FAQ error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}

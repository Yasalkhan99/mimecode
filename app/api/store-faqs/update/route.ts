import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { id, storeFaq } = body || {};

    if (!id || !storeFaq) {
      return NextResponse.json({ success: false, error: 'Missing Store FAQ ID or updates' }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    // Map fields
    if (storeFaq.question !== undefined) updates.question = storeFaq.question;
    if (storeFaq.answer !== undefined) updates.answer = storeFaq.answer;
    if (storeFaq.order !== undefined) updates.order = storeFaq.order;
    if (storeFaq.isActive !== undefined) updates.is_active = storeFaq.isActive;
    if (storeFaq.storeId !== undefined) updates.store_id = storeFaq.storeId;

    console.log('Updating store FAQ:', id);

    const { error } = await supabaseAdmin
      .from('store_faqs')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Supabase update Store FAQ error:', error);
      throw error;
    }

    console.log('Store FAQ updated successfully:', id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Update Store FAQ error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}

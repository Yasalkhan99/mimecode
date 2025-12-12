import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const body = await req.json();
    const { id } = body || {};

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing Store FAQ ID' }, { status: 400 });
    }

    console.log('Deleting store FAQ:', id);

    const { error } = await supabaseAdmin
      .from('store_faqs')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete Store FAQ error:', error);
      throw error;
    }

    console.log('Store FAQ deleted successfully:', id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Delete Store FAQ error:', error);
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}

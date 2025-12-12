// Server-side FAQ update route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'FAQ ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (updates.question !== undefined) updateData.question = updates.question;
    if (updates.answer !== undefined) updateData.answer = updates.answer;
    if (updates.order !== undefined) updateData.order = updates.order;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update FAQ error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'FAQ not found' },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    console.log('✅ FAQ updated successfully:', id);
    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error('Update FAQ error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update FAQ',
      },
      { status: 500 }
    );
  }
}

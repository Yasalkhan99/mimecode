// Server-side FAQ creation route
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
    const { faq } = body;

    if (!faq || !faq.question || !faq.answer) {
      return NextResponse.json(
        { success: false, error: 'Question and answer are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('faqs')
      .insert([
        {
          question: faq.question,
          answer: faq.answer,
          order: faq.order || 0,
          is_active: faq.isActive !== false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase create FAQ error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message || 'Failed to create FAQ',
        },
        { status: 500 }
      );
    }

    console.log('✅ FAQ created successfully:', data.id);
    return NextResponse.json({
      success: true,
      id: data.id,
    });
  } catch (error: any) {
    console.error('❌ Create FAQ error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create FAQ',
      },
      { status: 500 }
    );
  }
}

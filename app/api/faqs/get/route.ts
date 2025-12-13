// Server-side FAQs read route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const lang = searchParams.get('lang') || 'en';

    // Get FAQ by ID
    if (id) {
      const { data, error } = await supabaseAdmin
        .from('faqs')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Supabase get FAQ by ID error:', error);
      }

      return NextResponse.json({
        success: true,
        faq: data ? {
          id: data.id,
          question: data.question,
          answer: data.answer,
          order: data.order,
          isActive: data.is_active,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        } : null,
      });
    }

    // Build query
    let query = supabaseAdmin
      .from('faqs')
      .select('*')
      .order('order', { ascending: true })
      .order('created_at', { ascending: false });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Try to filter by language_code
    // If the column doesn't exist yet (before migration), this will be ignored
    // and all FAQs will be returned (graceful degradation)
    query = query.eq('language_code', lang);

    const { data, error } = await query;
    
    // If error is due to missing column, try again without language filter
    if (error && (error.message?.includes('column') || error.code === 'PGRST116')) {
      // Retry without language filter (backward compatibility)
      let fallbackQuery = supabaseAdmin
        .from('faqs')
        .select('*')
        .order('order', { ascending: true })
        .order('created_at', { ascending: false });
      
      if (activeOnly) {
        fallbackQuery = fallbackQuery.eq('is_active', true);
      }
      
      const { data: fallbackData, error: fallbackError } = await fallbackQuery;
      
      if (fallbackError) {
        console.error('Supabase get FAQs error:', fallbackError);
        return NextResponse.json({
          success: true,
          faqs: [],
        });
      }
      
      const faqs = (fallbackData || []).map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        order: faq.order,
        isActive: faq.is_active,
        createdAt: faq.created_at,
        updatedAt: faq.updated_at,
      }));

      return NextResponse.json({
        success: true,
        faqs,
      });
    }

    if (error) {
      console.error('Supabase get FAQs error:', error);
      return NextResponse.json({
        success: true,
        faqs: [],
      });
    }

    const faqs = (data || []).map((faq: any) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
      isActive: faq.is_active,
      createdAt: faq.created_at,
      updatedAt: faq.updated_at,
    }));

    return NextResponse.json({
      success: true,
      faqs,
    });
  } catch (error: any) {
    console.error('Get FAQs error:', error);
    // Return 200 with empty array instead of 500 to prevent frontend errors
    return NextResponse.json(
      {
        success: true,
        faqs: [],
        faq: null,
      },
      { status: 200 }
    );
  }
}

// Server-side store FAQs read route
// Uses Supabase (migrated from Firebase)

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Helper function to convert Supabase row to API format
const convertToAPIFormat = (row: any) => {
  return {
    id: row.id || '',
    storeId: row.store_id || '',
    question: row.question || '',
    answer: row.answer || '',
    order: row.order || 0,
    isActive: row.is_active !== false,
    createdAt: row.created_at ? new Date(row.created_at).getTime() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : null,
  };
};

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const storeId = searchParams.get('storeId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    let query = supabaseAdmin.from('store_faqs').select('*');

    // Get FAQ by ID
    if (id) {
      const { data, error } = await query.eq('id', id).single();
      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        throw error;
      }
      return NextResponse.json({
        success: true,
        storeFaq: data ? convertToAPIFormat(data) : null,
      });
    }

    // Filter by storeId if provided
    if (storeId) {
      query = query.eq('store_id', storeId);
    }

    // Filter active FAQs if requested
    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    // Get store FAQs
    const { data, error } = await query.order('order', { ascending: true }).order('created_at', { ascending: true });
    if (error) throw error;

    const convertedFAQs = (data || []).map(convertToAPIFormat);

    return NextResponse.json({
      success: true,
      storeFaqs: convertedFAQs,
    });
  } catch (error: any) {
    console.error('Supabase get store FAQs error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get store FAQs',
        storeFaqs: [],
        storeFaq: null,
      },
      { status: 500 }
    );
  }
}


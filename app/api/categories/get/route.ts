// Server-side categories read route
// Uses Supabase

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Get category by ID
    if (id) {
      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return NextResponse.json({
        success: true,
        category: category || null,
      });
    }

    // Get all categories
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Convert snake_case to camelCase for frontend
    const formattedCategories = categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      logoUrl: cat.logo_url,
      backgroundColor: cat.background_color,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    })) || [];

    return NextResponse.json({
      success: true,
      categories: formattedCategories,
    });
  } catch (error: any) {
    console.error('Supabase get categories error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get categories',
        categories: [],
        category: null,
      },
      { status: 500 }
    );
  }
}


// Server-side categories read route
// Uses Supabase with caching

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Simple in-memory cache (shared across requests)
// Use global to share cache between get and delete routes
if (typeof (global as any).categoriesCache === 'undefined') {
  (global as any).categoriesCache = { data: null, timestamp: 0 };
}
const categoriesCache = (global as any).categoriesCache;
const CACHE_TTL = 120 * 1000; // 2 minutes cache (categories change rarely)

// Export function to clear cache
export function clearCategoriesCache() {
  categoriesCache.data = null;
  categoriesCache.timestamp = 0;
}

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Get category by ID (no cache)
    if (id) {
      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return NextResponse.json({
        success: true,
        category: category || null,
      });
    }

    // Check cache for full list
    const now = Date.now();
    if (categoriesCache.data && (now - categoriesCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(
        { success: true, categories: categoriesCache.data },
        { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
      );
    }

    // Get all categories
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convert snake_case to camelCase
    const formattedCategories = categories?.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      logoUrl: cat.logo_url,
      backgroundColor: cat.background_color,
      createdAt: cat.created_at,
      updatedAt: cat.updated_at,
    })) || [];

    // Update cache - modify properties instead of reassigning
    categoriesCache.data = formattedCategories;
    categoriesCache.timestamp = now;

    return NextResponse.json(
      { success: true, categories: formattedCategories },
      { headers: { 'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300' } }
    );
  } catch (error: any) {
    console.error('Supabase get categories error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get categories', categories: [], category: null },
      { status: 500 }
    );
  }
}

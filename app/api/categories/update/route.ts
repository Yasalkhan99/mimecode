import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { id, updates } = body || {};

  if (!id || !updates) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing category ID or updates' 
    }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Convert camelCase to snake_case for Supabase
    const updateData: any = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.backgroundColor !== undefined) updateData.background_color = updates.backgroundColor;
    if (updates.logoUrl !== undefined) updateData.logo_url = updates.logoUrl;
    
    const { error } = await supabaseAdmin
      .from('categories')
      .update(updateData)
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase update category error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) 
    }, { status: 500 });
  }
}


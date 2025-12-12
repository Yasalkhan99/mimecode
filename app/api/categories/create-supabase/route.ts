/**
 * Create Category - Supabase Version
 * 
 * This is an alternative API route that writes directly to Supabase
 * Use this to bypass Firebase quota issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { name, backgroundColor, logoUrl } = body || {};

    if (!name || !backgroundColor) {
      return NextResponse.json(
        { success: false, error: 'Missing category data (name or backgroundColor)' },
        { status: 400 }
      );
    }

    // Insert into Supabase
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: name,
        background_color: backgroundColor,
        logo_url: logoUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase create category error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, id: data.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}


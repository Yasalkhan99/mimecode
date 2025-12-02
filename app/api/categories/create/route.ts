import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, backgroundColor, logoUrl } = body || {};

  if (!name || !backgroundColor) {
    return NextResponse.json({ 
      success: false, 
      error: 'Missing category data (name or backgroundColor)' 
    }, { status: 400 });
  }

  try {
    const categoryData: any = {
      name: name,
      background_color: backgroundColor,
      logo_url: logoUrl || null,
    };
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ 
      success: true, 
      id: data.id 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Supabase create category error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || String(error) 
    }, { status: 500 });
  }
}


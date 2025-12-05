import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { uid, email, displayName, role } = await request.json();

    if (!uid || !email) {
      return NextResponse.json(
        { success: false, error: 'UID and email are required' },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    // Create user profile in Supabase
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: uid,
        email: email,
        display_name: displayName || null,
        role: role || 'user', // Default to 'user' role
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating user profile:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User profile created successfully',
      data: data
    });
  } catch (error: any) {
    console.error('Error creating user profile:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create user profile' },
      { status: 500 }
    );
  }
}


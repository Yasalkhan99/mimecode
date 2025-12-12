import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      const defaultSettings = {
        id: 'default',
        email1: 'admin@mimecode.com',
        email2: '',
        email3: '',
        email4: '',
        email5: '',
        email6: '',
      };
      return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
    }

    // Get the first (and only) row from email_settings table
    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Supabase get email settings error:', error);
      // Return default on error
      const defaultSettings = {
        id: 'default',
        email1: 'admin@mimecode.com',
        email2: '',
        email3: '',
        email4: '',
        email5: '',
        email6: '',
      };
      return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
    }
    
    if (data) {
      // Convert Supabase data to expected format
      const settingsData = {
        id: data.id,
        email1: data.email1 || '',
        email2: data.email2 || '',
        email3: data.email3 || '',
        email4: data.email4 || '',
        email5: data.email5 || '',
        email6: data.email6 || '',
        updatedAt: data.updated_at ? new Date(data.updated_at).getTime() : undefined,
      };
      return NextResponse.json({ success: true, settings: settingsData }, { status: 200 });
    }

    // Return default if no settings exist
    const defaultSettings = {
      id: 'default',
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
    return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
  } catch (err) {
    console.error('Server get email settings error:', err);
    const defaultSettings = {
      id: 'default',
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
    return NextResponse.json({ success: true, settings: defaultSettings }, { status: 200 });
  }
}


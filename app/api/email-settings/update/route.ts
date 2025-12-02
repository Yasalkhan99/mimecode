import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email1, email2, email3, email4, email5, email6 } = body || {};

  if (!email1 && !email2 && !email3 && !email4 && !email5 && !email6) {
    return NextResponse.json({ success: false, error: 'At least one email address is required' }, { status: 400 });
  }

  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    // Prepare update data
    const updateData = {
      email1: (email1 || '').trim(),
      email2: (email2 || '').trim(),
      email3: (email3 || '').trim(),
      email4: (email4 || '').trim(),
      email5: (email5 || '').trim(),
      email6: (email6 || '').trim(),
      updated_at: new Date().toISOString(),
    };

    // Check if a row exists
    const { data: existingData, error: fetchError } = await supabaseAdmin
      .from('email_settings')
      .select('id')
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
      throw fetchError;
    }

    if (existingData) {
      // Update existing row
      const { error: updateError } = await supabaseAdmin
        .from('email_settings')
        .update(updateData)
        .eq('id', existingData.id);

      if (updateError) throw updateError;
    } else {
      // Insert new row
      const { error: insertError } = await supabaseAdmin
        .from('email_settings')
        .insert([updateData]);

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Supabase update email settings error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}


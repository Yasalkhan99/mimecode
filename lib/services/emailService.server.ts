// Server-side only email service functions
// This file should NEVER be imported in client components

import { supabaseAdmin } from '@/lib/supabase';
import { EmailSettings } from './emailService';

// Get email settings (server-side - uses Supabase)
// This function should be used in server-side API routes only
export async function getEmailSettingsServer(): Promise<EmailSettings | null> {
  try {
    if (!supabaseAdmin) {
      console.error('❌ Supabase admin client not initialized');
      return {
        id: 'default',
        email1: 'admin@mimecode.com',
        email2: '',
        email3: '',
        email4: '',
        email5: '',
        email6: '',
      };
    }

    // Get the first (and only) row from email_settings table
    const { data, error } = await supabaseAdmin
      .from('email_settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('Error fetching email settings from Supabase:', error);
      // Return default settings
      return {
        id: 'default',
        email1: 'admin@mimecode.com',
        email2: '',
        email3: '',
        email4: '',
        email5: '',
        email6: '',
      };
    }
    
    if (data) {
      // Convert Supabase timestamp to milliseconds
      let updatedAt: number | undefined;
      if (data.updated_at) {
        updatedAt = new Date(data.updated_at).getTime();
      }
      
      return {
        id: data.id,
        email1: data.email1 || '',
        email2: data.email2 || '',
        email3: data.email3 || '',
        email4: data.email4 || '',
        email5: data.email5 || '',
        email6: data.email6 || '',
        updatedAt,
      };
    }
    
    // Return default if no settings exist
    return {
      id: 'default',
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
  } catch (error) {
    console.error('Error getting email settings (server):', error);
    return {
      id: 'default',
      email1: 'admin@mimecode.com',
      email2: '',
      email3: '',
      email4: '',
      email5: '',
      email6: '',
    };
  }
}


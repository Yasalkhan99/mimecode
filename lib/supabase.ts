/**
 * Supabase Client Configuration
 * 
 * This file provides Supabase clients for both client-side and server-side use.
 * 
 * Client-side: Uses anon key (public access, respects RLS)
 * Server-side: Uses service_role key (admin access, bypasses RLS)
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://eluvbskcqxcjedxfamno.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Client-side Supabase client (for use in React components)
 * Uses anon key - respects Row Level Security (RLS) policies
 * 
 * Usage in components:
 * import { supabase } from '@/lib/supabase';
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * Server-side Supabase client (for use in API routes, server components)
 * Uses service_role key - bypasses RLS policies (admin access)
 * 
 * Usage in API routes:
 * import { supabaseAdmin } from '@/lib/supabase';
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Export default client (client-side)
export default supabase;


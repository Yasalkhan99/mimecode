import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  role: 'admin' | 'user';
  created_at?: string;
  updated_at?: string;
}

/**
 * Get user profile from Supabase by user ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Silently handle "not found" errors (user doesn't have profile yet)
      if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
        return null;
      }
      // Log other errors but don't throw
      if (error.message.includes('relation "public.users" does not exist')) {
        console.warn('⚠️ Users table not found in Supabase. Please run the setup SQL.');
      } else {
        console.error('Error fetching user profile:', error);
      }
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Create or update user profile in Supabase
 */
export async function upsertUserProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name || null,
        role: profile.role || 'user',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error upserting user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in upsertUserProfile:', error);
    return null;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('users')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating user role:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserRole:', error);
    return false;
  }
}


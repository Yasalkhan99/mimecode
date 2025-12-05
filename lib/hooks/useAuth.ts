import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getUserProfile } from '@/lib/services/userService';

export interface UserWithRole extends User {
  role?: 'admin' | 'user';
}

export function useAuth() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth loading timeout - setting loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            // Try to fetch user role from Supabase
            let userProfile = null;
            try {
              userProfile = await getUserProfile(firebaseUser.uid);
            } catch (profileError) {
              console.error('Error fetching user profile (non-fatal):', profileError);
              // Continue with default role
            }
            
            // Temporary: Hardcoded admin emails (remove after Supabase setup)
            const ADMIN_EMAILS = [
              'yasalkhan90@gmail.com',
              'admin@mimecode.com',
              // Add more admin emails here
            ];
            
            // Check if email is in admin list (fallback if Supabase not setup)
            const isHardcodedAdmin = firebaseUser.email && ADMIN_EMAILS.includes(firebaseUser.email.toLowerCase());
            
            if (userProfile) {
              const userWithRole: UserWithRole = {
                ...firebaseUser,
                role: userProfile.role || (isHardcodedAdmin ? 'admin' : 'user'),
                displayName: userProfile.display_name || firebaseUser.displayName,
              };
              setUser(userWithRole);
            } else {
              // User profile doesn't exist yet - use hardcoded check or default to 'user'
              const userWithRole: UserWithRole = {
                ...firebaseUser,
                role: isHardcodedAdmin ? 'admin' : 'user',
              };
              setUser(userWithRole);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('Error in auth state change:', err);
          // On error, still set user but with default role if Firebase user exists
          if (firebaseUser) {
            const userWithRole: UserWithRole = {
              ...firebaseUser,
              role: 'user',
            };
            setUser(userWithRole);
          } else {
            setUser(null);
          }
        } finally {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      },
      (authError) => {
        console.error('Firebase auth error:', authError);
        setError(authError.message);
        setLoading(false);
        clearTimeout(loadingTimeout);
      }
    );

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  return { user, loading, error };
}

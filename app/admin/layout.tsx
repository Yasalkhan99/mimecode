'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoadingLocal, setAuthLoadingLocal] = useState(false);
  const [authErrorLocal, setAuthErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    // Avoid redirecting to login if we're already on the login page
    if (!loading && !user) {
      if (!pathname || pathname === '/admin/login') return;
      router.push('/admin/login');
    }
  }, [user, loading, router, pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/admin/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  if (!user) {
    // If there's no authenticated user, allow the login page to render.
    if (pathname === '/admin/login' || pathname === '/admin') {
      return <>{children}</>;
    }

    // Otherwise show a clear Sign In CTA with inline email/password form
    const handleLocalSignIn = async (e?: React.FormEvent) => {
      e?.preventDefault();
      setAuthErrorLocal(null);
      setAuthLoadingLocal(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/admin/dashboard');
      } catch (err: unknown) {
        const e = err as { message?: string };
        setAuthErrorLocal(e?.message || 'Sign in failed');
      } finally {
        setAuthLoadingLocal(false);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
          <h2 className="text-2xl font-bold mb-3">Admin Access Required</h2>
          <p className="text-gray-600 mb-4">Sign in with your admin email and password to continue.</p>

          {authErrorLocal && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{authErrorLocal}</div>
          )}

          <form onSubmit={handleLocalSignIn} className="space-y-3">
            <input
              id="admin-email"
              name="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@domain.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              id="admin-password"
              name="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={authLoadingLocal}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {authLoadingLocal ? 'Signing in...' : 'Sign in'}
              </button>
              <Link href="/admin/login" className="flex-1 inline-flex items-center justify-center border border-gray-300 px-4 py-2 rounded-lg">
                Advanced Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="mt-6">
          <Link
            href="/admin/dashboard"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/coupons"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Manage Coupons
          </Link>
          <Link
            href="/admin/banners"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Manage Banners
          </Link>
          <Link
            href="/admin/stores"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Manage Stores
          </Link>
          <Link
            href="/admin/logos"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Manage Logos
          </Link>
          <Link
            href="/admin/news"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Manage News & Articles
          </Link>
          <Link
            href="/admin/analytics"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Analytics
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-6 py-3 hover:bg-red-600 transition mt-auto"
          >
            Logout
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-gray-800">Welcome, {user.email}</h2>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

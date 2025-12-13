import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const languageSlugs = ['en', 'es', 'fr', 'du', 'it', 'pt', 'nl', 'ru', 'zh', 'ja'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathSegments = pathname.split('/').filter(Boolean);
  const firstSegment = pathSegments[0];

  // Skip middleware for API routes, static files, and admin routes
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/dashboard') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Check if first segment is a language code
  const isLanguage = languageSlugs.includes(firstSegment);

  // If it's a language code, allow it to proceed to [lang] routes
  // This handles both /es and /es/stores, /es/stores/slug, etc.
  if (isLanguage) {
    return NextResponse.next();
  }

  // For non-language paths, allow them to proceed normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};


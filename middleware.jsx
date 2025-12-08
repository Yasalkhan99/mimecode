import { NextResponse } from 'next/server';

export async function middleware(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.ip ||
      "";

    const officeIp = "103.217.176.115"; // <-- Replace with your office IP

    // Skip office IP
    if (ip === officeIp) {
      return NextResponse.next();
    }

    // Lookup country from GeoIP API
    const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
      cache: "no-store",
    });
    const geoData = await geoRes.json();

    if (geoData.country_code === "PK") {
      // Redirect to /blocked
      return NextResponse.redirect(new URL("/blocked", req.url));
    }

    return NextResponse.next();

  } catch (error) {
    // Fail-safe: allow access if lookup fails
    return NextResponse.next();
  }
}

export const config = {
  matcher: "/:path*",
};

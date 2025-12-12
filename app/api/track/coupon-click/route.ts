// API endpoint to track coupon/deal clicks
// Logs: coupon info, IP address, location, device info

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Get device type from user agent
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    return 'mobile';
  }
  return 'desktop';
}

// Get browser from user agent
function getBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('edg')) return 'Edge';
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('opera') || ua.includes('opr')) return 'Opera';
  return 'Unknown';
}

// Get OS from user agent
function getOS(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'macOS';
  if (ua.includes('linux')) return 'Linux';
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
  return 'Unknown';
}

// Get location from IP using free API
async function getLocationFromIP(ip: string): Promise<{
  country: string;
  countryCode: string;
  region: string;
  city: string;
  timezone: string;
}> {
  try {
    // Skip for localhost/private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local',
        countryCode: 'LO',
        region: 'Local',
        city: 'Localhost',
        timezone: 'UTC'
      };
    }

    // Use ip-api.com (free, no API key needed, 45 requests/minute)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,timezone`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country || 'Unknown',
          countryCode: data.countryCode || 'XX',
          region: data.regionName || 'Unknown',
          city: data.city || 'Unknown',
          timezone: data.timezone || 'UTC'
        };
      }
    }
  } catch (error) {
    console.error('Error getting location from IP:', error);
  }

  return {
    country: 'Unknown',
    countryCode: 'XX',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC'
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { couponId, couponCode, couponType, storeName, storeId, pageUrl, referrer } = body;

    // Get IP address from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'Unknown';

    // Get user agent
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // Get device info
    const deviceType = getDeviceType(userAgent);
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);

    // Get location from IP (async)
    const location = await getLocationFromIP(ip);

    // Prepare click data
    const clickData = {
      coupon_id: couponId || null,
      coupon_code: couponCode || null,
      coupon_type: couponType || 'deal',
      store_name: storeName || null,
      store_id: storeId || null,
      ip_address: ip,
      country: location.country,
      country_code: location.countryCode,
      region: location.region,
      city: location.city,
      timezone: location.timezone,
      user_agent: userAgent.substring(0, 500), // Limit length
      device_type: deviceType,
      browser: browser,
      os: os,
      referrer: referrer || null,
      page_url: pageUrl || null,
      clicked_at: new Date().toISOString(),
    };

    // Save to Supabase
    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('coupon_clicks')
        .insert(clickData);

      if (error) {
        console.error('Error saving click:', error);
        // Don't fail the request - tracking shouldn't block user
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track coupon click error:', error);
    // Return success anyway - don't let tracking errors affect user experience
    return NextResponse.json({ success: true });
  }
}


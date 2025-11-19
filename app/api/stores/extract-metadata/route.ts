export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize URL - add https:// if not present
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    // Fetch the HTML content
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch URL: ${response.statusText}` }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract metadata using regex patterns
    const extractMetaTag = (pattern: RegExp): string | null => {
      const match = html.match(pattern);
      return match ? match[1].trim() : null;
    };

    // Extract Open Graph tags (preferred)
    const ogTitle = extractMetaTag(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
                   extractMetaTag(/<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i);
    
    const ogDescription = extractMetaTag(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i) ||
                          extractMetaTag(/<meta\s+content=["']([^"']+)["']\s+property=["']og:description["']/i);
    
    const ogImage = extractMetaTag(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                   extractMetaTag(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
    
    const ogSiteName = extractMetaTag(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i) ||
                       extractMetaTag(/<meta\s+content=["']([^"']+)["']\s+property=["']og:site_name["']/i);

    // Extract standard meta tags (fallback)
    const metaTitle = extractMetaTag(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDescription = extractMetaTag(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                           extractMetaTag(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);

    // Extract favicon/logo
    const favicon = extractMetaTag(/<link[^>]+rel=["'](?:shortcut\s+)?icon["'][^>]+href=["']([^"']+)["']/i) ||
                  extractMetaTag(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut\s+)?icon["']/i);

    // Extract apple-touch-icon as logo alternative
    const appleIcon = extractMetaTag(/<link[^>]+rel=["']apple-touch-icon["'][^>]+href=["']([^"']+)["']/i) ||
                     extractMetaTag(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']apple-touch-icon["']/i);

    // Try to find logo in common locations
    const logoFromMeta = ogImage || appleIcon || favicon;

    // Make relative URLs absolute
    const makeAbsoluteUrl = (urlPath: string | null): string | null => {
      if (!urlPath) return null;
      if (urlPath.startsWith('http://') || urlPath.startsWith('https://')) {
        return urlPath;
      }
      try {
        const baseUrl = new URL(normalizedUrl);
        if (urlPath.startsWith('//')) {
          return baseUrl.protocol + urlPath;
        }
        if (urlPath.startsWith('/')) {
          return `${baseUrl.protocol}//${baseUrl.host}${urlPath}`;
        }
        return `${baseUrl.protocol}//${baseUrl.host}/${urlPath}`;
      } catch {
        return urlPath;
      }
    };

    // Extract domain name as fallback for store name
    let domainName: string | null = null;
    try {
      const urlObj = new URL(normalizedUrl);
      domainName = urlObj.hostname.replace('www.', '').split('.')[0];
      // Capitalize first letter
      domainName = domainName.charAt(0).toUpperCase() + domainName.slice(1);
    } catch {}

    // Build result
    const result = {
      success: true,
      name: ogTitle || metaTitle || ogSiteName || domainName || 'Unknown Store',
      description: ogDescription || metaDescription || '',
      logoUrl: makeAbsoluteUrl(logoFromMeta),
      // Try to extract tags/keywords
      tags: extractMetaTag(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i) ||
            extractMetaTag(/<meta\s+content=["']([^"']+)["']\s+name=["']keywords["']/i) ||
            null,
      siteUrl: normalizedUrl,
    };

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting metadata:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract metadata' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


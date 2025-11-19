export async function POST(req: Request) {
  try {
    const { categoryName } = await req.json();

    if (!categoryName) {
      return new Response(
        JSON.stringify({ success: false, error: 'Category name is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize category name (lowercase, remove spaces, special chars)
    const normalizedName = categoryName.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
    console.log('Extracting logo for category:', categoryName, 'normalized:', normalizedName);
    
    // Category name to icon mapping (common category icons)
    const categoryIconMap: Record<string, string[]> = {
      'food': ['food', 'restaurant', 'dining', 'meal', 'fork', 'utensils'],
      'fashion': ['fashion', 'clothing', 'apparel', 'shirt', 'dress'],
      'electronics': ['electronics', 'laptop', 'computer', 'device', 'tech'],
      'pets': ['pets', 'dog', 'cat', 'animal', 'paw'],
      'automotive': ['automotive', 'car', 'vehicle', 'auto'],
      'home': ['home', 'house', 'furniture', 'interior'],
      'garden': ['garden', 'plant', 'flower', 'tree'],
      'beauty': ['beauty', 'cosmetics', 'makeup', 'spa'],
      'health': ['health', 'medical', 'fitness', 'gym'],
      'travel': ['travel', 'airplane', 'hotel', 'vacation'],
      'sports': ['sports', 'football', 'basketball', 'fitness'],
      'books': ['books', 'book', 'library', 'reading'],
      'toys': ['toys', 'toy', 'game', 'play'],
      'jewelry': ['jewelry', 'ring', 'necklace', 'diamond'],
      'shoes': ['shoes', 'footwear', 'sneaker', 'boot'],
      'accessories': ['accessories', 'bag', 'watch', 'sunglasses'],
      'restaurants': ['restaurant', 'dining', 'food', 'cafe'],
      'groceries': ['groceries', 'grocery', 'supermarket', 'shopping'],
      'pharmacy': ['pharmacy', 'medicine', 'drug', 'health'],
      'baby': ['baby', 'infant', 'toddler', 'child'],
      'music': ['music', 'audio', 'headphones', 'speaker'],
      'movies': ['movies', 'film', 'cinema', 'entertainment'],
    };
    
    // Find matching category icon names
    const findCategoryIcons = (name: string): string[] => {
      const lowerName = name.toLowerCase();
      for (const [key, icons] of Object.entries(categoryIconMap)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
          return icons;
        }
      }
      // Try partial matches
      for (const [key, icons] of Object.entries(categoryIconMap)) {
        if (lowerName.startsWith(key) || key.startsWith(lowerName)) {
          return icons;
        }
      }
      return [normalizedName];
    };
    
    const iconNames = findCategoryIcons(categoryName);
    console.log('Found icon names for category:', iconNames);
    
    // Helper function to check if URL returns a valid image
    const checkImageUrl = async (url: string): Promise<boolean> => {
      try {
        const response = await fetch(url, { 
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          // Simple Icons returns SVG, check for image or svg content type
          if (contentType.includes('image') || contentType.includes('svg') || contentType.includes('xml')) {
            return true;
          }
          // Also check if URL ends with .svg - try to read first few bytes
          if (url.includes('.svg') || url.includes('simpleicons') || url.includes('iconify')) {
            // Clone response to read without consuming
            const clonedResponse = response.clone();
            const text = await clonedResponse.text();
            if (text.trim().startsWith('<svg') || text.trim().startsWith('<?xml') || text.includes('<svg')) {
              return true;
            }
          }
        }
      } catch (error) {
        console.error(`Error checking URL ${url}:`, error);
      }
      return false;
    };
    
    // Try all icon names from category mapping
    for (const iconName of iconNames) {
      // Try Simple Icons API first
      const simpleIconsUrls = [
        `https://cdn.simpleicons.org/${iconName}/000000`, // Black
        `https://cdn.simpleicons.org/${iconName}`, // Default
      ];
      
      for (const simpleIconsUrl of simpleIconsUrls) {
        try {
          const isValid = await checkImageUrl(simpleIconsUrl);
          if (isValid) {
            console.log('Found icon in Simple Icons:', simpleIconsUrl);
            return new Response(
              JSON.stringify({ 
                success: true, 
                logoUrl: simpleIconsUrl,
                source: 'simpleicons'
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } catch (error) {
          console.error('Error checking Simple Icons:', error);
        }
      }
    }

    // Fallback: Try Iconify API with category icon names
    const iconifyIconSets = ['mdi', 'material-symbols', 'heroicons', 'lucide', 'carbon', 'fa6-solid'];
    
    for (const iconName of iconNames) {
      for (const iconSet of iconifyIconSets) {
        const iconifyUrl = `https://api.iconify.design/${iconSet}:${iconName}.svg?color=%23000000`;
        try {
          const isValid = await checkImageUrl(iconifyUrl);
          if (isValid) {
            console.log('Found icon in Iconify:', iconifyUrl);
            return new Response(
              JSON.stringify({ 
                success: true, 
                logoUrl: iconifyUrl,
                source: 'iconify'
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } catch (error) {
          // Continue to next icon set
        }
      }
      
      // Also try without icon set prefix
      const iconifyUrl = `https://api.iconify.design/${iconName}.svg?color=%23000000`;
      try {
        const isValid = await checkImageUrl(iconifyUrl);
        if (isValid) {
          console.log('Found icon in Iconify (no prefix):', iconifyUrl);
          return new Response(
            JSON.stringify({ 
              success: true, 
              logoUrl: iconifyUrl,
              source: 'iconify'
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (error) {
        // Continue
      }
    }

    // Try additional variations with all icon names
    const variations = [
      ...iconNames,
      normalizedName,
      normalizedName + 'icon',
      normalizedName + 'logo',
      categoryName.toLowerCase().replace(/\s+/g, ''),
      categoryName.toLowerCase().replace(/\s+/g, '-'),
    ];

    for (const variation of variations) {
      const altUrls = [
        `https://cdn.simpleicons.org/${variation}/000000`,
        `https://cdn.simpleicons.org/${variation}`,
      ];
      
      for (const altUrl of altUrls) {
        try {
          const isValid = await checkImageUrl(altUrl);
          if (isValid) {
            console.log('Found icon in variations:', altUrl);
            return new Response(
              JSON.stringify({ 
                success: true, 
                logoUrl: altUrl,
                source: 'simpleicons'
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } catch (error) {
          // Continue to next variation
        }
      }
    }

    // If no icon found, generate a simple SVG icon with the first letter
    // Design: Light gray inner circle + dark letter (outer circle is provided by container backgroundColor)
    const firstLetter = categoryName.charAt(0).toUpperCase();
    // URL encode the SVG to avoid base64 issues
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
      <!-- Inner light gray circle -->
      <circle cx="50" cy="50" r="38" fill="#E5E7EB"/>
      <!-- Dark gray letter -->
      <text x="50" y="50" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#374151" text-anchor="middle" dominant-baseline="central">${firstLetter}</text>
    </svg>`;
    const svgIcon = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        logoUrl: svgIcon,
        source: 'generated'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error extracting category logo:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to extract logo' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}


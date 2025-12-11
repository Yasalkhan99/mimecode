import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { supabaseAdmin } from '@/lib/supabase';

// Extract domain from URL
const extractDomain = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null;
  
  try {
    let cleanUrl = url.trim();
    cleanUrl = cleanUrl.replace(/^https?:\/\//i, '');
    cleanUrl = cleanUrl.replace(/^www\./i, '');
    cleanUrl = cleanUrl.split('/')[0];
    cleanUrl = cleanUrl.split(':')[0];
    return cleanUrl || null;
  } catch (error) {
    return null;
  }
};

// Get region from domain/TLD - Enhanced version
const getRegionFromDomain = (domain: string | null): string | null => {
  if (!domain) return null;
  
  const domainLower = domain.toLowerCase();
  
  // Comprehensive TLD to Region mapping
  const tldToRegion: { [key: string]: string } = {
    // Multi-part TLDs (longest first)
    '.co.uk': 'UK',
    '.com.uk': 'UK',
    '.org.uk': 'UK',
    '.net.uk': 'UK',
    '.com.au': 'Australia',
    '.co.in': 'India',
    '.com.in': 'India',
    '.net.in': 'India',
    '.org.in': 'India',
    '.co.za': 'South Africa',
    '.com.br': 'Brazil',
    '.com.mx': 'Mexico',
    '.co.jp': 'Japan',
    '.com.cn': 'China',
    '.com.sg': 'Singapore',
    '.com.my': 'Malaysia',
    '.co.id': 'Indonesia',
    '.com.ph': 'Philippines',
    '.com.vn': 'Vietnam',
    '.com.tr': 'Turkey',
    '.com.ar': 'Argentina',
    '.com.ng': 'Nigeria',
    '.co.ke': 'Kenya',
    '.com.sa': 'Saudi Arabia',
    '.com.ae': 'UAE',
    '.com.nz': 'New Zealand',
    '.com.pl': 'Poland',
    '.com.de': 'Germany',
    '.com.it': 'Italy',
    '.com.es': 'Spain',
    '.com.fr': 'France',
    '.com.nl': 'Netherlands',
    '.com.at': 'Austria',
    '.com.th': 'Thailand',
    '.com.ca': 'Canada',
    '.com.hk': 'Hong Kong',
    '.com.tw': 'Taiwan',
    '.com.kr': 'South Korea',
    '.com.co': 'Colombia',
    '.com.pe': 'Peru',
    '.com.cl': 'Chile',
    '.com.eg': 'Egypt',
    '.com.gr': 'Greece',
    '.com.pt': 'Portugal',
    '.com.be': 'Belgium',
    '.com.ch': 'Switzerland',
    '.com.se': 'Sweden',
    '.com.no': 'Norway',
    '.com.dk': 'Denmark',
    '.com.fi': 'Finland',
    '.com.ie': 'Ireland',
    '.com.ru': 'Russia',
    '.com.il': 'Israel',
    // Single-part TLDs
    '.uk': 'UK',
    '.ca': 'Canada',
    '.de': 'Germany',
    '.pl': 'Poland',
    '.in': 'India',
    '.it': 'Italy',
    '.es': 'Spain',
    '.au': 'Australia',
    '.at': 'Austria',
    '.nl': 'Netherlands',
    '.th': 'Thailand',
    '.sa': 'Saudi Arabia',
    '.fr': 'France',
    '.nz': 'New Zealand',
    '.ae': 'UAE',
    '.jp': 'Japan',
    '.cn': 'China',
    '.sg': 'Singapore',
    '.my': 'Malaysia',
    '.id': 'Indonesia',
    '.ph': 'Philippines',
    '.vn': 'Vietnam',
    '.tr': 'Turkey',
    '.ar': 'Argentina',
    '.ng': 'Nigeria',
    '.ke': 'Kenya',
    '.za': 'South Africa',
    '.br': 'Brazil',
    '.mx': 'Mexico',
    '.kr': 'South Korea',
    '.hk': 'Hong Kong',
    '.tw': 'Taiwan',
    '.co': 'Colombia',
    '.pe': 'Peru',
    '.cl': 'Chile',
    '.eg': 'Egypt',
    '.gr': 'Greece',
    '.pt': 'Portugal',
    '.be': 'Belgium',
    '.ch': 'Switzerland',
    '.se': 'Sweden',
    '.no': 'Norway',
    '.dk': 'Denmark',
    '.fi': 'Finland',
    '.ie': 'Ireland',
    '.ru': 'Russia',
    '.il': 'Israel',
    '.us': 'USA',
    '.com': 'USA', // Default .com to USA
  };
  
  // Check for TLD matches (longest first)
  const sortedTlds = Object.keys(tldToRegion).sort((a, b) => b.length - a.length);
  for (const tld of sortedTlds) {
    if (domainLower.endsWith(tld)) {
      return tldToRegion[tld];
    }
  }
  
  // Check for country-specific patterns in domain
  const countryPatterns: { [key: string]: string } = {
    'uk': 'UK',
    'canada': 'Canada',
    'germany': 'Germany',
    'poland': 'Poland',
    'india': 'India',
    'italy': 'Italy',
    'spain': 'Spain',
    'australia': 'Australia',
    'austria': 'Austria',
    'netherlands': 'Netherlands',
    'holland': 'Netherlands',
    'thailand': 'Thailand',
    'saudi': 'Saudi Arabia',
    'arabia': 'Saudi Arabia',
    'france': 'France',
    'newzealand': 'New Zealand',
    'uae': 'UAE',
    'emirates': 'UAE',
    'colombia': 'Colombia',
    'brazil': 'Brazil',
    'mexico': 'Mexico',
    'japan': 'Japan',
    'china': 'China',
    'singapore': 'Singapore',
    'malaysia': 'Malaysia',
    'indonesia': 'Indonesia',
    'philippines': 'Philippines',
    'vietnam': 'Vietnam',
    'turkey': 'Turkey',
    'southafrica': 'South Africa',
    'argentina': 'Argentina',
    'hongkong': 'Hong Kong',
    'taiwan': 'Taiwan',
    'southkorea': 'South Korea',
    'peru': 'Peru',
    'chile': 'Chile',
    'egypt': 'Egypt',
    'greece': 'Greece',
    'portugal': 'Portugal',
    'belgium': 'Belgium',
    'switzerland': 'Switzerland',
    'sweden': 'Sweden',
    'norway': 'Norway',
    'denmark': 'Denmark',
    'finland': 'Finland',
    'ireland': 'Ireland',
    'russia': 'Russia',
    'israel': 'Israel',
    'usa': 'USA',
    'unitedstates': 'USA',
  };
  
  for (const [pattern, region] of Object.entries(countryPatterns)) {
    if (domainLower.includes(pattern)) {
      return region;
    }
  }
  
  return null;
};

export async function POST(req: NextRequest) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const firestore = getAdminFirestore();
    const regionsCollection = process.env.NEXT_PUBLIC_REGIONS_COLLECTION || 'regions-mimecode';
    
    // Fetch all stores from Supabase
    const { data: stores, error: storesError } = await supabaseAdmin
      .from('stores')
      .select('id, "Store Name", "Tracking Url", "Store Display Url", "Network Id"');
    
    if (storesError) {
      throw new Error(`Failed to fetch stores: ${storesError.message}`);
    }
    
    if (!stores || stores.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No stores found',
        stats: {
          totalStores: 0,
          storesWithRegion: 0,
          storesWithoutRegion: 0,
          newRegionsCreated: 0,
        },
      });
    }
    
    console.log(`📊 Analyzing ${stores.length} stores...`);
    
    // Get existing regions
    const regionsSnapshot = await firestore.collection(regionsCollection).get();
    const existingRegions = new Map<string, any>();
    regionsSnapshot.forEach((doc) => {
      const data = doc.data();
      existingRegions.set(data.name.toLowerCase(), { id: doc.id, ...data });
    });
    
    // Analyze stores and group by region
    const regionToStores = new Map<string, any[]>();
    let storesWithoutRegion = 0;
    
    stores.forEach((store: any) => {
      const url = store['Tracking Url'] || store['Store Display Url'] || '';
      const domain = extractDomain(url);
      const regionName = getRegionFromDomain(domain);
      
      if (regionName) {
        if (!regionToStores.has(regionName)) {
          regionToStores.set(regionName, []);
        }
        regionToStores.get(regionName)!.push(store);
      } else {
        storesWithoutRegion++;
      }
    });
    
    // Create new regions for detected regions that don't exist
    const newRegionsCreated: string[] = [];
    
    for (const [regionName, storesList] of regionToStores.entries()) {
      const regionKey = regionName.toLowerCase();
      
      if (!existingRegions.has(regionKey)) {
        // Create new region
        const networkId = regionName.toLowerCase().replace(/\s+/g, '-');
        const regionData = {
          name: regionName,
          networkId: networkId,
          description: `Auto-created region for ${storesList.length} stores`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const docRef = await firestore.collection(regionsCollection).add(regionData);
        newRegionsCreated.push(regionName);
        existingRegions.set(regionKey, { id: docRef.id, ...regionData });
        
        console.log(`✅ Created new region: ${regionName} (${storesList.length} stores)`);
      }
    }
    
    // Statistics
    const stats = {
      totalStores: stores.length,
      storesWithRegion: stores.length - storesWithoutRegion,
      storesWithoutRegion: storesWithoutRegion,
      totalRegions: regionToStores.size,
      newRegionsCreated: newRegionsCreated.length,
      regionsBreakdown: Array.from(regionToStores.entries()).map(([name, storesList]) => ({
        region: name,
        storeCount: storesList.length,
      })),
    };
    
    return NextResponse.json({
      success: true,
      message: `Analyzed ${stores.length} stores. Created ${newRegionsCreated.length} new regions.`,
      stats,
      newRegions: newRegionsCreated,
    });
  } catch (error: any) {
    console.error('Error analyzing stores:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze stores',
      },
      { status: 500 }
    );
  }
}


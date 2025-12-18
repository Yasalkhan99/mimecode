'use client';

import { useState, useEffect } from 'react';
import { getActiveRegions, Region } from '@/lib/services/regionService';
import { getStores, Store } from '@/lib/services/storeService';
import { useTranslation } from '@/lib/hooks/useTranslation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Country/Region to Flag Emoji mapping
const regionFlags: { [key: string]: string } = {
  'UK': '🇬🇧',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Germany': '🇩🇪',
  'Poland': '🇵🇱',
  'India': '🇮🇳',
  'Europe': '🇪🇺',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Australia': '🇦🇺',
  'Austria': '🇦🇹',
  'Netherlands': '🇳🇱',
  'Thailand': '🇹🇭',
  'Arabia': '🇸🇦',
  'Saudi Arabia': '🇸🇦',
  'France': '🇫🇷',
  'New Zealand': '🇳🇿',
  'UAE': '🇦🇪',
  'United Arab Emirates': '🇦🇪',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Japan': '🇯🇵',
  'China': '🇨🇳',
  'Brazil': '🇧🇷',
  'Mexico': '🇲🇽',
  'South Korea': '🇰🇷',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'Turkey': '🇹🇷',
  'South Africa': '🇿🇦',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪',
  'Greece': '🇬🇷',
  'Portugal': '🇵🇹',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Ireland': '🇮🇪',
  'Russia': '🇷🇺',
  'Israel': '🇮🇱',
};

// Extract domain from URL
const extractDomain = (url: string | null | undefined): string | null => {
  if (!url || !url.trim()) return null;
  
  try {
    let cleanUrl = url.trim();
    // Remove protocol
    cleanUrl = cleanUrl.replace(/^https?:\/\//i, '');
    // Remove www.
    cleanUrl = cleanUrl.replace(/^www\./i, '');
    // Get domain part only (before first /)
    cleanUrl = cleanUrl.split('/')[0];
    // Remove port if present
    cleanUrl = cleanUrl.split(':')[0];
    return cleanUrl || null;
  } catch (error) {
    console.error('Error extracting domain from URL:', url, error);
    return null;
  }
};

// Get region from domain/TLD
const getRegionFromDomain = (domain: string | null): string | null => {
  if (!domain) return null;
  
  const domainLower = domain.toLowerCase();
  
  // Comprehensive TLD to Region mapping (sorted by length for accurate matching - longest first)
  const tldToRegion: { [key: string]: string } = {
    // Multi-part TLDs first (longest)
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
  
  // Check for TLD matches (longest first for accuracy)
  const sortedTlds = Object.keys(tldToRegion).sort((a, b) => b.length - a.length);
  for (const tld of sortedTlds) {
    if (domainLower.endsWith(tld)) {
      return tldToRegion[tld];
    }
  }
  
  // Check for country-specific subdomains or paths in domain
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
  
  // Check if domain contains country pattern
  for (const [pattern, region] of Object.entries(countryPatterns)) {
    if (domainLower.includes(pattern)) {
      return region;
    }
  }
  
  return null;
};

// Country code to flag emoji mapping (for 2-letter codes like DE, AU, GB)
// IMPORTANT: These are Unicode flag emojis, not text
const countryCodeToFlag: { [key: string]: string } = {
  'DE': '🇩🇪', // Germany
  'AU': '🇦🇺', // Australia
  'GB': '🇬🇧', // UK
  'UK': '🇬🇧', // UK
  'CO': '🇨🇴', // Colombia
  'IT': '🇮🇹', // Italy
  'AE': '🇦🇪', // UAE
  'CA': '🇨🇦', // Canada
  'NZ': '🇳🇿', // New Zealand
  'FR': '🇫🇷', // France
  'NL': '🇳🇱', // Netherlands
  'BR': '🇧🇷', // Brazil
  'IN': '🇮🇳', // India
  'ES': '🇪🇸', // Spain
  'AT': '🇦🇹', // Austria
  'TH': '🇹🇭', // Thailand
  'SA': '🇸🇦', // Saudi Arabia
  'PL': '🇵🇱', // Poland
  'US': '🇺🇸', // USA
  'JP': '🇯🇵', // Japan
  'CN': '🇨🇳', // China
  'MX': '🇲🇽', // Mexico
  'KR': '🇰🇷', // South Korea
  'SG': '🇸🇬', // Singapore
  'MY': '🇲🇾', // Malaysia
  'ID': '🇮🇩', // Indonesia
  'PH': '🇵🇭', // Philippines
  'VN': '🇻🇳', // Vietnam
  'TR': '🇹🇷', // Turkey
  'ZA': '🇿🇦', // South Africa
  'AR': '🇦🇷', // Argentina
  'CL': '🇨🇱', // Chile
  'PE': '🇵🇪', // Peru
  'EG': '🇪🇬', // Egypt
  'NG': '🇳🇬', // Nigeria
  'KE': '🇰🇪', // Kenya
  'GR': '🇬🇷', // Greece
  'PT': '🇵🇹', // Portugal
  'BE': '🇧🇪', // Belgium
  'CH': '🇨🇭', // Switzerland
  'SE': '🇸🇪', // Sweden
  'NO': '🇳🇴', // Norway
  'DK': '🇩🇰', // Denmark
  'FI': '🇫🇮', // Finland
  'IE': '🇮🇪', // Ireland
  'RU': '🇷🇺', // Russia
  'IL': '🇮🇱', // Israel
};

// Get country code from region name
const getCountryCode = (regionName: string): string => {
  if (!regionName) return 'XX';
  
  const trimmedName = regionName.trim();
  const upperName = trimmedName.toUpperCase();
  const lowerName = trimmedName.toLowerCase();
  
  // Map region names to country codes (check this first for special cases like UK)
  const nameToCode: { [key: string]: string } = {
    'uk': 'GB',
    'united kingdom': 'GB',
    'great britain': 'GB',
    'canada': 'CA',
    'germany': 'DE',
    'deutschland': 'DE',
    'poland': 'PL',
    'india': 'IN',
    'europe': 'EU',
    'italy': 'IT',
    'spain': 'ES',
    'australia': 'AU',
    'austria': 'AT',
    'netherlands': 'NL',
    'holland': 'NL',
    'thailand': 'TH',
    'saudi arabia': 'SA',
    'saudi': 'SA',
    'arabia': 'SA',
    'france': 'FR',
    'new zealand': 'NZ',
    'uae': 'AE',
    'united arab emirates': 'AE',
    'colombia': 'CO',
    'brazil': 'BR',
    'vietnam': 'VN',
    'usa': 'US',
    'united states': 'US',
    'japan': 'JP',
    'china': 'CN',
    'mexico': 'MX',
    'south korea': 'KR',
    'singapore': 'SG',
    'malaysia': 'MY',
    'indonesia': 'ID',
    'philippines': 'PH',
    'turkey': 'TR',
    'south africa': 'ZA',
    'argentina': 'AR',
  };
  
  // Check name mapping first (handles UK -> GB, etc.)
  if (nameToCode[lowerName]) {
    return nameToCode[lowerName];
  }
  
  // Then check if it's already a 2-letter country code that exists in our mapping
  if (trimmedName.length === 2 && countryCodeToFlag[upperName]) {
    // Special case: UK should map to GB
    if (upperName === 'UK') {
      return 'GB';
    }
    return upperName;
  }
  
  // Try partial match
  for (const [key, code] of Object.entries(nameToCode)) {
    if (lowerName.includes(key) || key.includes(lowerName)) {
      return code;
    }
  }
  
  return 'XX'; // Unknown
};

// Get flag image URL from country code
const getFlagImageUrl = (countryCode: string): string => {
  // Using flagcdn.com API - free and reliable
  if (countryCode === 'EU') {
    return 'https://flagcdn.com/w160/eu.png';
  }
  if (countryCode === 'XX') {
    return 'https://flagcdn.com/w160/un.png'; // UN flag as fallback
  }
  return `https://flagcdn.com/w160/${countryCode.toLowerCase()}.png`;
};

export default function RegionSpecificOffers() {
  const { t } = useTranslation();
  const [regions, setRegions] = useState<Region[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoresModal, setShowStoresModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsData, storesData] = await Promise.all([
          getActiveRegions(),
          getStores()
        ]);
        
        // console.log('📊 Total stores fetched:', storesData.length);
        // console.log('📊 Regions from DB:', regionsData.map(r => r.name));
        
        setAllStores(storesData);
        
        // Group stores by region based on their website URLs
        const regionToStores = new Map<string, Store[]>();
        let storesWithoutRegion = 0;
        
        storesData.forEach(store => {
          const url = store.websiteUrl || '';
          const domain = extractDomain(url);
          const regionName = getRegionFromDomain(domain);
          
          if (regionName) {
            if (!regionToStores.has(regionName)) {
              regionToStores.set(regionName, []);
            }
            regionToStores.get(regionName)!.push(store);
          } else {
            storesWithoutRegion++;
            // Debug: log first few stores without region
            // if (storesWithoutRegion <= 5) {
            //   console.log('⚠️ Store without region:', store.name, 'URL:', url, 'Domain:', domain);
            // }
          }
        });
        
        // console.log('📊 Stores grouped by region:', Array.from(regionToStores.entries()).map(([name, stores]) => `${name}: ${stores.length}`));
        // console.log('📊 Stores without region:', storesWithoutRegion);
        
        // Create regions from detected regions in stores
        const detectedRegions: Region[] = [];
        
        regionToStores.forEach((stores, regionName) => {
          // Check if this region already exists in regions collection
          const existingRegion = regionsData.find(r => 
            r.name.toLowerCase() === regionName.toLowerCase()
          );
          
          if (existingRegion) {
            detectedRegions.push(existingRegion);
          } else {
            // Create a temporary region for detected region
            detectedRegions.push({
              id: `detected-${regionName.toLowerCase().replace(/\s+/g, '-')}`,
              name: regionName,
              networkId: regionName.toLowerCase().replace(/\s+/g, '-'),
              isActive: true,
            });
          }
        });
        
        // Also add regions from collection that might not have stores yet
        regionsData.forEach(region => {
          const exists = detectedRegions.find(r => 
            r.name.toLowerCase() === region.name.toLowerCase()
          );
          if (!exists) {
            detectedRegions.push(region);
          }
        });
        
        // Sort regions by store count (descending) and filter out regions with 0 stores
        const regionsWithStores = detectedRegions.filter(region => {
          const storesCount = regionToStores.get(region.name)?.length || 0;
          return storesCount > 0;
        });
        
        regionsWithStores.sort((a, b) => {
          const aStores = regionToStores.get(a.name)?.length || 0;
          const bStores = regionToStores.get(b.name)?.length || 0;
          return bStores - aStores;
        });
        
        // console.log('📊 Final regions to display:', regionsWithStores.map(r => ({
        //   name: r.name,
        //   countryCode: getCountryCode(r.name),
        //   stores: regionToStores.get(r.name)?.length || 0
        // })));
        
        setRegions(regionsWithStores);
      } catch (error) {
        console.error('Error fetching regions and stores:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRegionClick = (region: Region) => {
    setSelectedRegion(region);
    
    // Filter stores by region name based on their website URLs
    const storesForRegion = allStores.filter(store => {
      const domain = extractDomain(store.websiteUrl);
      const detectedRegion = getRegionFromDomain(domain);
      return detectedRegion === region.name;
    });
    
    setFilteredStores(storesForRegion);
    setShowStoresModal(true);
  };

  const closeModal = () => {
    setShowStoresModal(false);
    setSelectedRegion(null);
    setFilteredStores([]);
  };

  if (loading) {
    return (
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              {t('region')} <span className="text-orange-500">{t('specificOffers')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-lg p-2 h-16 animate-pulse"></div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (regions.length === 0) {
    return null; // Don't show section if no regions
  }

  return (
    <>
      <section className="py-8 md:py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - SVG */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-4 md:mb-6 flex justify-center"
          >
            <img
              src="/Group 1171275088.svg"
              alt={t('regionSpecificOffers')}
              className="h-16 sm:h-20 md:h-24 lg:h-28 w-auto"
            />
          </motion.div>

          {/* Regions Grid - Equal rows (6 per row) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
            {(() => {
              // Filter regions with stores first
              const regionsWithStores = regions.filter(region => {
                const storesCount = allStores.filter(store => {
                  const domain = extractDomain(store.websiteUrl);
                  const detectedRegion = getRegionFromDomain(domain);
                  return detectedRegion === region.name;
                }).length;
                return storesCount > 0;
              });
              
              // Limit to 12 items (2 equal rows of 6)
              const displayRegions = regionsWithStores.slice(0, 12);
              
              return displayRegions.map((region, index) => {
                const countryCode = getCountryCode(region.name);
                const flagUrl = getFlagImageUrl(countryCode);
                // Get emoji flag as fallback - check multiple variations
                const regionNameUpper = region.name.toUpperCase();
                const regionNameLower = region.name.toLowerCase();
                const emojiFlag = regionFlags[region.name] 
                  || regionFlags[regionNameUpper] 
                  || regionFlags[regionNameLower]
                  || countryCodeToFlag[countryCode] 
                  || countryCodeToFlag[countryCode.toUpperCase()]
                  || '🌍';

                return (
                  <motion.button
                    key={region.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.03 }}
                    onClick={() => handleRegionClick(region)}
                    className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 hover:border-orange-500 hover:shadow-md transition-all duration-300 text-center group cursor-pointer flex flex-col items-center justify-center"
                  >
                    {/* Flag Display - Compact */}
                    <div className="mb-1.5 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                      <div 
                        className="relative w-10 h-7 sm:w-12 sm:h-8 flex items-center justify-center"
                        role="img"
                        aria-label={`${region.name} flag`}
                      >
                        {countryCode === 'XX' || !flagUrl || flagUrl.includes('un.png') ? (
                          // Use emoji flag directly if country code is unknown or UN flag
                          <span className="text-2xl sm:text-3xl">{emojiFlag}</span>
                        ) : (
                        <img
                          src={flagUrl}
                          alt={`${region.name} flag`}
                          className="w-full h-full object-cover rounded-sm shadow-sm"
                          onError={(e) => {
                              // Fallback to emoji flag if image fails to load
                            const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<span class="text-2xl sm:text-3xl">${emojiFlag}</span>`;
                              }
                          }}
                        />
                        )}
                      </div>
                    </div>
                    {/* Country Name - Compact */}
                    <h3 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight line-clamp-1">
                      {region.name}
                    </h3>
                  </motion.button>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* Stores Modal */}
      <AnimatePresence>
        {showStoresModal && selectedRegion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-black text-white p-6 flex items-center justify-between border-b-4 border-[#FFE019]">
                  <div className="flex items-center gap-3">
                  <div className="w-12 h-8 flex-shrink-0 flex items-center justify-center">
                    <img
                      src={getFlagImageUrl(getCountryCode(selectedRegion.name))}
                      alt={`${selectedRegion.name} flag`}
                      className="w-full h-full object-cover rounded-sm"
                      onError={(e) => {
                        // Fallback to emoji flag if image fails to load
                        const target = e.target as HTMLImageElement;
                        const parent = target.parentElement;
                        if (parent) {
                          const emojiFlag = regionFlags[selectedRegion.name] || regionFlags[selectedRegion.name.toUpperCase()] || countryCodeToFlag[getCountryCode(selectedRegion.name)] || '🌍';
                          parent.innerHTML = `<span class="text-2xl">${emojiFlag}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#FFE019]">{selectedRegion.name}</h3>
                    <p className="text-sm text-gray-300">
                      {filteredStores.length} {filteredStores.length === 1 ? t('store') : t('stores')} {t('available')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-[#FFE019] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Stores List */}
              <div className="flex-1 overflow-y-auto p-6">
                {filteredStores.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No stores available for this region yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {filteredStores.map((store) => (
                      <Link
                        key={store.id}
                        href={`/stores/${store.slug || store.id}`}
                        onClick={closeModal}
                        className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-[#FFE019] hover:shadow-lg transition-all group"
                      >
                        {store.logoUrl && (
                          <div className="w-16 h-16 mx-auto mb-3 bg-gray-50 rounded-lg p-2 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <img
                              src={store.logoUrl}
                              alt={store.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                        )}
                        <h4 className="text-sm font-semibold text-gray-900 text-center line-clamp-2 group-hover:text-black">
                          {store.name}
                        </h4>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}


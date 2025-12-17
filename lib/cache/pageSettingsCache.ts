// In-memory cache for page settings
let pageSettingsCache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function getCachedSettings() {
  if (pageSettingsCache && Date.now() - pageSettingsCache.timestamp < CACHE_DURATION) {
    return pageSettingsCache.data;
  }
  return null;
}

export function setCachedSettings(data: any) {
  pageSettingsCache = {
    data,
    timestamp: Date.now(),
  };
}

export function clearCache() {
  pageSettingsCache = null;
}


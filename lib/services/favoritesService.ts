// Favorites/Wishlist service using localStorage
// This stores favorite coupons locally in the browser

export interface FavoriteCoupon {
  couponId: string;
  code: string;
  storeName?: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  description: string;
  logoUrl?: string;
  url?: string;
  addedAt: number; // timestamp
}

const FAVORITES_KEY = 'availcoupon_favorites';

// Get all favorites
export function getFavorites(): FavoriteCoupon[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
}

// Add to favorites
export function addToFavorites(coupon: FavoriteCoupon): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const favorites = getFavorites();
    
    // Check if already exists
    if (favorites.some(f => f.couponId === coupon.couponId)) {
      return false; // Already in favorites
    }
    
    favorites.push({
      ...coupon,
      addedAt: Date.now()
    });
    
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
}

// Remove from favorites
export function removeFromFavorites(couponId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter(f => f.couponId !== couponId);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
}

// Check if coupon is in favorites
export function isFavorite(couponId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const favorites = getFavorites();
  return favorites.some(f => f.couponId === couponId);
}

// Get favorites count
export function getFavoritesCount(): number {
  return getFavorites().length;
}


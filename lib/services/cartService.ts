// Cart service using localStorage
// This stores saved coupons in cart for later use

export interface CartItem {
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

const CART_KEY = 'availcoupon_cart';

// Get all cart items
export function getCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error getting cart items:', error);
    return [];
  }
}

// Add to cart
export function addToCart(coupon: CartItem): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cart = getCartItems();
    
    // Check if already exists
    if (cart.some(item => item.couponId === coupon.couponId)) {
      return false; // Already in cart
    }
    
    cart.push({
      ...coupon,
      addedAt: Date.now()
    });
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
}

// Remove from cart
export function removeFromCart(couponId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  try {
    const cart = getCartItems();
    const filtered = cart.filter(item => item.couponId !== couponId);
    localStorage.setItem(CART_KEY, JSON.stringify(filtered));
    
    window.dispatchEvent(new CustomEvent('cartUpdated'));
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
}

// Clear cart
export function clearCart(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  } catch (error) {
    console.error('Error clearing cart:', error);
  }
}

// Check if coupon is in cart
export function isInCart(couponId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const cart = getCartItems();
  return cart.some(item => item.couponId === couponId);
}

// Get cart count
export function getCartCount(): number {
  return getCartItems().length;
}


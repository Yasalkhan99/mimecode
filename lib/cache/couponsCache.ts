// Shared cache for coupons to allow clearing from multiple API routes
let couponsCache: { data: any[] | null; timestamp: number; key: string } = { data: null, timestamp: 0, key: '' };

export function getCouponsCache() {
  return couponsCache;
}

export function setCouponsCache(data: any[] | null, timestamp: number, key: string) {
  couponsCache = { data, timestamp, key };
}

export function clearCouponsCache() {
  couponsCache = { data: null, timestamp: 0, key: '' };
}


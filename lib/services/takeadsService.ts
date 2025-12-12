// Takeads API Service
// Handles fetching merchants and coupons from Takeads API

const TAKEADS_API_BASE_V1 = 'https://api.takeads.com/v1/product/monetize-api/v1';
const TAKEADS_API_BASE_V2 = 'https://api.takeads.com/v1/product/monetize-api/v2';

export interface TakeadsMerchant {
  merchantId: number | null;
  name: string;
  imageUri: string | null;
  defaultDomain: string;
  description: string;
  categoryId: number[];
  domains: string[];
  currencyCode: string;
  isActive: boolean;
  countryCodes: string[];
  averageBasketValue: number;
  averageCommission: number;
  averageConfirmationTime: number;
  averageCancellationRate: number;
  minimumCommission: number;
  maximumCommission: number;
  commissionRates: any[];
  fixedCommission: number;
  percentageCommission: number;
  adCampaigns: any[];
  trackingLink: string;
  paymentModels: string[];
  createdAt: string;
  updatedAt: string;
  deeplinkAllowed: boolean;
}

export interface TakeadsMerchantResponse {
  meta: {
    next: number | null;
  };
  data: TakeadsMerchant[];
}

export interface TakeadsCoupon {
  couponId: string;
  isActive: boolean;
  trackingLink: string;
  name: string;
  code: string;
  merchantId: number;
  imageUri: string;
  languageCodes: string[];
  startDate: string;
  endDate: string;
  description: string;
  countryCodes: string[];
  categoryIds: number[];
  createdAt: string;
  updatedAt: string;
}

export interface TakeadsCouponResponse {
  meta: {
    next: string | null;
  };
  data: TakeadsCoupon[];
}

/**
 * Fetch merchants from Takeads API
 */
export async function fetchTakeadsMerchants(
  apiKey: string,
  options?: {
    next?: number;
    limit?: number;
    updatedAtFrom?: string;
    isActive?: boolean;
    deeplinkAllowed?: boolean;
  }
): Promise<TakeadsMerchantResponse> {
  const params = new URLSearchParams();
  if (options?.next) params.append('next', String(options.next));
  if (options?.limit) params.append('limit', String(options.limit));
  if (options?.updatedAtFrom) params.append('updatedAtFrom', options.updatedAtFrom);
  if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));
  if (options?.deeplinkAllowed !== undefined) params.append('deeplinkAllowed', String(options.deeplinkAllowed));

  const url = `${TAKEADS_API_BASE_V2}/merchant?${params.toString()}`;
  
  // Ensure API key doesn't already have "Bearer " prefix
  const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '').trim();
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cleanApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Takeads API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch coupons from Takeads API
 */
export async function fetchTakeadsCoupons(
  apiKey: string,
  options?: {
    isActive?: boolean;
    updatedAtFrom?: string;
    updatedAtTo?: string;
    startDateBefore?: string;
    endDateAfter?: string;
    languageCodes?: string[];
    categoryIds?: number[];
    countryCodes?: string[];
    next?: string;
    limit?: number;
  }
): Promise<TakeadsCouponResponse> {
  const params = new URLSearchParams();
  if (options?.isActive !== undefined) params.append('isActive', String(options.isActive));
  if (options?.updatedAtFrom) params.append('updatedAtFrom', options.updatedAtFrom);
  if (options?.updatedAtTo) params.append('updatedAtTo', options.updatedAtTo);
  if (options?.startDateBefore) params.append('startDateBefore', options.startDateBefore);
  if (options?.endDateAfter) params.append('endDateAfter', options.endDateAfter);
  if (options?.languageCodes) {
    options.languageCodes.forEach(code => params.append('languageCodes', code));
  }
  if (options?.categoryIds) {
    options.categoryIds.forEach(id => params.append('categoryIds', String(id)));
  }
  if (options?.countryCodes) {
    options.countryCodes.forEach(code => params.append('countryCodes', code));
  }
  if (options?.next) params.append('next', options.next);
  if (options?.limit) params.append('limit', String(options.limit));

  const url = `${TAKEADS_API_BASE_V1}/coupon?${params.toString()}`;
  
  // Ensure API key doesn't already have "Bearer " prefix
  const cleanApiKey = apiKey.replace(/^Bearer\s+/i, '').trim();
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${cleanApiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Takeads API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}


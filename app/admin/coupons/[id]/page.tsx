'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  getCouponById,
  updateCoupon,
  Coupon,
} from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';
import { getStores, Store } from '@/lib/services/storeService';

export default function EditCouponPage() {
  const params = useParams();
  const router = useRouter();
  const couponId = params.id as string;

  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<Coupon, 'expiryDate'> & { expiryDate: string | Date | null }>>({});
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [manualStoreId, setManualStoreId] = useState<string>('');
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (storeDropdownRef.current && !storeDropdownRef.current.contains(event.target as Node)) {
        setIsStoreDropdownOpen(false);
      }
    };

    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoreDropdownOpen]);

  useEffect(() => {
    const fetchData = async () => {
      const [couponData, categoriesData, storesData] = await Promise.all([
        getCouponById(couponId),
        getCategories(),
        getStores()
      ]);
      if (couponData) {
        setCoupon(couponData);
        // Convert expiryDate to string if it's a Timestamp or Date
        let expiryDateString: string | null = null;
        if (couponData.expiryDate) {
          try {
            if (couponData.expiryDate instanceof Date) {
              expiryDateString = couponData.expiryDate.toISOString();
            } else if (typeof (couponData.expiryDate as any).toDate === 'function') {
              // Firestore Timestamp
              expiryDateString = (couponData.expiryDate as any).toDate().toISOString();
            } else if (typeof couponData.expiryDate === 'string') {
              expiryDateString = couponData.expiryDate;
            }
          } catch (e) {
            console.error('Error converting expiryDate:', e);
          }
        }
        setFormData({
          ...couponData,
          couponType: couponData.couponType || 'code', // Default to 'code' if not set
          expiryDate: expiryDateString,
        });
        setSelectedStoreIds(couponData.storeIds || []);
        if (couponData.logoUrl) {
          setLogoUrl(couponData.logoUrl);
          if (isCloudinaryUrl(couponData.logoUrl)) {
            setExtractedLogoUrl(extractOriginalCloudinaryUrl(couponData.logoUrl));
          }
        }
      }
      setCategories(categoriesData);
      // Sort stores by numeric ID (1, 2, 3...)
      const sortedStores = storesData.sort((a, b) => {
        const idA = parseInt(String(a.id || '0'), 10) || 0;
        const idB = parseInt(String(b.id || '0'), 10) || 0;
        return idA - idB;
      });
      setStores(sortedStores);
      setLoading(false);
    };
    fetchData();
  }, [couponId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate coupon code only if coupon type is 'code'
    if (formData.couponType === 'code' && (!formData.code || formData.code.trim() === '')) {
      alert('Please enter a coupon code (required for code type coupons)');
      return;
    }
    
    setSaving(true);
    
    // Extract original URL if it's a Cloudinary URL
    let logoUrlToSave = logoUrl ? extractOriginalCloudinaryUrl(logoUrl) : undefined;
    
    // If no logo URL is provided, use a default placeholder
    if (!logoUrlToSave || logoUrlToSave.trim() === '') {
      // Default placeholder image
      logoUrlToSave = 'https://www.iconpacks.net/icons/2/free-store-icon-2017-thumb.png';
    }
    
    const updates: any = {
      ...formData,
      discountType: 'percentage', // Always use percentage
      couponType: formData.couponType || 'code',
      logoUrl: logoUrlToSave,
    };
    
    // Explicitly handle expiryDate (include null values)
    updates.expiryDate = formData.expiryDate || null;
    
    // Explicitly ensure url field is included (even if empty/null)
    updates.url = formData.url || null;
    
    console.log('💾 Saving coupon with expiryDate:', updates.expiryDate);
    console.log('🔗 Saving coupon with url:', updates.url);
    
    // For deal type, don't include code field
    if (formData.couponType === 'deal') {
      delete updates.code;
    }
    
    // Only include storeIds if there are selected stores
    if (selectedStoreIds.length > 0) {
      updates.storeIds = selectedStoreIds;
    }
    
    const result = await updateCoupon(couponId, updates);
    if (result.success) {
      // Force refresh by adding cache-busting query param
      router.push('/admin/coupons?refresh=' + Date.now());
      router.refresh(); // Also trigger Next.js router refresh
    }
    setSaving(false);
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedLogoUrl(extracted);
    } else {
      setExtractedLogoUrl(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading coupon...</div>;
  }

  if (!coupon) {
    return <div className="text-center py-12">Coupon not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-semibold"
        >
          ← Back
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Coupon</h1>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Add the same store selection section as in create form */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Add to Stores (Select one or more existing stores)
            </label>
            
            {stores.length > 0 ? (
              <div className="relative" ref={storeDropdownRef}>
                {/* Writable Input with Dropdown */}
                <div className="relative">
                  <input
                    type="text"
                    value={manualStoreId}
                    onChange={(e) => {
                      setManualStoreId(e.target.value);
                      // Open dropdown when user types to show filtered results
                      setIsStoreDropdownOpen(true);
                    }}
                    onFocus={() => setIsStoreDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const storeId = manualStoreId.trim();
                        if (storeId) {
                          // Try to find store by ID (check both string match and numeric match)
                          const foundStore = stores.find(store => {
                            const storeIdNum = parseInt(String(store.id || '0'), 10);
                            const inputIdNum = parseInt(storeId, 10);
                            return store.id === storeId || 
                                   (storeIdNum > 0 && storeIdNum === inputIdNum && inputIdNum <= 100000);
                          });
                          
                          if (foundStore && foundStore.id) {
                            if (!selectedStoreIds.includes(foundStore.id)) {
                              const newSelected = [...selectedStoreIds, foundStore.id];
                              setSelectedStoreIds(newSelected);
                              
                              // Auto-populate storeName and logoUrl
                              const updates: Partial<Coupon> = { storeName: foundStore.name };
                              if (foundStore.logoUrl && foundStore.logoUrl.trim() !== '') {
                                updates.logoUrl = foundStore.logoUrl;
                                setLogoUrl(foundStore.logoUrl);
                                handleLogoUrlChange(foundStore.logoUrl);
                              }
                              setFormData({ ...formData, ...updates } as any);
                              setManualStoreId('');
                              // Keep dropdown open so user can see the selected store
                              setIsStoreDropdownOpen(true);
                            } else {
                              // Store already selected
                              setManualStoreId('');
                              setIsStoreDropdownOpen(true);
                            }
                          } else {
                            alert(`Store with ID "${storeId}" not found. Please check the ID and try again.`);
                          }
                        }
                      } else if (e.key === 'Escape') {
                          setIsStoreDropdownOpen(false);
                          setManualStoreId('');
                        }
                    }}
                    onBlur={(e) => {
                      // Delay to allow click events on dropdown items
                      const currentValue = manualStoreId.trim();
                      setTimeout(() => {
                        if (currentValue) {
                          const foundStore = stores.find(store => {
                            const storeIdNum = parseInt(String(store.id || '0'), 10);
                            const inputIdNum = parseInt(currentValue, 10);
                            return store.id === currentValue || 
                                   (storeIdNum > 0 && storeIdNum === inputIdNum && inputIdNum <= 100000);
                          });
                          
                          if (foundStore && foundStore.id && !selectedStoreIds.includes(foundStore.id)) {
                            const newSelected = [...selectedStoreIds, foundStore.id];
                            setSelectedStoreIds(newSelected);
                            
                            const updates: Partial<Coupon> = { storeName: foundStore.name };
                            if (foundStore.logoUrl && foundStore.logoUrl.trim() !== '') {
                              updates.logoUrl = foundStore.logoUrl;
                              setLogoUrl(foundStore.logoUrl);
                              handleLogoUrlChange(foundStore.logoUrl);
                            }
                            setFormData({ ...formData, ...updates } as any);
                            setManualStoreId('');
                            // Keep dropdown open so user can see the selected store
                            setIsStoreDropdownOpen(true);
                          } else if (foundStore && foundStore.id && selectedStoreIds.includes(foundStore.id)) {
                            // Store already selected
                            setManualStoreId('');
                            setIsStoreDropdownOpen(true);
                          } else {
                            setManualStoreId('');
                            setIsStoreDropdownOpen(false);
                          }
                        } else {
                          setIsStoreDropdownOpen(false);
                        }
                      }, 200);
                    }}
                    placeholder={selectedStoreIds.length > 0 
                      ? `${selectedStoreIds.length} store${selectedStoreIds.length > 1 ? 's' : ''} selected (or type ID)`
                      : 'Select stores... (or type Store ID)'}
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${isStoreDropdownOpen ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isStoreDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <div className="p-2">
                      {stores
                        .filter((store, index) => {
                          // Filter stores based on manualStoreId input
                          if (!manualStoreId.trim()) {
                            return true; // Show all stores if no input
                          }
                          const inputNum = parseInt(manualStoreId.trim(), 10);
                          if (isNaN(inputNum)) {
                            return true; // Show all if not a number
                          }
                          // Match by index (1-based) or by actual store ID
                          const storeIdNum = parseInt(String(store.id || '0'), 10);
                          return (index + 1 === inputNum) || 
                                 (storeIdNum > 0 && storeIdNum === inputNum && inputNum <= 100000);
                        })
                        .map((store) => {
                          // Find original index for display
                          const originalIndex = stores.findIndex(s => s.id === store.id);
                          const isSelected = selectedStoreIds.includes(store.id || '');
                          return (
                            <label
                              key={store.id}
                              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  let newSelected: string[];
                                  if (e.target.checked) {
                                    newSelected = [...selectedStoreIds, store.id!];
                                  } else {
                                    newSelected = selectedStoreIds.filter(id => id !== store.id);
                                  }
                                  setSelectedStoreIds(newSelected);
                                  
                                  // Auto-populate storeName and logoUrl from first selected store
                                  if (newSelected.length > 0) {
                                    const firstStore = stores.find(s => s.id === newSelected[0]);
                                    if (firstStore) {
                                      const updates: Partial<Coupon> = { storeName: firstStore.name };
                                      // Auto-set logo from store if store has a logo
                                      if (firstStore.logoUrl && firstStore.logoUrl.trim() !== '') {
                                        updates.logoUrl = firstStore.logoUrl;
                                        setLogoUrl(firstStore.logoUrl);
                                        handleLogoUrlChange(firstStore.logoUrl);
                                      }
                                      setFormData({ ...formData, ...updates } as any);
                                    }
                                  } else {
                                    setFormData({ ...formData, storeName: '' } as any);
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm text-gray-700">
                                {(store as any).storeId || store.id || (originalIndex + 1)} - {store.name}
                              </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center">
                <p className="text-sm text-gray-500">No stores available. Please create stores first.</p>
              </div>
            )}
            
            {/* Selected Stores Tags */}
            {selectedStoreIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedStoreIds.map((storeId) => {
                  const store = stores.find(s => s.id === storeId);
                  return store ? (
                    <span
                      key={storeId}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                    >
                      {store.name}
                      <button
                        type="button"
                        onClick={() => {
                          const newSelected = selectedStoreIds.filter(id => id !== storeId);
                          setSelectedStoreIds(newSelected);
                          if (newSelected.length > 0) {
                            const firstStore = stores.find(s => s.id === newSelected[0]);
                            if (firstStore) {
                              const updates: Partial<Coupon> = { storeName: firstStore.name };
                              // Auto-set logo from store if store has a logo
                              if (firstStore.logoUrl && firstStore.logoUrl.trim() !== '') {
                                updates.logoUrl = firstStore.logoUrl;
                                setLogoUrl(firstStore.logoUrl);
                                handleLogoUrlChange(firstStore.logoUrl);
                              }
                              setFormData({ ...formData, ...updates } as any);
                            }
                          } else {
                            setFormData({ ...formData, storeName: '' });
                          }
                        }}
                        className="text-blue-700 hover:text-blue-900 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Click to open dropdown and select stores. Store name will auto-populate from first selection.
            </p>
          </div>

          {/* Coupon Type Selection */}
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Coupon Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="couponType"
                  value="code"
                  checked={formData.couponType === 'code'}
                  onChange={(e) =>
                    setFormData({ ...formData, couponType: 'code' as const, code: formData.code || '' })
                  }
                  className="mr-2"
                />
                Code
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="couponType"
                  value="deal"
                  checked={formData.couponType === 'deal'}
                  onChange={(e) =>
                    setFormData({ ...formData, couponType: 'deal' as const, code: '' })
                  }
                  className="mr-2"
                />
                Deal
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Select whether this is a coupon code or a deal. Frontend will show "Get Code" for codes and "Get Deal" for deals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.couponType === 'code' && (
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1">
                  Coupon Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="code"
                  name="code"
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Required for code type coupons
                </p>
              </div>
            )}

            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1">
                Coupon Title (Optional)
              </label>
              <input
                id="title"
                name="title"
                type="text"
                placeholder="Coupon Title (e.g., 20% Off Sitewide)"
                value={formData.title || ''}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional: Title for this coupon (will be displayed on coupon card)
              </p>
            </div>
            
            <div>
              <label htmlFor="storeName" className="block text-sm font-semibold text-gray-700 mb-1">
                Store Name <span className="text-red-500">*</span>
              </label>
              <input
                id="storeName"
                name="storeName"
                type="text"
                placeholder="Store/Brand Name (e.g., Nike)"
                value={formData.storeName || ''}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value } as any)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Store name for this coupon (required)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maxUses" className="block text-sm font-semibold text-gray-700 mb-1">
                Max Uses
              </label>
              <input
                id="maxUses"
                name="maxUses"
                type="number"
                value={formData.maxUses || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxUses: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="currentUses" className="block text-sm font-semibold text-gray-700 mb-1">
              Current Uses
            </label>
            <input
              id="currentUses"
              name="currentUses"
              type="number"
              value={formData.currentUses || 0}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentUses: parseInt(e.target.value),
                })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ''}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-1">
              Coupon URL (Where user should be redirected when clicking "Get Deal")
            </label>
            <input
              id="url"
              name="url"
              type="url"
              placeholder="https://example.com/coupon-page"
              value={formData.url || ''}
              onChange={(e) =>
                setFormData({ ...formData, url: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              When user clicks "Get Deal", they will be redirected to this URL and the coupon code will be revealed.
            </p>
          </div>

          <div>
            <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 mb-1">
              Expiry Date (Optional)
            </label>
            <input
              id="expiryDate"
              name="expiryDate"
              type="date"
              value={
                formData.expiryDate
                  ? (() => {
                      try {
                        let date: Date;
                        if (formData.expiryDate instanceof Date) {
                          date = formData.expiryDate;
                        } else if (formData.expiryDate && typeof (formData.expiryDate as any).toDate === 'function') {
                          // Firestore Timestamp
                          date = (formData.expiryDate as any).toDate();
                        } else if (typeof formData.expiryDate === 'string') {
                          date = new Date(formData.expiryDate);
                        } else {
                          date = new Date(formData.expiryDate as any);
                        }
                        return date.toISOString().slice(0, 10);
                      } catch {
                        return '';
                      }
                    })()
                  : ''
              }
              onChange={(e) => {
                const dateValue = e.target.value;
                if (dateValue) {
                  const date = new Date(dateValue);
                  setFormData({ ...formData, expiryDate: date.toISOString() });
                } else {
                  setFormData({ ...formData, expiryDate: null });
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional: Set when this coupon expires. Leave empty if no expiry date.
            </p>
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-semibold text-gray-700 mb-1">
              Category
            </label>
            <select
              id="categoryId"
              name="categoryId"
              value={formData.categoryId || ''}
              onChange={(e) => {
                const categoryId = e.target.value || null;
                setFormData({ ...formData, categoryId });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Assign this coupon to a category
            </p>
          </div>

          <div>
            <label htmlFor="dealScope" className="block text-sm font-semibold text-gray-700 mb-1">
              Deal Scope (For Featured Deals Badge)
            </label>
            <select
              id="dealScope"
              name="dealScope"
              value={formData.dealScope || ''}
              onChange={(e) => {
                const dealScope = e.target.value || undefined;
                setFormData({ ...formData, dealScope: dealScope as 'sitewide' | 'online-only' | undefined });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default (SITEWIDE)</option>
              <option value="sitewide">SITEWIDE</option>
              <option value="online-only">ONLINE ONLY</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Select the scope of this deal. This will show as a badge on the Featured Deals section.
            </p>
          </div>

          <div>
            <label htmlFor="logoUrl" className="block text-sm font-semibold text-gray-700 mb-1">
              Logo URL (Cloudinary URL)
            </label>
            <input
              id="logoUrl"
              name="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => handleLogoUrlChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://res.cloudinary.com/..."
            />
            {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                <strong>Extracted Original URL:</strong>
                <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
              </div>
            )}
            {logoUrl && (
              <div className="mt-2">
                <img src={extractedLogoUrl || logoUrl} alt="Logo preview" className="h-16 object-contain" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <input
                id="isActive"
                name="isActive"
                type="checkbox"
                checked={formData.isActive || false}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isActive" className="text-gray-700">
                Active
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isLatest"
                name="isLatest"
                type="checkbox"
                checked={formData.isLatest || false}
                onChange={(e) => {
                  const isLatest = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isLatest,
                    // Clear layout position if latest is disabled
                    latestLayoutPosition: isLatest ? formData.latestLayoutPosition : null
                  });
                }}
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isLatest" className="text-gray-700">
                Mark as Latest
              </label>
            </div>

            <div className="flex items-center">
              <input
                id="isPopular"
                name="isPopular"
                type="checkbox"
                checked={formData.isPopular || false}
                onChange={(e) => {
                  const isPopular = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isPopular,
                    // Clear layout position if popular is disabled
                    layoutPosition: isPopular ? formData.layoutPosition : null
                  });
                }}
                className="w-4 h-4 rounded mr-2"
              />
              <label htmlFor="isPopular" className="text-gray-700">
                Mark as Popular
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="latestLayoutPosition" className="block text-sm font-semibold text-gray-700 mb-1">
                Latest Coupons Layout Position (1-8)
              </label>
              <select
                id="latestLayoutPosition"
                name="latestLayoutPosition"
                value={formData.latestLayoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ 
                    ...formData, 
                    latestLayoutPosition: position,
                    // Auto-enable latest if layout position is assigned
                    isLatest: position !== null ? true : formData.isLatest
                  });
                }}
                disabled={!formData.isLatest && !formData.latestLayoutPosition}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                  <option key={pos} value={pos}>
                    Layout {pos}
                  </option>
                ))}
              </select>
              {!formData.isLatest && !formData.latestLayoutPosition && (
                <p className="mt-1 text-xs text-gray-400">Enable "Mark as Latest" or select a layout position</p>
              )}
            </div>

            <div>
              <label htmlFor="layoutPosition" className="block text-sm font-semibold text-gray-700 mb-1">
                Popular Coupons Layout Position (1-8)
              </label>
              <select
                id="layoutPosition"
                name="layoutPosition"
                value={formData.layoutPosition || ''}
                onChange={(e) => {
                  const position = e.target.value ? parseInt(e.target.value) : null;
                  setFormData({ 
                    ...formData, 
                    layoutPosition: position,
                    // Auto-enable popular if layout position is assigned
                    isPopular: position !== null ? true : formData.isPopular
                  });
                }}
                disabled={!formData.isPopular && !formData.layoutPosition}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Not Assigned</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                  <option key={pos} value={pos}>
                    Layout {pos}
                  </option>
                ))}
              </select>
              {!formData.isPopular && !formData.layoutPosition && (
                <p className="mt-1 text-xs text-gray-400">Enable "Mark as Popular" or select a layout position</p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

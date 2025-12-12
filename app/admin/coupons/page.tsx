'use client';

import { useEffect, useState, useRef } from 'react';
import {
  getCoupons,
  createCoupon,
  createCouponFromUrl,
  updateCoupon,
  deleteCoupon,
  Coupon,
} from '@/lib/services/couponService';
import { getCategories, Category } from '@/lib/services/categoryService';
import Link from 'next/link';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';
import { getStores, Store } from '@/lib/services/storeService';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    storeName: '',
    discount: 0,
    discountType: 'percentage',
    description: '',
    isActive: true,
    maxUses: 100,
    currentUses: 0,
    expiryDate: null,
    isPopular: false,
    layoutPosition: null,
    isLatest: false,
    latestLayoutPosition: null,
    categoryId: null,
    couponType: 'code',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'file' | 'url'>('file');
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [uploadingToCloudinary, setUploadingToCloudinary] = useState(false);
  const [couponUrl, setCouponUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);

  const handleExportCoupons = () => {
    if (!coupons || coupons.length === 0) {
      alert('No coupons available to export.');
      return;
    }

    // Export all known coupon fields
    const headers = [
      'Coupon ID',
      'Code',
      'Store Name',
      'Store IDs',
      'Title',
      'Description',
      'Discount',
      'Discount Type',
      'Coupon URL',
      'Affiliate Link',
      'Logo URL',
      'Coupon Type',
      'Status',
      'Is Popular',
      'Popular Layout Position',
      'Is Latest',
      'Latest Layout Position',
      'Category ID',
      'Button Text',
      'Deal Scope',
      'Max Uses',
      'Current Uses',
      'Expiry Date',
      'User ID',
      'Created At',
      'Updated At',
    ];

    const escapeCsv = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatDate = (value: any): string => {
      if (!value) return '';
      if (value instanceof Date) {
        return value.toISOString();
      }
      if (value && typeof value.toDate === 'function') {
        // Firestore Timestamp
        return value.toDate().toISOString();
      }
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value).toISOString();
      }
      return '';
    };

    const rows = coupons.map((coupon) =>
      [
        escapeCsv(coupon.id),
        escapeCsv(coupon.code),
        escapeCsv(coupon.storeName),
        escapeCsv(coupon.storeIds && Array.isArray(coupon.storeIds) ? coupon.storeIds.join('; ') : ''),
        escapeCsv(coupon.title),
        escapeCsv(coupon.description),
        escapeCsv(coupon.discount),
        escapeCsv(coupon.discountType),
        escapeCsv(coupon.url),
        escapeCsv(coupon.affiliateLink),
        escapeCsv(coupon.logoUrl),
        escapeCsv(coupon.couponType),
        escapeCsv(coupon.isActive ? 'Active' : 'Inactive'),
        escapeCsv(coupon.isPopular ? 'Yes' : 'No'),
        escapeCsv(coupon.layoutPosition),
        escapeCsv(coupon.isLatest ? 'Yes' : 'No'),
        escapeCsv(coupon.latestLayoutPosition),
        escapeCsv(coupon.categoryId),
        escapeCsv(coupon.buttonText),
        escapeCsv(coupon.dealScope),
        escapeCsv(coupon.maxUses),
        escapeCsv(coupon.currentUses),
        escapeCsv(formatDate(coupon.expiryDate)),
        escapeCsv(coupon.userId),
        escapeCsv(formatDate((coupon as any).createdAt)),
        escapeCsv(formatDate((coupon as any).updatedAt)),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `coupons-full-records-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const fetchCoupons = async () => {
    setLoading(true);
    const data = await getCoupons();
    setCoupons(data);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [couponsData, categoriesData, storesData] = await Promise.all([
        getCoupons(),
        getCategories(),
        getStores()
      ]);
      setCoupons(couponsData);
      setCategories(categoriesData);
      setStores(storesData);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isCreating) return; // Prevent double submission
    
    setIsCreating(true);
    
    // Validate coupon code only if coupon type is 'code'
    if (formData.couponType === 'code' && (!formData.code || formData.code.trim() === '')) {
      alert('Please enter a coupon code (required for code type coupons)');
      setIsCreating(false);
      return;
    }
    
    // Validate required fields
    if (!formData.storeName || formData.storeName.trim() === '') {
      alert('Please enter a store name (Coupon Title)');
      setIsCreating(false);
      return;
    }
    
    // Check if popular layout position is already taken
    if (formData.layoutPosition && formData.isPopular) {
      const couponsAtPosition = coupons.filter(
        c => c.id && c.layoutPosition === formData.layoutPosition && c.isPopular
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Popular Layout ${formData.layoutPosition} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    // Check if latest layout position is already taken
    if (formData.latestLayoutPosition && formData.isLatest) {
      const couponsAtPosition = coupons.filter(
        c => c.id && c.latestLayoutPosition === formData.latestLayoutPosition && c.isLatest
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Latest Layout ${formData.latestLayoutPosition} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { latestLayoutPosition: null });
      }
    }
    
    // Only set layoutPosition if coupon is popular
    const layoutPositionToSave = formData.isPopular ? formData.layoutPosition : null;
    // Only set latestLayoutPosition if coupon is latest
    const latestLayoutPositionToSave = formData.isLatest ? formData.latestLayoutPosition : null;
    
    // Prepare coupon data
    const couponData: any = {
      ...formData,
      discountType: 'percentage', // Always use percentage
      layoutPosition: layoutPositionToSave,
      latestLayoutPosition: latestLayoutPositionToSave,
    };
    
    // For deal type, don't include code field
    if (formData.couponType === 'deal') {
      delete couponData.code;
    }
    
    // Always include storeIds (even if empty array) to ensure it's saved
    // Filter out any undefined/null values
    const validStoreIds = selectedStoreIds.filter(id => id && id.trim() !== '');
    couponData.storeIds = validStoreIds.length > 0 ? validStoreIds : [];
    
    // Debug log
    console.log('📝 Creating coupon with data:', {
      storeName: couponData.storeName,
      storeIds: couponData.storeIds,
      selectedStoreIds: selectedStoreIds,
      validStoreIds: validStoreIds,
      logoUrl: logoUrl,
      logoUploadMethod: logoUploadMethod,
      hasLogoFile: !!logoFile
    });
    
    try {
      let result;
      
      // Default placeholder image
      const defaultLogoUrl = 'https://www.iconpacks.net/icons/2/free-store-icon-2017-thumb.png';
      
      // If logoUrl is set (from Cloudinary upload), use URL method
      // Otherwise, if file is selected, try to upload it
      if (logoUrl && logoUrl.trim() !== '') {
        // Use the Cloudinary URL that was automatically uploaded
        console.log('Creating coupon with Cloudinary URL:', logoUrl);
        result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, logoUrl);
      } else if (logoUploadMethod === 'file' && logoFile) {
        // File upload method - upload to Cloudinary first, then create coupon
        console.log('Creating coupon with file upload, logoFile:', logoFile);
        result = await createCoupon(couponData as Omit<Coupon, 'id'>, logoFile || undefined);
      } else {
        // URL method - use default logo if no logoUrl is provided
        const finalLogoUrl = logoUrl && logoUrl.trim() !== '' ? logoUrl : defaultLogoUrl;
        console.log('Creating coupon with URL, logoUrl:', finalLogoUrl);
        result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, finalLogoUrl);
      }
      
      if (result.success) {
        alert('Coupon created successfully!');
        fetchCoupons();
        setShowForm(false);
        setFormData({
          code: '',
          storeName: '',
          discount: 0,
          discountType: 'percentage',
          description: '',
          url: '',
          isActive: true,
          maxUses: 100,
          currentUses: 0,
          expiryDate: null,
          isPopular: false,
          layoutPosition: null,
          isLatest: false,
          latestLayoutPosition: null,
          categoryId: null,
          couponType: 'code',
          buttonText: '',
        });
        setLogoFile(null);
        setLogoPreview(null);
        setLogoUrl('');
        setExtractedLogoUrl(null);
        setCouponUrl('');
        setFileInputKey(prev => prev + 1);
        setSelectedStoreIds([]); // Reset selected stores
        setUploadingToCloudinary(false); // Reset upload state
        setLogoUploadMethod('file'); // Reset to file method
      } else {
        // Show error message
        const errorMessage = result.error instanceof Error 
          ? result.error.message 
          : typeof result.error === 'string'
          ? result.error
          : 'Failed to create coupon. Please check console for details.';
        alert(`Error: ${errorMessage}`);
        console.error('Coupon creation failed:', result.error);
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
      alert(`Error creating coupon: ${error instanceof Error ? error.message : 'Unknown error. Please check console.'}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleExtractFromUrl = async () => {
    if (!couponUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: couponUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-populate form fields
        setFormData({
          ...formData,
          storeName: data.name || formData.storeName || '',
          description: data.description || formData.description || '',
          url: data.siteUrl || formData.url || '',
        });
        
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
          // Switch to URL upload method if logo is extracted
          setLogoUploadMethod('url');
        }

        // Show success message
        alert(`Successfully extracted data from ${data.name || 'the website'}!`);
      } else {
        alert(`Failed to extract metadata: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting metadata:', error);
      alert('Failed to extract metadata. Please check the URL and try again.');
    } finally {
      setExtracting(false);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (isCloudinaryUrl(url)) {
      const extracted = extractOriginalCloudinaryUrl(url);
      setExtractedLogoUrl(extracted);
      setLogoPreview(extracted);
    } else {
      setExtractedLogoUrl(null);
      setLogoPreview(url);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this coupon?')) {
      await deleteCoupon(id);
      fetchCoupons();
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    if (coupon.id) {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      fetchCoupons();
    }
  };

  const handleToggleLatest = async (coupon: Coupon) => {
    if (coupon.id) {
      const newLatestStatus = !coupon.isLatest;
      // If removing from latest, also clear layout position
      const updates: Partial<Coupon> = { 
        isLatest: newLatestStatus,
        ...(newLatestStatus ? {} : { latestLayoutPosition: null })
      };
      await updateCoupon(coupon.id, updates);
      fetchCoupons();
    }
  };

  const handleTogglePopular = async (coupon: Coupon) => {
    if (coupon.id) {
      const newPopularStatus = !coupon.isPopular;
      // If removing from popular, also clear layout position
      const updates: Partial<Coupon> = { 
        isPopular: newPopularStatus,
        ...(newPopularStatus ? {} : { layoutPosition: null })
      };
      await updateCoupon(coupon.id, updates);
      fetchCoupons();
    }
  };

  const handleAssignLatestLayoutPosition = async (coupon: Coupon, position: number | null) => {
    if (!coupon.id) return;
    
    // Check if position is already taken by another coupon
    if (position !== null) {
      const couponsAtPosition = coupons.filter(
        c => c.id !== coupon.id && c.latestLayoutPosition === position && c.isLatest
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Latest Layout ${position} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { latestLayoutPosition: null });
      }
    }
    
    await updateCoupon(coupon.id, { latestLayoutPosition: position });
    fetchCoupons();
  };

  const handleAssignLayoutPosition = async (coupon: Coupon, position: number | null) => {
    if (!coupon.id) return;
    
    // Check if position is already taken by another coupon
    if (position !== null) {
      const couponsAtPosition = coupons.filter(
        c => c.id !== coupon.id && c.layoutPosition === position && c.isPopular
      );
      if (couponsAtPosition.length > 0) {
        if (!confirm(`Popular Layout ${position} is already assigned to "${couponsAtPosition[0].code}". Replace it?`)) {
          return;
        }
        // Clear position from other coupon
        await updateCoupon(couponsAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    await updateCoupon(coupon.id, { layoutPosition: position });
    fetchCoupons();
  };

  // Filter coupons based on search query
  const filteredCoupons = searchQuery.trim() === '' 
    ? coupons 
    : coupons.filter(coupon => 
        coupon.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        coupon.code?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Coupons</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportCoupons}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold whitespace-nowrap"
          >
            Export Coupons (CSV)
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            {showForm ? 'Cancel' : 'Create New Coupon'}
          </button>
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <label htmlFor="searchStore" className="block text-sm font-semibold text-gray-700 mb-2">
            Search by Store Name or Coupon Code
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                id="searchStore"
                type="text"
                placeholder="Enter store name or coupon code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredCoupons.length}</span> of{' '}
              <span className="font-semibold">{coupons.length}</span> coupons
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Coupon
          </h2>
          
          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="couponUrl" className="block text-gray-700 text-sm font-semibold mb-2">
              Extract Coupon Info from URL (e.g., nike.com, amazon.com)
            </label>
            <div className="flex gap-2">
              <input
                id="couponUrl"
                name="couponUrl"
                type="text"
                value={couponUrl || ''}
                onChange={(e) => setCouponUrl(e.target.value)}
                placeholder="Enter website URL (e.g., nike.com or https://nike.com)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !couponUrl.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? 'Extracting...' : 'Extract Info'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              This will automatically extract description and logo from the website.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* Add this new section for store selection */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Add to Stores (Select one or more existing stores)
              </label>
              {stores.length > 0 ? (
                <div className="relative" ref={storeDropdownRef}>
                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between"
                  >
                    <span className="text-gray-700">
                      {selectedStoreIds.length > 0 
                        ? `${selectedStoreIds.length} store${selectedStoreIds.length > 1 ? 's' : ''} selected`
                        : 'Select stores...'}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isStoreDropdownOpen ? 'transform rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isStoreDropdownOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="p-2">
                        {stores.map((store) => {
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
                                  if (!store.id) {
                                    console.warn('⚠️ Store has no ID:', store);
                                    return;
                                  }
                                  
                                  let newSelected: string[];
                                  if (e.target.checked) {
                                    // Only add if not already selected
                                    if (!selectedStoreIds.includes(store.id)) {
                                      newSelected = [...selectedStoreIds, store.id];
                                    } else {
                                      newSelected = selectedStoreIds;
                                    }
                                  } else {
                                    newSelected = selectedStoreIds.filter(id => id !== store.id);
                                  }
                                  
                                  console.log('🛒 Store selection changed:', {
                                    storeId: store.id,
                                    storeName: store.name,
                                    isChecked: e.target.checked,
                                    newSelected: newSelected
                                  });
                                  
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
                                        // Switch to URL method if logo is set
                                        setLogoUploadMethod('url');
                                      }
                                      setFormData({ ...formData, ...updates });
                                    }
                                  } else {
                                    setFormData({ ...formData, storeName: '' });
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="ml-3 text-sm text-gray-700">{store.name}</span>
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
                                  // Switch to URL method if logo is set
                                  setLogoUploadMethod('url');
                                }
                                setFormData({ ...formData, ...updates });
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

            <div>
              <label htmlFor="buttonText" className="block text-gray-700 text-sm font-semibold mb-2">
                Custom "Get Code" Button Text (Optional)
              </label>
              <input
                id="buttonText"
                name="buttonText"
                type="text"
                placeholder="e.g., Get Code, Get Deal, Claim Now, Shop Now"
                value={formData.buttonText || ''}
                onChange={(e) =>
                  setFormData({ ...formData, buttonText: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Customize the button text. If left empty, it will default to "Get Code" for codes and "Get Deal" for deals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.couponType === 'code' && (
                <div>
                  <label htmlFor="code" className="block text-gray-700 text-sm font-semibold mb-2">
                    Coupon Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    placeholder="Coupon Code (e.g., SAVE20)"
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
                <label htmlFor="storeName" className="block text-gray-700 text-sm font-semibold mb-2">
                  Coupon Title
                </label>
                <input
                  id="storeName"
                  name="storeName"
                  type="text"
                  placeholder="Store/Brand Name (e.g., Nike)"
                  value={formData.storeName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, storeName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will be displayed on the coupon card instead of the coupon code
                </p>
              </div>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Logo Upload Method</label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="file"
                    checked={logoUploadMethod === 'file'}
                    onChange={(e) => {
                      setLogoUploadMethod('file');
                      setLogoUrl('');
                      setExtractedLogoUrl(null);
                    }}
                    className="mr-2"
                  />
                  File Upload
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="url"
                    checked={logoUploadMethod === 'url'}
                    onChange={(e) => {
                      setLogoUploadMethod('url');
                      setLogoFile(null);
                    }}
                    className="mr-2"
                  />
                  URL (Cloudinary)
                </label>
              </div>
              
              {logoUploadMethod === 'file' ? (
                <>
                  <label htmlFor="logo" className="sr-only">Logo (PNG / SVG)</label>
                  <input
                    id="logo"
                    name="logo"
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/jpg,image/webp"
                    onChange={async (e) => {
                      const file = e.target.files?.[0] ?? null;
                      setLogoFile(file);
                      
                      if (file) {
                        // Show preview immediately
                        setLogoPreview(URL.createObjectURL(file));
                        
                        // Automatically upload to Cloudinary
                        setUploadingToCloudinary(true);
                        try {
                          // Convert file to base64
                          const base64 = await new Promise<string>((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => {
                              const result = reader.result as string;
                              const base64 = result.split(',')[1]; // Remove data URL prefix
                              resolve(base64);
                            };
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });

                          // Upload to Cloudinary via API
                          const uploadResponse = await fetch('/api/coupons/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              fileName: file.name,
                              contentType: file.type || 'image/png',
                              base64: base64,
                            }),
                          });

                          const uploadData = await uploadResponse.json();

                          if (uploadData.success && uploadData.logoUrl) {
                            // Set the Cloudinary URL automatically
                            const cloudinaryUrl = uploadData.logoUrl;
                            setLogoUrl(cloudinaryUrl);
                            setExtractedLogoUrl(cloudinaryUrl);
                            
                            // Switch to URL method to show the uploaded URL
                            setLogoUploadMethod('url');
                            
                            console.log('✅ Logo uploaded to Cloudinary:', cloudinaryUrl);
                            console.log('📋 Cloudinary URL saved to state:', cloudinaryUrl);
                            alert('✅ Logo uploaded to Cloudinary successfully! URL has been copied.');
                          } else {
                            console.error('❌ Upload failed:', uploadData.error);
                            alert(`Upload failed: ${uploadData.error || 'Unknown error'}`);
                          }
                        } catch (error) {
                          console.error('❌ Error uploading to Cloudinary:', error);
                          alert(`Error uploading: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        } finally {
                          setUploadingToCloudinary(false);
                        }
                      } else {
                        setLogoPreview(null);
                        setLogoUrl('');
                        setExtractedLogoUrl(null);
                      }
                    }}
                    className="w-full"
                    key={`file-input-${fileInputKey}`}
                    disabled={uploadingToCloudinary}
                  />
                  {uploadingToCloudinary && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading to Cloudinary...</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                    Logo URL (Cloudinary URL)
                  </label>
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    value={logoUrl || ''}
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
                </>
              )}
              
              {/* Show Cloudinary URL if uploaded */}
              {logoUrl && logoUploadMethod === 'url' && (
                <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                  <strong>✅ Uploaded to Cloudinary:</strong>
                  <div className="mt-1 break-all text-xs">{logoUrl}</div>
                </div>
              )}
              
              {logoPreview && (
                <div className="mt-2">
                  <img src={logoPreview} alt="Logo preview" className="h-16 object-contain" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="maxUses" className="sr-only">Max Uses</label>
                <input
                  id="maxUses"
                  name="maxUses"
                  type="number"
                  placeholder="Max Uses"
                  value={formData.maxUses || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxUses: parseInt(e.target.value),
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="sr-only">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-gray-700 text-sm font-semibold mb-2">
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
              <label htmlFor="affiliateLink" className="block text-gray-700 text-sm font-semibold mb-2">
                Affiliate Link (Fallback URL)
              </label>
              <input
                id="affiliateLink"
                name="affiliateLink"
                type="url"
                placeholder="https://affiliate.com/store-link"
                value={formData.affiliateLink || ''}
                onChange={(e) =>
                  setFormData({ ...formData, affiliateLink: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                This affiliate link will be used if the Coupon URL above is not set. Great for tracking commissions!
              </p>
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-gray-700 text-sm font-semibold mb-2">
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
              <label htmlFor="dealScope" className="block text-gray-700 text-sm font-semibold mb-2">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  id="isActive"
                  name="isActive"
                  type="checkbox"
                  checked={formData.isActive || false}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-gray-700">Active</label>
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
                  className="mr-2"
                />
                <label htmlFor="isLatest" className="text-gray-700">Mark as Latest</label>
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
                  className="mr-2"
                />
                <label htmlFor="isPopular" className="text-gray-700">Mark as Popular</label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="latestLayoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Latest Coupons Layout Position (1-8)
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
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => {
                    const isTaken = coupons.some(
                      c => c.latestLayoutPosition === pos && c.isLatest && c.id
                    );
                    const takenBy = coupons.find(
                      c => c.latestLayoutPosition === pos && c.isLatest && c.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.code})` : ''}
                      </option>
                    );
                  })}
                </select>
                {!formData.isLatest && !formData.latestLayoutPosition && (
                  <p className="mt-1 text-xs text-gray-400">Enable "Mark as Latest" or select a layout position</p>
                )}
                {formData.latestLayoutPosition && (
                  <p className="mt-1 text-xs text-blue-600">
                    Coupon will be placed at Layout {formData.latestLayoutPosition} in Latest Coupons section
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Popular Coupons Layout Position (1-8)
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
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => {
                    const isTaken = coupons.some(
                      c => c.layoutPosition === pos && c.isPopular && c.id
                    );
                    const takenBy = coupons.find(
                      c => c.layoutPosition === pos && c.isPopular && c.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.code})` : ''}
                      </option>
                    );
                  })}
                </select>
                {!formData.isPopular && !formData.layoutPosition && (
                  <p className="mt-1 text-xs text-gray-400">Enable "Mark as Popular" or select a layout position</p>
                )}
                {formData.layoutPosition && (
                  <p className="mt-1 text-xs text-blue-600">
                    Coupon will be placed at Layout {formData.layoutPosition} in Popular Coupons section
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Coupon'
              )}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading coupons...</div>
      ) : coupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No coupons created yet</p>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No coupons found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-4 text-blue-600 hover:text-blue-800 underline"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-900">
                    Coupon ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Store Name
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Code
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Description
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);
                  
                  return paginatedCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-4">
                      <div className="font-mono text-xs text-gray-800 font-medium max-w-[120px] truncate" title={coupon.id}>
                        {coupon.id}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900">
                      {coupon.storeName || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 font-mono font-semibold text-xs sm:text-sm text-gray-900">
                      {coupon.code || 'N/A'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-800 max-w-xs truncate" title={coupon.description}>
                      {coupon.description || 'No description'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer whitespace-nowrap ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <Link
                          href={`/admin/coupons/${coupon.id}`}
                          className="inline-block bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-blue-200 text-center"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded text-xs sm:text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="text-sm text-gray-600 ml-4">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredCoupons.length)} - {Math.min(currentPage * itemsPerPage, filteredCoupons.length)} of {filteredCoupons.length}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                First
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              
              <span className="text-sm text-gray-700 px-3">
                Page {currentPage} of {Math.ceil(filteredCoupons.length / itemsPerPage)}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredCoupons.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredCoupons.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(filteredCoupons.length / itemsPerPage))}
                disabled={currentPage >= Math.ceil(filteredCoupons.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

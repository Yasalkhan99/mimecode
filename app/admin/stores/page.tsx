'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  getStores,
  createStore,
  updateStore,
  deleteStore,
  Store,
  isSlugUnique,
} from '@/lib/services/storeService';
import { getCategories, Category } from '@/lib/services/categoryService';
import { getActiveRegions, Region } from '@/lib/services/regionService';
import { extractOriginalCloudinaryUrl, isCloudinaryUrl } from '@/lib/utils/cloudinary';
import { getCoupons, Coupon } from '@/lib/services/couponService';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [couponSearchQuery, setCouponSearchQuery] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    subStoreName: '',
    slug: '',
    description: '',
    logoUrl: '',
    networkId: '',
    merchantId: '',
    trackingLink: '',
    countryCodes: '',
    isTrending: false,
    layoutPosition: null,
    categoryId: null,
  });
  const [slugError, setSlugError] = useState<string>('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState('');
  // console.log("stores: ", stores);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);
  // Coupons pagination states
  const [couponCurrentPage, setCouponCurrentPage] = useState(1);
  const [couponItemsPerPage, setCouponItemsPerPage] = useState(25);

  // Generate slug from name
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  };

  // Validate slug uniqueness
  const validateSlug = async (slug: string): Promise<boolean> => {
    if (!slug || slug.trim() === '') {
      setSlugError('Slug is required');
      return false;
    }
    
    // Check slug format (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens');
      return false;
    }
    
    const isUnique = await isSlugUnique(slug);
    if (!isUnique) {
      setSlugError('This slug is already taken. Please use a different one.');
      return false;
    }
    
    setSlugError('');
    return true;
  };
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [storeUrl, setStoreUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractingLogo, setExtractingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'url' | 'file'>('url');
  
  // Takeads import states
  const [takeadsApiKey, setTakeadsApiKey] = useState('');
  const [syncingMerchants, setSyncingMerchants] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleExportStores = () => {
    if (!stores || stores.length === 0) {
      alert('No stores available to export.');
      return;
    }

    // Export all known store fields
    const headers = [
      // 'Store UUID',
      'Store ID',
      'Merchant ID',
      'Store Name',
      'Sub Store Name',
      'Slug',
      'Description',
      'Logo URL',
      'Tracking Link',
      'Voucher Text',
      'Network ID',
      'Country',
      'Affiliate Fallback URL',
      'Category ID',
      'Layout Position',
      'Is Trending',
      'Rating',
      'Review Count',
      'Why Trust Us',
      'More Information',
      'SEO Title',
      'SEO Description',
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

    const rows = stores.map((store) =>
      [
        // escapeCsv(store.id), 
        escapeCsv((store as any).storeId), // external Store Id from Supabase row
        escapeCsv(store.merchantId),
        escapeCsv(store.name),
        escapeCsv((store as any).subStoreName),
        escapeCsv(store.slug),
        escapeCsv(store.description),
        escapeCsv(store.logoUrl),
        escapeCsv(store.trackingLink || store.trackingUrl || ''),
        escapeCsv(store.voucherText),
        escapeCsv(store.networkId),
        escapeCsv(store.countryCodes || ''),
        escapeCsv((store as any).affiliateFallbackUrl || (store as any).affiliateFallbackURL),
        escapeCsv(store.categoryId),
        escapeCsv(store.layoutPosition),
        escapeCsv(store.isTrending),
        escapeCsv(store.rating),
        escapeCsv(store.reviewCount),
        escapeCsv(store.whyTrustUs),
        escapeCsv(store.moreInformation),
        escapeCsv(store.seoTitle),
        escapeCsv(store.seoDescription),
        escapeCsv((store as any).createdAt),
        escapeCsv((store as any).updatedAt),
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().slice(0, 10);
    link.download = `stores-full-records-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchStores = async () => {
    setLoading(true);
    const data = await getStores();
    setStores(data);
    setCurrentPage(1); // Reset to first page when data changes
    setLoading(false);
    // Filter will be applied automatically via useEffect when stores state updates
  };

  // Test API key first
  const handleTestApiKey = async () => {
    if (!takeadsApiKey.trim()) {
      alert('Please enter your Takeads API key first');
      return;
    }

    setSyncMessage({ type: 'success', text: 'Testing API key...' });

    try {
      const response = await fetch('/api/takeads/test-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: takeadsApiKey,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncMessage({ type: 'success', text: `✅ ${data.message} Found ${data.testResult.merchantsFound} merchant(s).` });
      } else {
        const troubleshooting = data.troubleshooting ? '\n\n' + data.troubleshooting.join('\n') : '';
        setSyncMessage({ type: 'error', text: `${data.error}\n${data.message}${troubleshooting}` });
      }
    } catch (error: any) {
      setSyncMessage({ type: 'error', text: error.message || 'Failed to test API key' });
    }
  };

  // Handle Takeads merchants sync
  const handleSyncTakeadsMerchants = async () => {
    if (!takeadsApiKey.trim()) {
      alert('Please enter your Takeads API key');
      return;
    }

    setSyncingMerchants(true);
    setSyncMessage(null);

    try {
      const response = await fetch('/api/takeads/sync-merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: takeadsApiKey,
          limit: 500,
          isActive: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSyncMessage({ type: 'success', text: data.message });
        await fetchStores(); // Refresh stores list
      } else {
        // Show detailed error message
        const errorMsg = data.error || 'Failed to sync merchants';
        const troubleshooting = data.troubleshooting ? '\n\n' + data.troubleshooting.join('\n') : '';
        setSyncMessage({ type: 'error', text: `${errorMsg}${troubleshooting}` });
      }
    } catch (error: any) {
      setSyncMessage({ type: 'error', text: error.message || 'Failed to sync merchants' });
    } finally {
      setSyncingMerchants(false);
    }
  };

  // Filter stores based on search query
  useEffect(() => {
    if (stores.length === 0) return;
    
    if (searchQuery.trim() === '') {
      setFilteredStores(stores);
      setTotalItems(stores.length);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = stores.filter(store => 
        store.name?.toLowerCase().startsWith(query.toLowerCase()) ||
        String(store.merchantId || '').toLowerCase().includes(query) ||
        String(store.networkId || '').toLowerCase().includes(query) ||
        String((store as any).storeId || '').toLowerCase().includes(query)
      );
      setFilteredStores(filtered);
      setTotalItems(filtered.length);
    }
    setCurrentPage(1); // Reset to first page when search changes
  }, [searchQuery, stores]);

  // Filter coupons based on search query
  useEffect(() => {
    if (coupons.length === 0) return;
    
    if (couponSearchQuery.trim() === '') {
      setFilteredCoupons(coupons);
    } else {
      const query = couponSearchQuery.toLowerCase();
      const filtered = coupons.filter(coupon => 
        coupon.code?.toLowerCase().includes(query) ||
        coupon.storeName?.toLowerCase().includes(query) ||
        coupon.title?.toLowerCase().includes(query) ||
        coupon.description?.toLowerCase().includes(query)
      );
      setFilteredCoupons(filtered);
    }
    setCouponCurrentPage(1); // Reset to first page when search changes
  }, [couponSearchQuery, coupons]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [storesData, categoriesData, regionsData, couponsData] = await Promise.all([
        getStores(),
        getCategories(),
        getActiveRegions(),
        getCoupons()
      ]);
      // Sort stores by numeric ID (1, 2, 3...) to match coupon dropdown
      const sortedStores = storesData.sort((a, b) => {
        const idA = parseInt(String(a.id || '0'), 10) || 0;
        const idB = parseInt(String(b.id || '0'), 10) || 0;
        return idA - idB;
      });
      setStores(sortedStores);
      setCategories(categoriesData);
      setRegions(regionsData);
      setCoupons(couponsData);
      setFilteredCoupons(couponsData); // Initialize filtered coupons
      setLoading(false);
      // Filter will be applied automatically via useEffect when stores state updates
    };
    load();
  }, []);

  // Refresh stores when returning from edit page (check for refresh query param)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkAndRefresh = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const refreshParam = urlParams.get('refresh');
      
      if (refreshParam) {
        // Refresh stores list immediately with cache bypass
        fetchStores();
        // Clean up URL by removing refresh parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    };
    
    // Check immediately
    checkAndRefresh();
    
    // Also listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', checkAndRefresh);
    
    return () => {
      window.removeEventListener('popstate', checkAndRefresh);
    };
  }, []);

  // Load API key from environment on mount (if available via API)
  useEffect(() => {
    const loadApiKey = async () => {
      try {
        const response = await fetch('/api/takeads/get-api-key');
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            setTakeadsApiKey(data.apiKey);
          }
        }
      } catch (error) {
        // Silently fail - user can enter manually
      }
    };
    loadApiKey();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate slug
    if (!formData.slug || formData.slug.trim() === '') {
      alert('Please enter a slug for the store');
      return;
    }
    
    const slugValid = await validateSlug(formData.slug);
    if (!slugValid) {
      return;
    }
    
    // Check if layout position is already taken
    if (formData.layoutPosition && formData.isTrending) {
      const storesAtPosition = stores.filter(
        s => s.layoutPosition === formData.layoutPosition && s.isTrending
      );
      if (storesAtPosition.length > 0) {
        if (!confirm(`Layout ${formData.layoutPosition} is already assigned to "${storesAtPosition[0].name}". Replace it?`)) {
          return;
        }
        // Clear position from other store
        await updateStore(storesAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    // Extract original URL if it's a Cloudinary URL
    let logoUrlToSave = logoUrl ? extractOriginalCloudinaryUrl(logoUrl) : undefined;
    
    // If no logo URL is provided, use a default placeholder
    if (!logoUrlToSave || logoUrlToSave.trim() === '') {
      // Default placeholder image
      logoUrlToSave = 'https://www.iconpacks.net/icons/2/free-store-icon-2017-thumb.png';
    }
    
    // Only set layoutPosition if store is trending
    const layoutPositionToSave = formData.isTrending ? formData.layoutPosition : null;
    
    const storeData: Omit<Store, 'id'> = {
      name: formData.name || '',
      slug: formData.slug || '',
      description: formData.description || '',
      logoUrl: logoUrlToSave,
      networkId: formData.networkId || undefined,
      merchantId: formData.merchantId || undefined,
      trackingLink: formData.trackingLink || undefined,
      countryCodes: formData.countryCodes || undefined,
      isTrending: formData.isTrending || false,
      layoutPosition: layoutPositionToSave,
      categoryId: formData.categoryId || null,
    };
    
    const result = await createStore(storeData);
    
    if (result.success) {
      // Force refresh with delay to ensure cache is cleared
      await fetchStores();
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logoUrl: '',
        networkId: '',
        merchantId: '',
        trackingLink: '',
        countryCodes: '',
        isTrending: false,
        layoutPosition: null,
        categoryId: null,
      });
      setSlugError('');
      setAutoGenerateSlug(true);
      setLogoUrl('');
      setExtractedLogoUrl(null);
      setStoreUrl('');
      setLogoFile(null);
      setLogoUploadMethod('url');
    }
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

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this store?')) {
      try {
        const result = await deleteStore(id);
        if (result.success) {
          // Update local state immediately for instant UI update
          setStores(prevStores => prevStores.filter(store => store.id !== id));
          setFilteredStores(prevFiltered => prevFiltered.filter(store => store.id !== id));
          setTotalItems(prev => prev - 1);
          
          alert('Store deleted successfully!');
          
          // Also fetch fresh data from server to ensure sync
          await fetchStores();
        } else {
          alert(`Failed to delete store: ${result.error || 'Unknown error'}`);
        }
      } catch (error: any) {
        console.error('Delete error:', error);
        alert(`Error deleting store: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleToggleTrending = async (store: Store) => {
    if (store.id) {
      const newTrendingStatus = !store.isTrending;
      // If removing from trending, also clear layout position
      const updates: Partial<Store> = { 
        isTrending: newTrendingStatus,
        ...(newTrendingStatus ? {} : { layoutPosition: null })
      };
      await updateStore(store.id, updates);
      fetchStores();
    }
  };

  const handleAssignLayoutPosition = async (store: Store, position: number | null) => {
    if (!store.id) return;
    
    // Check if position is already taken by another store
    if (position !== null) {
      const storesAtPosition = stores.filter(
        s => s.id !== store.id && s.layoutPosition === position && s.isTrending
      );
      if (storesAtPosition.length > 0) {
        if (!confirm(`Layout ${position} is already assigned to "${storesAtPosition[0].name}". Replace it?`)) {
          return;
        }
        // Clear position from other store
        await updateStore(storesAtPosition[0].id!, { layoutPosition: null });
      }
    }
    
    await updateStore(store.id, { layoutPosition: position });
    fetchStores();
  };

  const handleExtractFromUrl = async () => {
    if (!storeUrl.trim()) {
      alert('Please enter a URL');
      return;
    }

    setExtracting(true);
    try {
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: storeUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-populate form fields
        setFormData({
          name: data.name || formData.name || '',
          description: data.description || formData.description || '',
          isTrending: formData.isTrending || false,
          layoutPosition: formData.layoutPosition || null,
        });
        
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
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

  const handleExtractLogoFromUrl = async () => {
    if (!logoUrl.trim()) {
      alert('Please enter a URL in the Logo URL field');
      return;
    }

    // Check if it's already a direct image URL
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp'];
    const isDirectImageUrl = imageExtensions.some(ext => 
      logoUrl.toLowerCase().includes(ext)
    );

    if (isDirectImageUrl) {
      // If it's already an image URL, just use it
      handleLogoUrlChange(logoUrl);
      return;
    }

    setExtractingLogo(true);
    try {
      // Extract all metadata from the URL (same as store extraction)
      const response = await fetch('/api/stores/extract-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: logoUrl }),
      });

      const data = await response.json();

      if (data.success) {
        // Only populate the logo field, even though we extracted all info
        if (data.logoUrl) {
          setLogoUrl(data.logoUrl);
          handleLogoUrlChange(data.logoUrl);
          alert('Logo extracted successfully!');
        } else {
          alert('Logo extracted but no logo URL found on this page. You may need to enter a direct image URL.');
        }
      } else {
        alert(`Failed to extract logo: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error extracting logo:', error);
      alert('Failed to extract logo. Please check the URL and try again.');
    } finally {
      setExtractingLogo(false);
    }
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (1 MB = 1048576 bytes)
    const maxSize = 1048576; // 1 MB
    if (file.size > maxSize) {
      alert(`File size exceeds 1 MB limit. Your file is ${(file.size / 1048576).toFixed(2)} MB. Please choose a smaller file.`);
      e.target.value = ''; // Clear the input
      return;
    }

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, SVG, etc.)');
      e.target.value = ''; // Clear the input
      return;
    }

    setLogoFile(file);
    setUploadingLogo(true);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1]; // Remove data URL prefix
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Upload to Cloudinary
      const uploadResponse = await fetch('/api/stores/upload-cloudinary', {
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
        // Set the Cloudinary URL
        setLogoUrl(uploadData.logoUrl);
        handleLogoUrlChange(uploadData.logoUrl);
        alert('✅ Logo uploaded to Cloudinary successfully!');
      } else {
        alert(`Upload failed: ${uploadData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert(`Error uploading: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingLogo(false);
      e.target.value = ''; // Clear the input after upload
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Stores</h1>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportStores}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-semibold whitespace-nowrap"
          >
            Export Stores (CSV)
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            {showForm ? 'Cancel' : 'Create New Store'}
          </button>
        </div>
      </div>

      {/* Takeads Import Section */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Merchants from Takeads
          </h3>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Takeads API Key
            </label>
            <input
              type="password"
              value={takeadsApiKey}
              onChange={(e) => setTakeadsApiKey(e.target.value)}
              placeholder="Enter your Takeads API key (Bearer token)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {takeadsApiKey && takeadsApiKey.length > 12 ? (
                <span className="text-green-600">✓ API key loaded from environment (TAKEADS_API_KEY)</span>
              ) : (
                <>
                  Get your API key from{' '}
                  <a 
                    href="https://developers.takeads.com" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline"
                  >
                    Takeads Developers
                  </a>
                  {' '}or set TAKEADS_API_KEY in your .env.local file
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleTestApiKey}
              disabled={!takeadsApiKey.trim()}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test API Key
            </button>
            <button
              onClick={handleSyncTakeadsMerchants}
              disabled={syncingMerchants || !takeadsApiKey.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 text-sm font-medium"
            >
              {syncingMerchants ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Import Merchants
                </>
              )}
            </button>
          </div>
          {syncMessage && (
            <div className={`p-3 rounded-md ${
              syncMessage.type === 'success' 
                ? 'bg-green-100 text-green-800 border border-green-200' 
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {syncMessage.type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <span className="text-sm font-medium">{syncMessage.text}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar - Always Visible */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <label htmlFor="searchStore" className="block text-sm font-semibold text-gray-700 mb-2">
            Search by Store Name
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                id="searchStore"
                type="text"
                placeholder="Enter store name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
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
              Showing <span className="font-semibold">{filteredStores.length}</span> of{' '}
              <span className="font-semibold">{stores.length}</span> stores
            </p>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Create New Store
          </h2>
          
          {/* URL Extraction Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <label htmlFor="storeUrl" className="block text-gray-700 text-sm font-semibold mb-2">
              Extract Store Info from URL (e.g., nike.com, amazon.com)
            </label>
            <div className="flex gap-2">
              <input
                id="storeUrl"
                name="storeUrl"
                type="text"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="Enter website URL (e.g., nike.com or https://nike.com)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !storeUrl.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extracting ? 'Extracting...' : 'Extract Info'}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-600">
              This will automatically extract store name, logo, description, and other information from the website.
            </p>
          </div>

          <form onSubmit={handleCreate} className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Store Details & Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Store Details & Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                  Store Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Store Name (e.g., Nike)"
                  value={formData.name || ''}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name,
                      // Auto-generate slug from name only if auto-generate is enabled
                      slug: autoGenerateSlug ? generateSlug(name) : formData.slug
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  required
                />
              </div>
              <div>
                <label htmlFor="subStoreName" className="block text-gray-700 text-sm font-semibold mb-2">
                  Sub Store Name (Displayed on store page)
                </label>
                <input
                  id="subStoreName"
                  name="subStoreName"
                  type="text"
                  placeholder="Sub Store Name (e.g., Nike Official Store)"
                  value={formData.subStoreName || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, subStoreName: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This name will be displayed on the store page when visiting the store
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="slug" className="block text-gray-700 text-sm font-semibold">
                    Slug (URL-friendly name)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoGenerateSlug}
                      onChange={(e) => {
                        const isAuto = e.target.checked;
                        setAutoGenerateSlug(isAuto);
                        // If enabling auto-generate, update slug from name
                        if (isAuto && formData.name) {
                          setFormData({ ...formData, slug: generateSlug(formData.name) });
                        }
                      }}
                      className="w-4 h-4"
                    />
                    <span>Auto-generate from name</span>
                  </label>
                </div>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  placeholder={autoGenerateSlug ? "Auto-generated from name" : "Enter custom slug (e.g., nike-store)"}
                  value={formData.slug || ''}
                  onChange={async (e) => {
                    // If auto-generate is enabled, don't allow manual editing
                    if (autoGenerateSlug) return;
                    
                    const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                    setFormData({ ...formData, slug });
                    if (slug) {
                      await validateSlug(slug);
                    } else {
                      setSlugError('');
                    }
                  }}
                  disabled={autoGenerateSlug}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    slugError ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  } ${autoGenerateSlug ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  required
                />
                {slugError && (
                  <p className="mt-1 text-xs text-red-600">{slugError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  URL will be: /stores/{formData.slug || 'slug'}
                  {autoGenerateSlug && <span className="text-blue-600 ml-2">(Auto-generated)</span>}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Logo Upload Method
              </label>
              <div className="flex gap-4 mb-3">
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
                  URL / Extract from Website
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoUploadMethod"
                    value="file"
                    checked={logoUploadMethod === 'file'}
                    onChange={(e) => {
                      setLogoUploadMethod('file');
                      setLogoUrl('');
                    }}
                    className="mr-2"
                  />
                  Upload File (Max 1 MB)
                </label>
              </div>

              {logoUploadMethod === 'url' ? (
                <>
                  <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                    Logo URL (Cloudinary URL, direct image URL, or website URL to extract logo)
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="logoUrl"
                      name="logoUrl"
                      type="url"
                      value={logoUrl}
                      onChange={(e) => handleLogoUrlChange(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                      placeholder="https://res.cloudinary.com/... or https://example.com/logo.png or https://example.com"
                    />
                    <button
                      type="button"
                      onClick={handleExtractLogoFromUrl}
                      disabled={extractingLogo || !logoUrl.trim()}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {extractingLogo ? 'Extracting...' : 'Extract Logo'}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Enter a direct image URL, Cloudinary URL, or a website URL to automatically extract the logo
                  </p>
                </>
              ) : (
                <>
                  <label htmlFor="logoFile" className="block text-gray-700 text-sm font-semibold mb-2">
                    Upload Logo File
                  </label>
                  <input
                    id="logoFile"
                    name="logoFile"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif"
                    onChange={handleLogoFileChange}
                    disabled={uploadingLogo}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingLogo && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading to Cloudinary...</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Select an image file (PNG, JPG, SVG, WebP, or GIF). Maximum file size: 1 MB. The file will be uploaded to Cloudinary and the URL will be automatically filled.
                  </p>
                </>
              )}
              {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Extracted Original URL:</strong>
                  <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
                </div>
              )}
              {logoUrl && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Logo Preview:</p>
                  <div className="flex items-center justify-start py-2">
                    <img 
                      src={extractedLogoUrl || logoUrl} 
                      alt="Logo preview" 
                      className="max-h-24 max-w-full object-contain"
                      // onError={(e) => {
                      //   (e.target as HTMLImageElement).style.display = 'none';
                      //   const parent = (e.target as HTMLImageElement).parentElement;
                      //   if (parent) {
                      //     parent.innerHTML = '<p class="text-sm text-gray-500">Failed to load image</p>';
                      //   }
                      // }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
                Description <span className="text-gray-500 font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                placeholder="Store Description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={3}
              />
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">No Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Assign this store to a category
              </p>
            </div>

            <div>
              <label htmlFor="whyTrustUs" className="block text-gray-700 text-sm font-semibold mb-2">
                Why Trust Us Section (Optional)
              </label>
              <textarea
                id="whyTrustUs"
                name="whyTrustUs"
                value={formData.whyTrustUs || ''}
                onChange={(e) =>
                  setFormData({ ...formData, whyTrustUs: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={4}
                placeholder="Why should customers trust this store? Enter custom content here..."
              />
              <p className="mt-1 text-xs text-gray-500">
                This will appear in the sidebar "Why Trust Us?" section. Leave blank to use default content.
              </p>
            </div>

            <div>
              <label htmlFor="moreInformation" className="block text-gray-700 text-sm font-semibold mb-2">
                More Information Section (Optional)
              </label>
              <textarea
                id="moreInformation"
                name="moreInformation"
                value={formData.moreInformation || ''}
                onChange={(e) =>
                  setFormData({ ...formData, moreInformation: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                rows={6}
                placeholder="Enter detailed information about the store, coupons, how to use them, etc. You can use HTML tags for formatting."
              />
              <p className="mt-1 text-xs text-gray-500">
                Supports HTML formatting. Leave blank to use default content.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="seoTitle" className="block text-gray-700 text-sm font-semibold mb-2">
                  SEO Page Title (Optional)
                </label>
                <input
                  id="seoTitle"
                  name="seoTitle"
                  type="text"
                  value={formData.seoTitle || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, seoTitle: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Best Nike Shoes Coupons & Deals 2024"
                  maxLength={60}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Shown in browser tab. Max 60 characters.
                </p>
              </div>

              <div>
                <label htmlFor="seoDescription" className="block text-gray-700 text-sm font-semibold mb-2">
                  SEO Meta Description (Optional)
                </label>
                <textarea
                  id="seoDescription"
                  name="seoDescription"
                  value={formData.seoDescription || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, seoDescription: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  rows={2}
                  placeholder="Get the latest Nike coupons & save up to 70%!"
                  maxLength={160}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Shown in search results. Max 160 characters.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <input
                  id="isTrending"
                  name="isTrending"
                  type="checkbox"
                  checked={formData.isTrending || false}
                  onChange={(e) => {
                    const isTrending = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      isTrending,
                      // Clear layout position if trending is disabled
                      layoutPosition: isTrending ? formData.layoutPosition : null
                    });
                  }}
                  className="mr-2"
                />
                <label htmlFor="isTrending" className="text-gray-700">Mark as Trending</label>
              </div>

              <div>
                <label htmlFor="layoutPosition" className="block text-gray-700 text-sm font-semibold mb-2">
                  Assign to Layout Position (1-8)
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
                      // Auto-enable trending if layout position is assigned
                      isTrending: position !== null ? true : formData.isTrending
                    });
                  }}
                  disabled={!formData.isTrending && !formData.layoutPosition}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Not Assigned</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => {
                    const isTaken = stores.some(
                      s => s.layoutPosition === pos && s.isTrending && s.id
                    );
                    const takenBy = stores.find(
                      s => s.layoutPosition === pos && s.isTrending && s.id
                    );
                    return (
                      <option key={pos} value={pos}>
                        Layout {pos} {isTaken ? `(Currently: ${takenBy?.name})` : ''}
                      </option>
                    );
                  })}
                </select>
                {!formData.isTrending && !formData.layoutPosition && (
                  <p className="mt-1 text-xs text-gray-400">Enable "Mark as Trending" or select a layout position</p>
                )}
                {formData.layoutPosition && (
                  <p className="mt-1 text-xs text-blue-600">
                    Store will be placed at Layout {formData.layoutPosition} in Trending Stores section
                  </p>
                )}
              </div>
            </div>
            </div>

            {/* Right Column: Technical & Affiliate Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Technical & Affiliate Information</h3>
              
              <div>
                <label htmlFor="networkId" className="block text-gray-700 text-sm font-semibold mb-2">
                  Network ID (Region)
                </label>
                <input
                  id="networkId"
                  name="networkId"
                  type="number"
                  value={formData.networkId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, networkId: e.target.value || undefined })
                  }
                  placeholder="Enter numeric Network ID (e.g., 1, 2, 100)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the numeric Network ID for this store. <Link href="/admin/regions" className="text-blue-600 hover:underline">Manage regions</Link>
                </p>
              </div>

              <div>
                <label htmlFor="merchantId" className="block text-gray-700 text-sm font-semibold mb-2">
                  Merchant ID
                </label>
                <input
                  id="merchantId"
                  name="merchantId"
                  type="text"
                  placeholder="Enter Merchant ID"
                  value={formData.merchantId || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, merchantId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter the Merchant ID for this store (e.g., from affiliate network)
                </p>
              </div>

              <div>
                <label htmlFor="trackingLink" className="block text-gray-700 text-sm font-semibold mb-2">
                  Tracking URL
                </label>
                <input
                  id="trackingLink"
                  name="trackingLink"
                  type="url"
                  placeholder="https://example.com/tracking-url"
                  value={formData.trackingLink || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, trackingLink: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Tracking/affiliate URL for this store. Used for redirecting users to the store.
                </p>
              </div>

              {/* Tracking Link Display */}
              {formData.trackingLink && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tracking Link (Display)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={formData.trackingLink}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = formData.trackingLink || '';
                        navigator.clipboard.writeText(url).then(() => {
                          alert('Tracking link copied to clipboard!');
                        }).catch(() => {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = url;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          alert('Tracking link copied to clipboard!');
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm whitespace-nowrap"
                    >
                      Copy URL
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This is the tracking/affiliate link for this store
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="countryCodes" className="block text-gray-700 text-sm font-semibold mb-2">
                  Country Codes
                </label>
                <input
                  id="countryCodes"
                  name="countryCodes"
                  type="text"
                  placeholder="US,GB,DE,FR (comma-separated)"
                  value={formData.countryCodes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, countryCodes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter country codes for this store (e.g., US,GB for United States and United Kingdom). Use comma to separate multiple countries.
                </p>
              </div>

              {/* Store Page URL Display */}
              {formData.slug && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Store Page URL (MimeCode)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/stores/${formData.slug}`}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/stores/${formData.slug}`;
                        navigator.clipboard.writeText(url).then(() => {
                          alert('Store page URL copied to clipboard!');
                        }).catch(() => {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = url;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          alert('Store page URL copied to clipboard!');
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm whitespace-nowrap"
                    >
                      Copy URL
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    This is the MimeCode store page URL where users can view this store
                  </p>
                </div>
              )}

              {/* Store Website URL Display */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Store Website URL (Display)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={formData.websiteUrl || 'Not set'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm"
                  />
                  {!formData.websiteUrl && formData.name && (
                    <button
                      type="button"
                      onClick={async () => {
                        // Try to guess website URL from store name
                        const storeName = formData.name || '';
                        const slug = formData.slug || '';
                        
                        // Generate possible URLs
                        const possibleUrls = [];
                        const nameSlug = slug || storeName.toLowerCase().replace(/[^a-z0-9]/g, '');
                        
                        if (nameSlug) {
                          possibleUrls.push(`https://${nameSlug}.com`);
                          possibleUrls.push(`https://www.${nameSlug}.com`);
                          possibleUrls.push(`https://${nameSlug}.co.uk`);
                          possibleUrls.push(`https://www.${nameSlug}.co.uk`);
                        }
                        
                        // Try first URL
                        if (possibleUrls.length > 0) {
                          const guessedUrl = possibleUrls[0];
                          if (confirm(`Auto-fetch website URL?\n\nTrying: ${guessedUrl}\n\nIf this is correct, it will be set automatically.`)) {
                            setFormData({ ...formData, websiteUrl: guessedUrl });
                            alert(`Website URL set to: ${guessedUrl}\n\nYou can edit it in the "Website URL" field above if needed.`);
                          }
                        } else {
                          alert('Please enter a store name or slug to auto-fetch the website URL.');
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm whitespace-nowrap"
                    >
                      Auto-Fetch
                    </button>
                  )}
                  {formData.websiteUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        const url = formData.websiteUrl || '';
                        navigator.clipboard.writeText(url).then(() => {
                          alert('Store website URL copied to clipboard!');
                        }).catch(() => {
                          // Fallback for older browsers
                          const textArea = document.createElement('textarea');
                          textArea.value = url;
                          document.body.appendChild(textArea);
                          textArea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textArea);
                          alert('Store website URL copied to clipboard!');
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-semibold text-sm whitespace-nowrap"
                    >
                      Copy URL
                    </button>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This is the actual website URL of the store (e.g., https://halfdays.com). Click "Auto-Fetch" to guess from store name.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold mt-6"
          >
            Create Store
          </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">Loading stores...</div>
      ) : stores.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No stores created yet</p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No stores found matching "{searchQuery}"</p>
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
            <table className="w-full table-fixed">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-28">
                    Store ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-32">
                    Merchant ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-20">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Store Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 w-40">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-28">
                    Network ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-24">
                    Country
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-48">
                    Tracking Link
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Calculate pagination
                  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
                  const startIndex = (currentPage - 1) * itemsPerPage;
                  const endIndex = startIndex + itemsPerPage;
                  const paginatedStores = filteredStores.slice(startIndex, endIndex);
                  
                  return paginatedStores.map((store, index) => (
                  <tr key={store.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-800 font-medium truncate" title={store.id}>
                        {(store as any).storeId || store.id || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-800 font-medium truncate" title={store.merchantId}>
                        {store.merchantId || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {store.logoUrl ? (
                        <img
                          src={store.logoUrl}
                          alt={store.name}
                          className="h-12 w-12 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 truncate">
                      {store.name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-800 font-mono" title={store.slug || ''}>
                      <div className="max-w-[200px] truncate">
                        {store.slug || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-mono text-center">
                      {store.networkId || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800 text-center">
                      {store.countryCodes || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        // Use trackingLink if available, otherwise fallback to trackingUrl
                        const linkToShow = store.trackingLink && store.trackingLink.trim() 
                          ? store.trackingLink 
                          : (store.trackingUrl && store.trackingUrl.trim() ? store.trackingUrl : null);
                        
                        return linkToShow ? (
                          <a
                            href={linkToShow}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline truncate block text-sm max-w-xs"
                            title={linkToShow}
                        >
                            {linkToShow.length > 40 
                              ? `${linkToShow.substring(0, 40)}...` 
                              : linkToShow}
                        </a>
                      ) : (
                          <span className="text-gray-400 text-sm" title="No tracking link available">-</span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <Link
                        href={`/admin/stores/${store.id}`}
                        className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(store.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
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
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, filteredStores.length)} - {Math.min(currentPage * itemsPerPage, filteredStores.length)} of {filteredStores.length}
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
                Page {currentPage} of {Math.ceil(filteredStores.length / itemsPerPage)}
              </span>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredStores.length / itemsPerPage), prev + 1))}
                disabled={currentPage >= Math.ceil(filteredStores.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(Math.ceil(filteredStores.length / itemsPerPage))}
                disabled={currentPage >= Math.ceil(filteredStores.length / itemsPerPage)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Last
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Section */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Manage Coupons</h2>
          <Link
            href="/admin/coupons"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            Go to Coupons Page
          </Link>
        </div>

        {/* Coupon Search Bar */}
        <div className="mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <label htmlFor="searchCoupon" className="block text-sm font-semibold text-gray-700 mb-2">
              Search by Coupon Code, Store Name, or Title
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <input
                  id="searchCoupon"
                  type="text"
                  placeholder="Enter coupon code, store name, or title"
                  value={couponSearchQuery}
                  onChange={(e) => setCouponSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
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
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading coupons...</p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No coupons found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-32">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-40">
                      Store Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-32">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-40">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-24">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-24">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-32">
                      Uses
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-32">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 w-40">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Calculate pagination
                    const totalPages = Math.ceil(filteredCoupons.length / couponItemsPerPage);
                    const startIndex = (couponCurrentPage - 1) * couponItemsPerPage;
                    const endIndex = startIndex + couponItemsPerPage;
                    const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);
                    
                    return paginatedCoupons.map((coupon) => {
                      let expiryDate: Date | null = null;
                      if (coupon.expiryDate) {
                        if (typeof (coupon.expiryDate as any).toDate === 'function') {
                          // Firestore Timestamp
                          expiryDate = (coupon.expiryDate as any).toDate();
                        } else if (coupon.expiryDate instanceof Date) {
                          expiryDate = coupon.expiryDate;
                        } else if (typeof coupon.expiryDate === 'string' || typeof coupon.expiryDate === 'number') {
                          expiryDate = new Date(coupon.expiryDate);
                        }
                      }
                      const isExpired = expiryDate ? expiryDate < new Date() : false;
                      
                      return (
                        <tr key={coupon.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm text-gray-800 font-semibold truncate" title={coupon.code}>
                              {coupon.code || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900 truncate">
                            {coupon.storeName || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discount}%` 
                              : `$${coupon.discount}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 truncate" title={coupon.title || ''}>
                            {coupon.title || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              coupon.couponType === 'deal' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {coupon.couponType === 'deal' ? 'Deal' : 'Code'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-center">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              !coupon.isActive || isExpired
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {isExpired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800 text-center">
                            {coupon.currentUses || 0} / {coupon.maxUses || 0}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {expiryDate 
                              ? expiryDate.toLocaleDateString() 
                              : '-'}
                          </td>
                          <td className="px-6 py-4 space-x-2">
                            <Link
                              href={`/admin/coupons?edit=${coupon.id}`}
                              className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                            >
                              Edit
                            </Link>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Coupons Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Items per page:</label>
                <select
                  value={couponItemsPerPage}
                  onChange={(e) => {
                    setCouponItemsPerPage(Number(e.target.value));
                    setCouponCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm text-gray-900"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm text-gray-600 ml-4">
                  Showing {Math.min((couponCurrentPage - 1) * couponItemsPerPage + 1, filteredCoupons.length)} - {Math.min(couponCurrentPage * couponItemsPerPage, filteredCoupons.length)} of {filteredCoupons.length}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCouponCurrentPage(1)}
                  disabled={couponCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCouponCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={couponCurrentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="text-sm text-gray-700 px-3">
                  Page {couponCurrentPage} of {Math.ceil(filteredCoupons.length / couponItemsPerPage)}
                </span>
                
                <button
                  onClick={() => setCouponCurrentPage(prev => Math.min(Math.ceil(filteredCoupons.length / couponItemsPerPage), prev + 1))}
                  disabled={couponCurrentPage >= Math.ceil(filteredCoupons.length / couponItemsPerPage)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCouponCurrentPage(Math.ceil(filteredCoupons.length / couponItemsPerPage))}
                  disabled={couponCurrentPage >= Math.ceil(filteredCoupons.length / couponItemsPerPage)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


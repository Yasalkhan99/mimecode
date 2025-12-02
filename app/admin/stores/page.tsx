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

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchNetworkId, setSearchNetworkId] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Store>>({
    name: '',
    subStoreName: '',
    slug: '',
    description: '',
    logoUrl: '',
    voucherText: '',
    networkId: '',
    isTrending: false,
    layoutPosition: null,
    categoryId: null,
  });
  const [slugError, setSlugError] = useState<string>('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState<boolean>(true);
  const [logoUrl, setLogoUrl] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [totalItems, setTotalItems] = useState(0);

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

  const fetchStores = async () => {
    setLoading(true);
    const data = await getStores();
    setStores(data);
    // Apply current search filter if any
    if (searchNetworkId) {
      const filtered = data.filter(store => 
        store.networkId?.toLowerCase().includes(searchNetworkId.toLowerCase())
      );
      setFilteredStores(filtered);
    } else {
      setFilteredStores(data);
    }
    setTotalItems(data.length);
    setCurrentPage(1); // Reset to first page when data changes
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [storesData, categoriesData, regionsData] = await Promise.all([
        getStores(),
        getCategories(),
        getActiveRegions()
      ]);
      setStores(storesData);
      setFilteredStores(storesData);
      setCategories(categoriesData);
      setRegions(regionsData);
      setLoading(false);
    };
    load();
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
    const logoUrlToSave = logoUrl ? extractOriginalCloudinaryUrl(logoUrl) : undefined;
    
    // Only set layoutPosition if store is trending
    const layoutPositionToSave = formData.isTrending ? formData.layoutPosition : null;
    
    const storeData: Omit<Store, 'id'> = {
      name: formData.name || '',
      slug: formData.slug || '',
      description: formData.description || '',
      logoUrl: logoUrlToSave,
      voucherText: formData.voucherText || undefined,
      networkId: formData.networkId || undefined,
      isTrending: formData.isTrending || false,
      layoutPosition: layoutPositionToSave,
      categoryId: formData.categoryId || null,
    };
    
    const result = await createStore(storeData);
    
    if (result.success) {
      fetchStores();
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        logoUrl: '',
        voucherText: '',
        networkId: '',
        isTrending: false,
        layoutPosition: null,
        categoryId: null,
      });
      setSlugError('');
      setAutoGenerateSlug(true);
      setLogoUrl('');
      setExtractedLogoUrl(null);
      setStoreUrl('');
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
          alert('Store deleted successfully!');
          fetchStores();
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Stores</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Create New Store'}
        </button>
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

          <form onSubmit={handleCreate} className="space-y-4">
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
              <label htmlFor="logoUrl" className="block text-gray-700 text-sm font-semibold mb-2">
                Logo URL (Cloudinary URL or direct URL)
              </label>
              <input
                id="logoUrl"
                name="logoUrl"
                type="url"
                value={logoUrl}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="https://res.cloudinary.com/... or https://example.com/logo.png"
              />
              {extractedLogoUrl && extractedLogoUrl !== logoUrl && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                  <strong>Extracted Original URL:</strong>
                  <div className="mt-1 break-all text-xs">{extractedLogoUrl}</div>
                </div>
              )}
              {logoUrl && (
                <div className="mt-2">
                  <img 
                    src={extractedLogoUrl || logoUrl} 
                    alt="Logo preview" 
                    className="h-16 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="description" className="sr-only">Description</label>
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
                required
              />
            </div>

            <div>
              <label htmlFor="voucherText" className="block text-gray-700 text-sm font-semibold mb-2">
                Voucher Text
              </label>
              <input
                id="voucherText"
                name="voucherText"
                type="text"
                placeholder="e.g., Upto 58% Voucher, Get 20% Off, etc."
                value={formData.voucherText || ''}
                onChange={(e) =>
                  setFormData({ ...formData, voucherText: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                Voucher text that will be displayed on the store card (e.g., "Upto 58% Voucher")
              </p>
            </div>

            <div>
              <label htmlFor="networkId" className="block text-gray-700 text-sm font-semibold mb-2">
                Network ID (Region)
              </label>
              <select
                id="networkId"
                name="networkId"
                value={formData.networkId || ''}
                onChange={(e) =>
                  setFormData({ ...formData, networkId: e.target.value || undefined })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">No Network ID</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.networkId}>
                    {region.name} ({region.networkId})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Select the region/network ID for this store. <Link href="/admin/regions" className="text-blue-600 hover:underline">Manage regions</Link>
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
              <div>
                <label htmlFor="rating" className="block text-gray-700 text-sm font-semibold mb-2">
                  Rating (0.0 - 5.0)
                </label>
                <input
                  id="rating"
                  name="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  placeholder="4.5"
                  value={formData.rating || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Store rating displayed as stars (e.g., 4.5 = 4.5 stars)
                </p>
              </div>

              <div>
                <label htmlFor="reviewCount" className="block text-gray-700 text-sm font-semibold mb-2">
                  Review Count
                </label>
                <input
                  id="reviewCount"
                  name="reviewCount"
                  type="number"
                  min="0"
                  placeholder="123"
                  value={formData.reviewCount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, reviewCount: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Number of reviews (e.g., "123 reviews")
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

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
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
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold">
                    Store ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Store Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Voucher Text
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Network ID
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Trending
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Layout Position
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
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
                  
                  return paginatedStores.map((store) => (
                  <tr key={store.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-mono text-xs text-gray-600 max-w-[120px] truncate" title={store.id}>
                        {store.id}
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
                    <td className="px-6 py-4 font-semibold">
                      {store.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                      {store.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 font-medium">
                      {store.voucherText || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                      {store.networkId || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleTrending(store)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                          store.isTrending
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {store.isTrending ? 'Trending' : 'Not Trending'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={store.layoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLayoutPosition(store, position);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!store.isTrending}
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                      {!store.isTrending && (
                        <p className="text-xs text-gray-400 mt-1">Enable Trending first</p>
                      )}
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
    </div>
  );
}


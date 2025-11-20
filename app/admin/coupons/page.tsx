'use client';

import { useEffect, useState } from 'react';
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
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploadMethod, setLogoUploadMethod] = useState<'file' | 'url'>('file');
  const [logoUrl, setLogoUrl] = useState('');
  const [extractedLogoUrl, setExtractedLogoUrl] = useState<string | null>(null);
  const [couponUrl, setCouponUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const fetchCoupons = async () => {
    setLoading(true);
    const data = await getCoupons();
    setCoupons(data);
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [couponsData, categoriesData] = await Promise.all([
        getCoupons(),
        getCategories()
      ]);
      setCoupons(couponsData);
      setCategories(categoriesData);
      setLoading(false);
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    const couponData = {
      ...formData,
      layoutPosition: layoutPositionToSave,
      latestLayoutPosition: latestLayoutPositionToSave,
    };
    
    let result;
    if (logoUploadMethod === 'file') {
      result = await createCoupon(couponData as Omit<Coupon, 'id'>, logoFile || undefined);
    } else {
      result = await createCouponFromUrl(couponData as Omit<Coupon, 'id'>, logoUrl || undefined);
    }
    
    if (result.success) {
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
      });
      setLogoFile(null);
      setLogoPreview(null);
      setLogoUrl('');
      setExtractedLogoUrl(null);
      setCouponUrl('');
      setFileInputKey(prev => prev + 1);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Coupons</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showForm ? 'Cancel' : 'Create New Coupon'}
        </button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-gray-700 text-sm font-semibold mb-2">
                  Coupon Code
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
              </div>
              <div>
                <label htmlFor="storeName" className="block text-gray-700 text-sm font-semibold mb-2">
                  Store Name (Displayed on coupon card)
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        accept="image/png,image/svg+xml"
                        onChange={(e) => {
                          const file = e.target.files?.[0] ?? null;
                          setLogoFile(file);
                          if (file) {
                            setLogoPreview(URL.createObjectURL(file));
                          } else {
                            setLogoPreview(null);
                          }
                        }}
                        className="w-full"
                        key={`file-input-${fileInputKey}`}
                      />
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
                  {logoPreview && (
                    <div className="mt-2">
                      <img src={logoPreview} alt="Logo preview" className="h-16 object-contain" />
                    </div>
                  )}
                </div>
              <div>
                <label htmlFor="discount" className="sr-only">Discount Value</label>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  placeholder="Discount Value"
                  value={formData.discount || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseFloat(e.target.value),
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="discountType" className="sr-only">Discount Type</label>
                <select
                  id="discountType"
                  name="discountType"
                  value={formData.discountType || 'percentage'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as 'percentage' | 'fixed',
                    })
                  }
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (AED)</option>
              </select>
              </div>
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Create Coupon
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
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Uses
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Latest
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Latest Layout
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Popular
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Popular Layout
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono font-semibold">
                      {coupon.code}
                    </td>
                    <td className="px-6 py-4">
                      {coupon.discount}
                      {coupon.discountType === 'percentage' ? '%' : ' AED'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {coupon.description}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {coupon.currentUses} / {coupon.maxUses}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                          coupon.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleLatest(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                          coupon.isLatest
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {coupon.isLatest ? 'Latest' : 'Not Latest'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={coupon.latestLayoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLatestLayoutPosition(coupon, position);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!coupon.isLatest}
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                      {!coupon.isLatest && (
                        <p className="text-xs text-gray-400 mt-1">Enable Latest first</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePopular(coupon)}
                        className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                          coupon.isPopular
                            ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {coupon.isPopular ? 'Popular' : 'Not Popular'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={coupon.layoutPosition || ''}
                        onChange={(e) => {
                          const position = e.target.value ? parseInt(e.target.value) : null;
                          handleAssignLayoutPosition(coupon, position);
                        }}
                        className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!coupon.isPopular}
                      >
                        <option value="">Not Assigned</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                          <option key={pos} value={pos}>
                            Layout {pos}
                          </option>
                        ))}
                      </select>
                      {!coupon.isPopular && (
                        <p className="text-xs text-gray-400 mt-1">Enable Popular first</p>
                      )}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <Link
                        href={`/admin/coupons/${coupon.id}`}
                        className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
